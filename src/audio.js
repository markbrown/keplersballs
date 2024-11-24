import Roid from "./roid.js";

// fx
import Crash from "./crash.mp3";
import Hit from "./hit.mp3";
import Pop from "./pop.mp3";
import Win from "./win.mp3";

export default function Audio() {
    this.ctx = null;
    this.fxGain = null;
    this.musicGain = null;
    this.musicSource = null;
    this.fx = true;
    this.music = true;
    this.loaded = false;
    this.playing = true;
}

Audio.SAMPLE_OFFSET = 0.5;
Audio.SAMPLE_LENGTH = 0.4;
Audio.POP_VARIANTS = 4;

Audio.prototype.setup = function() {
    this.ctx = new AudioContext();
    (async () => {
        this.hitBuffer = await this.load(Hit);
        this.popBuffer = await this.load(Pop);
        this.crashBuffer = await this.load(Crash);
        this.winBuffer = await this.load(Win);
        let { default: piece1 } = await import("../music/piece1.mp3");
        let { default: piece2 } = await import("../music/piece2.mp3");
        this.playingBuffer = await this.load(piece1);
        this.stoppedBuffer = await this.load(piece2);
        this.loaded = true;
        this.startMusic();
    })();

    this.fxGain = this.ctx.createGain();
    this.fxGain.connect(this.ctx.destination);
    if (!this.fx) {
        this.disableFx();
    }

    this.musicGain = this.ctx.createGain();
    this.musicGain.connect(this.ctx.destination);
    if (!this.music) {
        this.disableMusic();
    }
}

Audio.prototype.load = function(url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => this.ctx.decodeAudioData(data));
}

Audio.prototype.enableFx = function() {
    if (this.fxGain) {
        this.fxGain.gain.value = 1;
    }
    this.fx = true;
}

Audio.prototype.disableFx = function() {
    if (this.fxGain) {
        this.fxGain.gain.value = 0;
    }
    this.fx = false;
}

Audio.prototype.enableMusic = function() {
    if (this.musicGain) {
        this.musicGain.gain.value = 1;
    }
    this.music = true;
}

Audio.prototype.disableMusic = function() {
    if (this.musicGain) {
        this.musicGain.gain.value = 0;
    }
    this.music = false;
}

Audio.prototype.startPlaying = function() {
    this.playing = true;
    if (this.loaded) {
        this.startMusic();
    }
}

Audio.prototype.stopPlaying = function() {
    this.playing = false;
    if (this.loaded) {
        this.startMusic();
    }
}

Audio.prototype.startMusic = function() {
    if (!this.loaded) {
        return;
    }

    this.stopMusic();

    let buffer = this.playing ? this.playingBuffer : this.stoppedBuffer;
    this.musicSource = this.ctx.createBufferSource();
    this.musicSource.loop = true;
    this.musicSource.buffer = buffer;
    this.musicSource.connect(this.musicGain);
    this.musicSource.start();
}

Audio.prototype.stopMusic = function() {
    if (this.musicSource) {
        this.musicSource.stop();
    }
}

Audio.prototype.hit = function() {
    this.playSample(this.hitBuffer, 0);
}

Audio.prototype.pop = function(size) {
    let variant = Math.floor(Math.random() * Audio.POP_VARIANTS);
    let sample = variant * Roid.info.length + size;
    this.playSample(this.popBuffer, sample);
}

Audio.prototype.crash = function() {
    this.playBuffer(this.crashBuffer);
}

Audio.prototype.win = function() {
    this.playBuffer(this.winBuffer);
}

Audio.prototype.playBuffer = function(buffer) {
    this.makeSource(buffer).start();
}

Audio.prototype.playSample = function(buffer, sample) {
    this.makeSource(buffer)
        .start(0, sample * Audio.SAMPLE_OFFSET, Audio.SAMPLE_LENGTH);
}

Audio.prototype.makeSource = function(buffer) {
    let source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.fxGain);
    return source;
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
