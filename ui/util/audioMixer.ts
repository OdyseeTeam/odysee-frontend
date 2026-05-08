type SourceEntry = {
  node: AudioNode;
  gain: GainNode;
  analyser: AnalyserNode;
  buffer: Uint8Array;
};

export class AudioMixer {
  private ctx: AudioContext;
  private destination: MediaStreamAudioDestinationNode;
  private masterGain: GainNode;
  private masterAnalyser: AnalyserNode;
  private masterBuffer: Uint8Array;
  private sources: Map<string, SourceEntry> = new Map();

  constructor() {
    this.ctx = new AudioContext();
    this.destination = this.ctx.createMediaStreamDestination();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 1024;
    this.masterAnalyser.smoothingTimeConstant = 0.6;
    this.masterBuffer = new Uint8Array(this.masterAnalyser.fftSize);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.destination);
  }

  addSource(id: string, stream: MediaStream, volume: number = 1): void {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.removeSource(id);
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const audioStream = new MediaStream(audioTracks);
    const node = this.ctx.createMediaStreamSource(audioStream);
    this.connectSource(id, node, volume);
  }

  addElementSource(id: string, element: HTMLMediaElement, volume: number = 1): void {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.removeSource(id);
    const node = this.ctx.createMediaElementSource(element);
    this.connectSource(id, node, volume);
    const entry = this.sources.get(id);
    if (entry) entry.gain.connect(this.ctx.destination);
  }

  private connectSource(id: string, node: AudioNode, volume: number) {
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    const buffer = new Uint8Array(analyser.fftSize);
    node.connect(gain);
    gain.connect(analyser);
    analyser.connect(this.masterGain);
    this.sources.set(id, { node, gain, analyser, buffer });
  }

  removeSource(id: string): void {
    const source = this.sources.get(id);
    if (source) {
      source.node.disconnect();
      source.gain.disconnect();
      source.analyser.disconnect();
      this.sources.delete(id);
    }
  }

  setVolume(id: string, volume: number): void {
    const source = this.sources.get(id);
    if (source) {
      source.gain.gain.value = volume;
    }
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = volume;
  }

  getMasterVolume(): number {
    return this.masterGain.gain.value;
  }

  getSourceLevel(id: string): number {
    const source = this.sources.get(id);
    if (!source) return 0;
    return readRms(source.analyser, source.buffer);
  }

  getMasterLevel(): number {
    return readRms(this.masterAnalyser, this.masterBuffer);
  }

  getOutputStream(): MediaStream {
    return this.destination.stream;
  }

  dispose(): void {
    for (const [id] of this.sources) {
      this.removeSource(id);
    }
    try {
      this.masterGain.disconnect();
      this.masterAnalyser.disconnect();
    } catch {}
    this.ctx.close();
  }
}

function readRms(analyser: AnalyserNode, buffer: Uint8Array): number {
  analyser.getByteTimeDomainData(buffer as any);
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const v = (buffer[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / buffer.length);
}
