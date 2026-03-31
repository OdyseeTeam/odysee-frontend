import {
  Input,
  BlobSource,
  Output,
  Mp4OutputFormat,
  Conversion,
  ALL_FORMATS,
  StreamTarget,
  EncodedVideoPacketSource,
  EncodedAudioPacketSource,
  EncodedPacketSink,
  VideoSampleSource,
  AudioSampleSource,
  AudioSampleSink,
  VideoSampleSink,
  getFirstEncodableVideoCodec,
} from 'odysee-media-usagi';

let paused = false;
const waiters: (() => void)[] = [];
let hooksInstalled = false;
let control: Int32Array | null = null;
let lastReportedProgress = 0;
let pauseAnnounced = false;
let controlVersion = 0;

function shouldPause() {
  return control ? Atomics.load(control, 0) === 1 : paused;
}

function waitForUnpause(): Promise<void> {
  if (control) return Promise.resolve();
  if (!paused) return Promise.resolve();
  return new Promise((resolve) => {
    waiters.push(resolve);
  });
}

function resumeAll() {
  while (waiters.length > 0) {
    waiters.shift()();
  }
}

function blockWhilePaused() {
  if (!shouldPause()) return;

  if (!pauseAnnounced) {
    pauseAnnounced = true;
    self.postMessage({ type: 'paused', progress: lastReportedProgress, version: controlVersion }); // eslint-disable-line unicorn/require-post-message-target-origin
  }

  if (!control) return;

  while (Atomics.load(control, 0) === 1) {
    Atomics.wait(control, 0, 1);
  }

  pauseAnnounced = false;
}

async function pauseCheckpoint() {
  blockWhilePaused();
  if (!control) {
    await waitForUnpause();
  }
}

(globalThis as any).__mediabunnyPauseGate = pauseCheckpoint;

function installPauseHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;

  const wrapPauseableMethod = (target: any, methodName: string) => {
    const original = target?.prototype?.[methodName];

    if (!original || original.__pauseWrapped) return;

    const wrapped = async function pauseableMethod(...args: any[]) {
      await pauseCheckpoint();
      return original.apply(this, args);
    };

    wrapped.__pauseWrapped = true;
    target.prototype[methodName] = wrapped;
  };

  wrapPauseableMethod(EncodedVideoPacketSource, 'add');
  wrapPauseableMethod(EncodedAudioPacketSource, 'add');
  wrapPauseableMethod(VideoSampleSource, 'add');
  wrapPauseableMethod(AudioSampleSource, 'add');

  const originalReportProgress = (Conversion as any).prototype?._reportProgress;
  if (originalReportProgress && !originalReportProgress.__pauseWrapped) {
    const wrappedReportProgress = function wrappedReportProgress(...args: any[]) {
      blockWhilePaused();
      return originalReportProgress.apply(this, args);
    };

    wrappedReportProgress.__pauseWrapped = true;
    (Conversion as any).prototype._reportProgress = wrappedReportProgress;
  }
}

function updateReportedProgress(progress: number) {
  lastReportedProgress = progress;
  self.postMessage({ type: 'progress', progress: lastReportedProgress, version: controlVersion }); // eslint-disable-line unicorn/require-post-message-target-origin
}

type OutputWrite = {
  position: number;
  data: Uint8Array;
};

type OutputSegment = {
  start: number;
  end: number;
  data: Uint8Array;
};

function assembleOutputBlob(writes: OutputWrite[]) {
  const segments: OutputSegment[] = [];

  for (const write of writes) {
    const nextStart = write.position;
    const nextEnd = nextStart + write.data.byteLength;

    if (nextEnd <= nextStart) continue;

    const nextSegments: OutputSegment[] = [];

    for (const segment of segments) {
      if (segment.end <= nextStart || segment.start >= nextEnd) {
        nextSegments.push(segment);
        continue;
      }

      if (segment.start < nextStart) {
        nextSegments.push({
          start: segment.start,
          end: nextStart,
          data: segment.data.subarray(0, nextStart - segment.start),
        });
      }

      if (segment.end > nextEnd) {
        nextSegments.push({
          start: nextEnd,
          end: segment.end,
          data: segment.data.subarray(nextEnd - segment.start),
        });
      }
    }

    nextSegments.push({
      start: nextStart,
      end: nextEnd,
      data: write.data,
    });

    nextSegments.sort((a, b) => a.start - b.start);
    segments.length = 0;
    segments.push(...nextSegments);
  }

  const blobParts: any[] = [];
  let cursor = 0;

  for (const segment of segments) {
    if (segment.start > cursor) {
      blobParts.push(new Uint8Array(segment.start - cursor));
    }
    if (segment.end > cursor) {
      const sliceStart = Math.max(0, cursor - segment.start);
      blobParts.push(segment.data.subarray(sliceStart));
      cursor = segment.end;
    }
  }

  return new Blob(blobParts, { type: 'video/mp4' });
}

async function runManualPacketCopy(input: Input, output: Output, tracks: any[], _fileSize: number) {
  const startTimestamp = Math.max(await input.getFirstTimestamp(), 0);
  const trackProgress = new Map<number, number>();
  const trackDurations = new Map<number, number>();
  const trackWeights = new Map<number, number>();
  let lastProgress = -1;

  await Promise.all(
    tracks.map(async (track) => {
      const duration = Math.max(0, await track.computeDuration());
      trackDurations.set(track.id, duration);
      trackWeights.set(track.id, duration);
      trackProgress.set(track.id, 0);
    })
  );

  const supportedAudioCodecs = output.format.getSupportedAudioCodecs();
  const audioTracks = tracks.filter((track) => track.isAudioTrack());
  const convertibleAudioTrackIds = new Set<number>(
    (
      await Promise.all(
        audioTracks.map(async (track) => {
          const codec = track.codec;
          if (codec && supportedAudioCodecs.includes(codec)) {
            return track.id;
          }

          if (await track.canDecode()) {
            return track.id;
          }

          return null;
        })
      )
    ).filter((trackId): trackId is number => trackId !== null)
  );

  if (audioTracks.length > 0 && convertibleAudioTrackIds.size === 0) {
    throw new Error('No audio tracks can be decoded for conversion.');
  }

  const publishProgress = () => {
    const entries = Array.from(trackProgress.entries());
    if (entries.length === 0) return;

    const totalWeight = entries.reduce((sum, [trackId]) => sum + (trackWeights.get(trackId) || 0), 0);
    const weightedProgress =
      totalWeight > 0
        ? entries.reduce((sum, [trackId, value]) => sum + value * (trackWeights.get(trackId) || 0), 0) / totalWeight
        : entries.reduce((sum, [, value]) => sum + value, 0) / entries.length;
    const progress = Math.max(0, Math.min(100, Math.floor(weightedProgress * 10) / 10));

    if (progress !== lastProgress) {
      lastProgress = progress;
      updateReportedProgress(progress);
    }
  };

  const reportTrackProgress = (trackId: number, endTimestamp: number) => {
    const duration = trackDurations.get(trackId) || 0;
    const trackPercent = duration > 0 ? Math.max(0, Math.min(100, (Math.max(0, endTimestamp) / duration) * 100)) : 100;

    trackProgress.set(trackId, trackPercent);
    publishProgress();
  };

  const tasks: Array<() => Promise<void>> = [];

  for (const track of tracks) {
    if (track.isVideoTrack()) {
      const codec = track.codec;
      const videoMetadata = {
        languageCode: track.languageCode !== 'und' ? track.languageCode : undefined,
        name: track.name || undefined,
        disposition: track.disposition,
        rotation: track.rotation,
      };

      if (codec && output.format.getSupportedVideoCodecs().includes(codec)) {
        const source = new EncodedVideoPacketSource(codec);
        output.addVideoTrack(source, videoMetadata);

        tasks.push(async () => {
          const sink = new EncodedPacketSink(track);
          const decoderConfig = await track.getDecoderConfig();
          const meta = { decoderConfig: decoderConfig ?? undefined };

          for await (const packet of sink.packets(undefined, undefined, { verifyKeyPackets: true })) {
            await pauseCheckpoint();

            const adjustedTimestamp = packet.timestamp - startTimestamp;
            if (adjustedTimestamp < 0) continue;

            const nextPacket = packet.clone({
              timestamp: adjustedTimestamp,
              sideData: packet.sideData,
            });

            await source.add(nextPacket, meta);
            reportTrackProgress(track.id, adjustedTimestamp + packet.duration);
          }

          source.close();
          trackProgress.set(track.id, 100);
          publishProgress();
        });
        continue;
      }

      const targetCodec = await getFirstEncodableVideoCodec(output.format.getSupportedVideoCodecs(), {
        width: track.displayWidth,
        height: track.displayHeight,
        bitrate: 5_000_000,
      });

      if (!targetCodec) {
        throw new Error(`Video track codec ${codec || 'unknown'} cannot be encoded for MP4 conversion.`);
      }

      const source = new VideoSampleSource({
        codec: targetCodec,
        bitrate: 5_000_000,
        keyFrameInterval: 2,
        sizeChangeBehavior: 'passThrough',
      });
      output.addVideoTrack(source, videoMetadata);

      tasks.push(async () => {
        if (!(await track.canDecode())) {
          throw new Error(`Video track codec ${codec || 'unknown'} cannot be decoded for conversion.`);
        }

        const sink = new VideoSampleSink(track);
        for await (const sample of sink.samples(undefined, undefined)) {
          await pauseCheckpoint();

          sample.setTimestamp(sample.timestamp - startTimestamp);
          if (sample.timestamp < 0) {
            sample.close();
            continue;
          }

          await source.add(sample);
          reportTrackProgress(track.id, sample.timestamp + sample.duration);
          sample.close();
        }

        source.close();
        trackProgress.set(track.id, 100);
        publishProgress();
      });
      continue;
    }

    if (track.isAudioTrack()) {
      const codec = track.codec;
      const audioMetadata = {
        languageCode: track.languageCode !== 'und' ? track.languageCode : undefined,
        name: track.name || undefined,
        disposition: track.disposition,
      };

      if (!convertibleAudioTrackIds.has(track.id)) {
        trackProgress.delete(track.id);
        trackDurations.delete(track.id);
        trackWeights.delete(track.id);
        continue;
      }

      if (codec && output.format.getSupportedAudioCodecs().includes(codec)) {
        const source = new EncodedAudioPacketSource(codec);
        output.addAudioTrack(source, audioMetadata);

        tasks.push(async () => {
          const sink = new EncodedPacketSink(track);
          const decoderConfig = await track.getDecoderConfig();
          const meta = { decoderConfig: decoderConfig ?? undefined };

          for await (const packet of sink.packets(undefined, undefined)) {
            await pauseCheckpoint();

            const adjustedTimestamp = packet.timestamp - startTimestamp;
            if (adjustedTimestamp < 0) continue;

            const nextPacket = packet.clone({ timestamp: adjustedTimestamp });
            await source.add(nextPacket, meta);
            reportTrackProgress(track.id, adjustedTimestamp + packet.duration);
          }

          source.close();
          trackProgress.set(track.id, 100);
          publishProgress();
        });
        continue;
      }

      const source = new AudioSampleSource({
        codec: 'aac',
        bitrate: 128_000,
      });
      output.addAudioTrack(source, audioMetadata);

      tasks.push(async () => {
        if (!(await track.canDecode())) {
          throw new Error(`Audio track codec ${codec || 'unknown'} cannot be decoded for conversion.`);
        }

        const sink = new AudioSampleSink(track);
        for await (const sample of sink.samples(undefined, undefined)) {
          await pauseCheckpoint();

          sample.setTimestamp(sample.timestamp - startTimestamp);
          if (sample.timestamp < 0) {
            sample.close();
            continue;
          }

          await source.add(sample);
          reportTrackProgress(track.id, sample.timestamp + sample.duration);
          sample.close();
        }

        source.close();
        trackProgress.set(track.id, 100);
        publishProgress();
      });
      continue;
    }
  }

  const metadataTags = await input.getMetadataTags();
  if (metadataTags) {
    output.setMetadataTags(metadataTags);
  }

  publishProgress();
  await output.start();
  await Promise.all(tasks.map((task) => task()));
  await output.finalize();
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, file, options, controlBuffer, version } = e.data;

  if (type === 'pause') {
    if (typeof version === 'number') {
      controlVersion = version;
    }
    paused = true;
    return;
  }

  if (type === 'resume') {
    if (typeof version === 'number') {
      controlVersion = version;
    }
    paused = false;
    pauseAnnounced = false;
    resumeAll();
    self.postMessage({ type: 'resumed', progress: lastReportedProgress, version: controlVersion }); // eslint-disable-line unicorn/require-post-message-target-origin
    self.postMessage({ type: 'progress', progress: lastReportedProgress, version: controlVersion }); // eslint-disable-line unicorn/require-post-message-target-origin
    return;
  }

  if (type !== 'convert' && type !== 'optimize') return;

  try {
    installPauseHooks();
    if (controlBuffer) {
      control = new Int32Array(controlBuffer);
    }

    const source = new BlobSource(file);
    const input = new Input({ formats: ALL_FORMATS, source });

    const sourceWithRead = source as any;
    const originalRead = sourceWithRead._read.bind(sourceWithRead);
    sourceWithRead._read = (start: number, end: number) => {
      blockWhilePaused();
      if (!shouldPause()) return originalRead(start, end);
      return waitForUnpause().then(() => originalRead(start, end));
    };

    const writes: { position: number; data: Uint8Array }[] = [];

    const writable = new WritableStream({
      write(chunk) {
        const doWrite = () => {
          writes.push({ position: chunk.position, data: new Uint8Array(chunk.data) });
        };

        blockWhilePaused();
        if (!shouldPause()) {
          doWrite();
          return;
        }
        return waitForUnpause().then(doWrite);
      },
    });

    const target = new StreamTarget(writable, { chunked: true });
    const format = new Mp4OutputFormat();
    const output = new Output({ format, target });

    let conversionOptions: any = { input, output };

    if (type === 'convert') {
      conversionOptions.video = { forceTranscode: false };
      conversionOptions.audio = { forceTranscode: false };
    } else if (type === 'optimize') {
      conversionOptions.video = {
        codec: 'avc',
        bitrate: options?.videoBitrate || 5_000_000,
        keyFrameInterval: 2,
      };
      conversionOptions.audio = {
        codec: 'aac',
        bitrate: options?.audioBitrate || 128_000,
      };
    }

    const tracks = await input.getTracks();
    const avTracks = tracks.filter((track) => track.isVideoTrack() || track.isAudioTrack());

    const canUseManualPacketCopy = type === 'convert' && avTracks.length > 0;

    if (canUseManualPacketCopy) {
      await runManualPacketCopy(input, output, avTracks, file.size);
    } else {
      const conversion = await Conversion.init(conversionOptions);

      conversion.onProgress = (p: number) => {
        blockWhilePaused();
        updateReportedProgress(Math.round(p * 100));
      };

      await conversion.execute();
    }
    input.dispose();

    const blob = assembleOutputBlob(writes);
    const outputFile = new File([blob], file.name.replace(/\.[^.]+$/, '.mp4'), { type: 'video/mp4' });

    self.postMessage({ type: 'done', file: outputFile }); // eslint-disable-line unicorn/require-post-message-target-origin
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err?.message || 'Unknown error' }); // eslint-disable-line unicorn/require-post-message-target-origin
  }
});
