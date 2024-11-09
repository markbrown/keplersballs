import Bullet from "./bullet.js";
import Orbit from "./orbit.js";
import Smoke from "./smoke.js";
import Turn from "./turn.js";
import Vec from "./vec.js";

const TAU = 2 * Math.PI;

export default function Ship(controls, mu, path, heading = TAU / 4) {
    this.controls = controls;
    this.mu = mu;
    this.heading = heading;

    // rate of turn
    this.left = new Turn();
    this.right = new Turn();
    this.deadturn = 0;

    // ship state
    this.color = Ship.LIVE_COLOR;
    this.orbit = new Orbit(this.mu, path);
}

Ship.LIVE_COLOR = "lime";
Ship.DEAD_COLOR = "SlateGrey";
Ship.SIZE = 5;
Ship.THRUST_ACCEL = 16;
Ship.RETRO_ACCEL = 12;
Ship.SPEED_CAP = 0.99;
Ship.CRASH_SLOWDOWN = 10;
Ship.THRUST_SMOKE = 5;
Ship.RETRO_SMOKE = 2.5;

Ship.prototype.alive = function() {
    return this.controls.enabled;
}

Ship.prototype.pos = function() {
    return this.orbit.path.pos;
}

Ship.prototype.ahead = function(s = 1) {
    return Vec.polar(s, this.heading);
}

Ship.prototype.tick = function(ticks, bullets, effects) {
    if (this.alive()) {
        if (this.controls.forward()) {
            let aft = this.pos().plus(this.ahead(-5));
            effects.push(new Smoke(aft, Ship.THRUST_SMOKE));
        }
        if (this.controls.backward() && ticks % 2) {
            let ahead = this.ahead();
            let fore = this.pos().plus(ahead.scale(4));
            let side = ahead.crossZ(3);
            effects.push(new Smoke(fore.plus(side), Ship.RETRO_SMOKE));
            effects.push(new Smoke(fore.minus(side), Ship.RETRO_SMOKE));
        }
        if (this.controls.trigger()) {
            bullets.push(new Bullet(this.orbit.path, this.heading));
        }
    }
}

Ship.prototype.advance = function(dt) {
    let ds = dt / 1000;
    if (this.alive()) {
        // steering
        if (this.controls.left()) {
            this.heading += this.left.turn(ds);
            this.right.rate = 0;
        } else {
            this.left.decay(ds);
        }
        if (this.controls.right()) {
            this.heading -= this.right.turn(ds);
            this.left.rate = 0;
        } else {
            this.right.decay(ds);
        }

        // thrust
        if (this.controls.forward()) {
            this.thrust(ds * Ship.THRUST_ACCEL);
        } else if (this.controls.backward()) {
            this.thrust(-ds * Ship.RETRO_ACCEL);
        }
    } else {
        this.heading += this.deadturn * ds;
    }

    // normalize angle
    this.heading %= TAU;
    if (this.heading < 0) {
        this.heading += TAU;
    }

    // move ship in orbit
    this.orbit.advance(dt);
}

Ship.prototype.fried = function(radius, audio) {
    if (this.orbit.complete() && this.near(radius)) {
        if (this.alive()) {
            // ship hits the sun
            this.die();
        } else {
            return true;
        }
    }
    return false;
}

Ship.prototype.near = function(radius) {
    return this.pos().sqr() < (radius + Ship.SIZE) ** 2;
}

Ship.prototype.thrust = function(dv) {
    let path = this.orbit.path;
    path.impulse(this.ahead(dv));

    // ensure ship stays below escape velocity
    path.cap(Math.sqrt(2 * this.mu / path.altitude()) * Ship.SPEED_CAP);

    // determine the new orbit after the change in velocity
    this.orbit = new Orbit(this.mu, path);
}

// ship is hit by a roid
Ship.prototype.crash = function(audio) {
    if (this.alive()) {
        audio.crash();
        this.die();

        // fall into the sun
        let path = this.orbit.path;
        path.slow(Ship.CRASH_SLOWDOWN);
        this.orbit = new Orbit(this.mu, path);
    }
}

Ship.prototype.die = function() {
    this.controls.enabled = false;
    this.color = Ship.DEAD_COLOR;
    this.deadturn = (0.5 - Math.random()) * Turn.RATE;
}

Ship.prototype.draw = function(ctx) {
    if (this.alive()) {
        this.orbit.draw(ctx);
    }

    // draw the ship
    let pos = this.pos();
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.heading);
    ctx.fillStyle = this.color;
    // draw a spaceship pointing right
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(6, 2);
    ctx.lineTo(1, 2);
    ctx.lineTo(-4, 7);
    ctx.lineTo(-6, 7);
    ctx.lineTo(-6, 2);
    ctx.lineTo(-8, 2);
    ctx.lineTo(-8, -2);
    ctx.lineTo(-6, -2);
    ctx.lineTo(-6, -7);
    ctx.lineTo(-4, -7);
    ctx.lineTo(1, -2);
    ctx.lineTo(6, -2);
    ctx.fill();
    ctx.restore();
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
