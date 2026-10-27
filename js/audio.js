// audio.js - Generador de efectos de sonido procedurales con Web Audio API
// Sin dependencias de archivos externos para garantizar funcionamiento inmediato

class SoundController {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.masterGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.4, this.ctx.currentTime);
        }
        return this.muted;
    }

    // Disparo contundente: sub-graves + ráfaga de ruido blanco con envolvente exponencial
    playGunshot() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        // 1. Golpe de presión / Sub-grave
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

        oscGain.gain.setValueAtTime(0.9, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);

        // 2. Ruido blanco de la detonación
        const bufferSize = this.ctx.sampleRate * 0.25;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4500, now);
        filter.frequency.exponentialRampToValueAtTime(350, now + 0.22);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        whiteNoise.start(now);
        whiteNoise.stop(now + 0.25);
    }

    // Impacto metálico ("Ding" o "Clang" de chapa de acero)
    playTargetHit(isBullseye = false) {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        const frequencies = isBullseye 
            ? [1800, 2400, 3200] // Tono más brillante y agudo para diana perfecta
            : [980, 1420, 2100];  // Tono metálico clásico

        frequencies.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            const duration = isBullseye ? 0.6 : 0.4;
            const initialVolume = (0.5 / (idx + 1));

            gain.gain.setValueAtTime(initialVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + duration);
        });
    }

    // Sonido de rebote / fallo (ricochet)
    playRicochet() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.2);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, now);
        filter.Q.value = 5;

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Sonido de recarga
    playReload() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        // Clic mecánico 1 (abrir tambor/cerrojo)
        this._playClick(now, 1200, 0.05);
        // Clic mecánico 2 (cerrar tambor/cerrojo)
        this._playClick(now + 0.22, 1600, 0.07);
    }

    // Gatillo sin munición
    playEmptyClick() {
        if (this.muted) return;
        this.init();
        this._playClick(this.ctx.currentTime, 750, 0.04);
    }

    _playClick(time, freq, dur) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + dur);
    }
}

window.soundController = new SoundController();
