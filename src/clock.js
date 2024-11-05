import Vec from "./vec.js";

export default function Clock() {
    this.start();
}

// game tempo
Clock.TICK_MS = 100;
Clock.MAX_GAME_TIME_PER_FRAME_MS = 25;

// start the clock from zero
Clock.prototype.start = function() {
    this.last = Date.now();
    this.time = 0;
    this.ticks = 0;
}

// update game time and call update/tick as required
Clock.prototype.frame = function(w) {
    let now = Date.now();

    // limit game speed so we get at least a set number of frames per tick
    let dt = Math.min(Clock.MAX_GAME_TIME_PER_FRAME_MS, now - this.last);

    // go into stasis if we lag more than a tick behind
    this.last = Math.max(this.last + dt, now - Clock.TICK_MS);

    // perform update, stopping to tick if need be
    let next = this.time + dt;
    if (next > this.ticks * Clock.TICK_MS) {
        this.update(w, this.ticks * Clock.TICK_MS);
        this.ticks++;
        w.tick(this.ticks);
    }
    this.update(w, next);
}

Clock.prototype.update = function(w, next) {
    let dt = next - this.time;
    if (dt > 0) {
        w.update(dt);
    }
    this.time = next;
}

Clock.prototype.text = function(tenths = false) {
    let mins = Math.floor(this.ticks / 600);
    let secs = Math.floor(this.ticks / 10) % 60;
    if (tenths) {
        let dec = this.ticks % 10;
        return `${mins}m${("0" + secs).slice(-2)}.${dec}s`;
    } else if (mins > 0) {
        return `${mins}m${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
