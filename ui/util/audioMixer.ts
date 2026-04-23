export class AudioMixer {
  private ctx: AudioContext;
  private destination: MediaStreamAudioDestinationNode;
  private sources: Map<string, { node: MediaStreamAudioSourceNode; gain: GainNode }> = new Map();

  constructor() {
    this.ctx = new AudioContext();
    this.destination = this.ctx.createMediaStreamDestination();
  }

  addSource(id: string, stream: MediaStream, volume: number = 1): void {
    this.removeSource(id);
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const audioStream = new MediaStream(audioTracks);
    const node = this.ctx.createMediaStreamSource(audioStream);
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    node.connect(gain);
    gain.connect(this.destination);
    this.sources.set(id, { node, gain });
  }

  removeSource(id: string): void {
    const source = this.sources.get(id);
    if (source) {
      source.node.disconnect();
      source.gain.disconnect();
      this.sources.delete(id);
    }
  }

  setVolume(id: string, volume: number): void {
    const source = this.sources.get(id);
    if (source) {
      source.gain.gain.value = volume;
    }
  }

  getOutputStream(): MediaStream {
    return this.destination.stream;
  }

  dispose(): void {
    for (const [id] of this.sources) {
      this.removeSource(id);
    }
    this.ctx.close();
  }
}
