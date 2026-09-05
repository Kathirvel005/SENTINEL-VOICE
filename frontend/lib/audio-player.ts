export class AudioPlaybackClient {
  private ctx: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private eqLow: BiquadFilterNode | null = null;
  private eqMid: BiquadFilterNode | null = null;
  private eqHigh: BiquadFilterNode | null = null;
  
  private isPlaying: boolean = false;
  private queue: AudioBuffer[] = [];
  private currentSource: AudioBufferSourceNode | null = null;
  private activeVersion: number | null = null;
  public volume: number = 1.0;

  // Streaming chunk accumulator to ensure clean MP3 frame boundary decoding
  private pendingChunks: Uint8Array[] = [];
  private pendingVersion: number | null = null;

  constructor() {
    // Lazy initialization on first user gesture
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master processing chain:
      // Source -> Analyser -> EQ Low -> EQ Mid -> EQ High -> Compressor -> Gain -> Destination
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // 3-Band Studio Vocal Equalizer
      this.eqLow = this.ctx.createBiquadFilter();
      this.eqLow.type = "lowshelf";
      this.eqLow.frequency.setValueAtTime(120, this.ctx.currentTime);
      this.eqLow.gain.setValueAtTime(2.0, this.ctx.currentTime); // Vocal chest/warmth

      this.eqMid = this.ctx.createBiquadFilter();
      this.eqMid.type = "peaking";
      this.eqMid.frequency.setValueAtTime(3200, this.ctx.currentTime);
      this.eqMid.Q.setValueAtTime(1.2, this.ctx.currentTime);
      this.eqMid.gain.setValueAtTime(3.0, this.ctx.currentTime); // Consonant presence & clarity

      this.eqHigh = this.ctx.createBiquadFilter();
      this.eqHigh.type = "highshelf";
      this.eqHigh.frequency.setValueAtTime(10000, this.ctx.currentTime);
      this.eqHigh.gain.setValueAtTime(1.5, this.ctx.currentTime); // High-end studio air

      // Broadcast Dynamics Compressor (eliminates harsh spikes and prevents clipping)
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.20, this.ctx.currentTime);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume * 1.3, this.ctx.currentTime);

      // Connect DSP chain
      this.analyser.connect(this.eqLow);
      this.eqLow.connect(this.eqMid);
      this.eqMid.connect(this.eqHigh);
      this.eqHigh.connect(this.compressor);
      this.compressor.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(2.0, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume * 1.3, this.ctx.currentTime);
    }
  }

  public setEqualizer(warmthDb: number = 2.0, clarityDb: number = 3.0, airDb: number = 1.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.eqLow) this.eqLow.gain.setValueAtTime(warmthDb, now);
    if (this.eqMid) this.eqMid.gain.setValueAtTime(clarityDb, now);
    if (this.eqHigh) this.eqHigh.gain.setValueAtTime(airDb, now);
  }

  public setVersion(version: number) {
    this.activeVersion = version;
    if (this.pendingVersion !== version) {
      this.pendingChunks = [];
      this.pendingVersion = version;
    }
  }

  /* ---------------- Acoustic Earcons (Synthesized Sound Effects) ---------------- */

  public playInterruptWhoosh() {
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      // Reverse pitch sweep downward
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // Audio cue fallback
    }
  }

  public playRecoverChime() {
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      // Upward pleasant harmonic chime
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      // Audio cue fallback
    }
  }

  public playStartCue() {
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // Audio cue fallback
    }
  }

  /* ---------------- High-Fidelity Audio Chunk Playback ---------------- */

  public async enqueueBase64Wav(base64Data: string, taskVersion: number, isLast: boolean = false) {
    this.init();
    if (!this.ctx) return;

    // Fencing: ignore if taskVersion does not match active version
    if (this.activeVersion !== null && taskVersion !== this.activeVersion) {
      console.warn(`[AudioPlayer] Fenced audio chunk v${taskVersion} (active is v${this.activeVersion})`);
      return;
    }

    try {
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      if (len === 0 && !isLast) return;

      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Check if this single chunk is already a complete, decodable WAV or MP3
      const isCompleteWav = len > 44 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46; // "RIFF"

      // If standalone complete container or isLast is triggered, try decoding directly
      if (isCompleteWav || isLast) {
        let bufferToDecode: ArrayBuffer;

        if (this.pendingChunks.length > 0 && taskVersion === this.pendingVersion) {
          if (len > 0) this.pendingChunks.push(bytes);
          const totalLength = this.pendingChunks.reduce((acc, c) => acc + c.length, 0);
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          for (const c of this.pendingChunks) {
            combined.set(c, offset);
            offset += c.length;
          }
          this.pendingChunks = [];
          bufferToDecode = combined.buffer;
        } else {
          bufferToDecode = bytes.buffer.slice(0);
        }

        if (bufferToDecode.byteLength > 0) {
          try {
            const audioBuffer = await this.ctx.decodeAudioData(bufferToDecode);
            if (audioBuffer && (this.activeVersion === null || taskVersion === this.activeVersion)) {
              this.queue.push(audioBuffer);
              if (!this.isPlaying) {
                this.playNext();
              }
            }
          } catch (decodeErr) {
            console.warn("[AudioPlayer] decodeAudioData deferred on chunk boundary");
          }
        }
      } else {
        // Accumulate streaming MP3 chunk until complete frame boundary / isLast
        if (this.pendingVersion !== taskVersion) {
          this.pendingChunks = [];
          this.pendingVersion = taskVersion;
        }
        this.pendingChunks.push(bytes);

        // Periodically attempt decode on accumulated MP3 stream when sufficient data has arrived (> 16KB)
        const currentLen = this.pendingChunks.reduce((acc, c) => acc + c.length, 0);
        if (currentLen > 16384) {
          const combined = new Uint8Array(currentLen);
          let offset = 0;
          for (const c of this.pendingChunks) {
            combined.set(c, offset);
            offset += c.length;
          }
          try {
            const audioBuffer = await this.ctx.decodeAudioData(combined.buffer.slice(0));
            if (audioBuffer && (this.activeVersion === null || taskVersion === this.activeVersion)) {
              this.pendingChunks = [];
              this.queue.push(audioBuffer);
              if (!this.isPlaying) {
                this.playNext();
              }
            }
          } catch (e) {
            // Wait for more chunks to resolve frame boundary
          }
        }
      }
    } catch (err) {
      console.warn("[AudioPlayer] Error processing audio chunk:", err);
    }
  }

  private playNext() {
    if (this.queue.length === 0 || !this.ctx) {
      this.isPlaying = false;
      this.currentSource = null;
      return;
    }

    this.isPlaying = true;
    const buffer = this.queue.shift()!;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    if (this.analyser) {
      source.connect(this.analyser);
    } else {
      source.connect(this.ctx.destination);
    }

    this.currentSource = source;

    source.onended = () => {
      this.playNext();
    };

    source.start(0);
  }

  public stop(): number {
    const t0 = performance.now();

    // 1. Immediately cancel any active speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // 2. Clear accumulated streaming chunks
    this.pendingChunks = [];
    this.pendingVersion = null;

    // 3. Play audible interruption sweep earcon (< 5ms)
    this.playInterruptWhoosh();
    
    // 4. Immediately stop and disconnect currently playing Web Audio node
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // Source may already have ended
      }
      this.currentSource = null;
    }

    // 5. Empty the queue of all pending audio buffers
    const cleared = this.queue.length;
    this.queue = [];
    this.isPlaying = false;
    this.activeVersion = null;

    const stopLatency = performance.now() - t0;
    console.log(`[AudioPlayer] INTERRUPTED & STOPPED. Cleared ${cleared} buffers. Cutoff time: ${stopLatency.toFixed(2)}ms`);
    return stopLatency;
  }
}

