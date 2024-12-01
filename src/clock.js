import Vec from "./vec.js";

export default function Clock() {
    this.start();
}

// game tempo
Clock.TICK_MS = 100;
Clock.MAX_GAME_TIME_PER_FRAME_MS = 25;

Clock.format = function(ticks, tenths = false) {
    let mins = Math.floor(ticks / 600);
    let secs = Math.floor(ticks / 10) % 60;
    if (tenths) {
        let dec = ticks % 10;
        return `${mins}m${secs}.${dec}s`;
    } else if (mins > 0) {
        return `${mins}m${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// start the clock from zero
Clock.prototype.start = function() {
    this.last = Date.now();
    this.time = 0;
    this.ticks = 0;
    this.current = "";
}

// update game time and call update/tick as required
Clock.prototype.frame = function(world) {
    let now = Date.now();

    // limit game speed so we get at least a set number of frames per tick
    let dt = Math.min(Clock.MAX_GAME_TIME_PER_FRAME_MS, now - this.last);

    // go into stasis if we lag more than a tick behind
    this.last = Math.max(this.last + dt, now - Clock.TICK_MS);

    // perform update, stopping to tick if need be
    let next = this.time + dt;
    if (next > this.ticks * Clock.TICK_MS) {
        this.update(world, this.ticks * Clock.TICK_MS);
        this.ticks++;
        if (this.ticks % 10 == 0) {
            this.current = Clock.format(this.ticks);
        }
        world.tick(this.ticks);
    }
    this.update(world, next);
}

Clock.prototype.update = function(world, next) {
    let dt = next - this.time;
    if (dt > 0) {
        world.update(dt);
    }
    this.time = next;
}

Clock.prototype.finish = function(leaders, difficulty) {
    leaders.insert(this.ticks, difficulty);
    return leaders.ordinal() || Clock.format(this.ticks, true);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
