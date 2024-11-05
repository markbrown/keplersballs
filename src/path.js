import Vec from "./vec.js";

export default function Path(pos = Vec(), vel = Vec()) {
    // pixels
    this.pos = pos;

    // pixels per second
    this.vel = vel;
}

Path.prototype.copy = function() {
    return new Path(this.pos, this.vel);
}

// rotate the position and velocity vectors
Path.prototype.rotate = function(theta) {
    this.pos = this.pos.rotate(theta);
    this.vel = this.vel.rotate(theta);
}

// return the position at a given time in ms
Path.prototype.position = function(t) {
    return this.pos.plus(this.vel.scale(t / 1000));
}

// return the distance from the origin
Path.prototype.altitude = function() {
    return this.pos.len();
}

// return the speed
Path.prototype.speed = function() {
    return this.vel.len();
}

// add a vector to the velocity
Path.prototype.impulse = function(dv) {
    this.vel = this.vel.plus(dv);
}

// descale the velocity by the given amount
Path.prototype.slow = function(s) {
    this.vel = this.vel.descale(s);
}

// cap the speed at a given amount
Path.prototype.cap = function(max) {
    let speed = this.speed();
    if (speed > max) {
        this.vel = this.vel.scale(max / speed);
    }
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
