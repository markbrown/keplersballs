import Roid from "./roid.js";

import Crash from "./crash.mp3";
import Hit from "./hit.mp3";
import Pop from "./pop.mp3";
import Win from "./win.mp3";

export default function Audio(enabled = true) {
    this.enabled = enabled;
    this.ctx = new AudioContext();
    (async () => {
        this.crashBuffer = await this.load(Crash);
        this.hitBuffer = await this.load(Hit);
        this.popBuffer = await this.load(Pop);
        this.winBuffer = await this.load(Win);
    })();

    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
    if (!enabled) {
        this.disable();
    }
}

Audio.SAMPLE_OFFSET = 0.5;
Audio.SAMPLE_LENGTH = 0.4;
Audio.POP_VARIANTS = 4;

Audio.prototype.load = function(url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => this.ctx.decodeAudioData(data));
}

Audio.prototype.enable = function() {
    this.gainNode.gain.value = 1;
    this.enabled = true;
}

Audio.prototype.disable = function() {
    this.gainNode.gain.value = 0;
    this.enabled = false;
}

Audio.prototype.crash = function() {
    this.playBuffer(this.crashBuffer);
}

Audio.prototype.hit = function() {
    this.playSample(this.hitBuffer, 0);
}

Audio.prototype.pop = function(size) {
    let variant = Math.floor(Math.random() * Audio.POP_VARIANTS);
    let sample = variant * Roid.info.length + size;
    this.playSample(this.popBuffer, sample);
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
    source.connect(this.gainNode);
    return source;
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
