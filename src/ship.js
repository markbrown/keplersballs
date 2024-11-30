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
    this.death = "";
    this.color = Ship.LIVE_COLOR;
    this.heat = 0;
    this.orbit = new Orbit(this.mu, path);
}

Ship.LIVE_COLOR = "lime";
Ship.DEAD_COLOR = "SlateGrey";
Ship.SIZE = 5;
Ship.ABSORPTION = 100;
Ship.DISSIPATION_MIN = 15e-3;
Ship.DISSIPATION_VAR = 7e-3;
Ship.THRUST_ACCEL = 16;
Ship.RETRO_ACCEL = 12;
Ship.SPEED_CAP = 0.99;
Ship.LOW_SIGNAL_LEVEL = 1000;
Ship.CRASH_SLOWDOWN = 10;
Ship.THRUST_SMOKE = 5;
Ship.RETRO_SMOKE = 2.5;
Ship.OUTER_FLAME_COLOR = "yellow";
Ship.INNER_FLAME_COLOR = "orange";
Ship.FLAME_SIZE = 10;
Ship.RETRO_DISPLACEMENT = 3;
Ship.FORE_POS = 4;
Ship.AFT_POS = 5;

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
            let aft = this.pos().plus(this.ahead(-Ship.AFT_POS));
            effects.push(new Smoke(aft, Ship.THRUST_SMOKE));
        } else if (this.controls.backward() && ticks % 2) {
            let ahead = this.ahead();
            let fore = this.pos().plus(ahead.scale(Ship.FORE_POS));
            let side = ahead.crossZ(Ship.RETRO_DISPLACEMENT);
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

    let sunlight = Ship.ABSORPTION / this.pos().sqr();
    let cooling = Ship.DISSIPATION_MIN + this.heat * Ship.DISSIPATION_VAR;
    let heat = this.heat + ds * (sunlight - cooling);
    this.heat = Math.max(0, Math.min(2, heat));

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
            this.die("ship overheated");
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
        this.die("ship crashed");

        // fall into the sun
        let path = this.orbit.path;
        path.slow(Ship.CRASH_SLOWDOWN);
        this.orbit = new Orbit(this.mu, path);
    }
}

Ship.prototype.die = function(death) {
    this.death = death;
    this.controls.enabled = false;
    this.color = Ship.DEAD_COLOR;
    this.deadturn = (0.5 - Math.random()) * Turn.RATE;
}

Ship.prototype.draw = function(ctx) {
    let pos = this.pos();
    if (pos.sqr() > Ship.LOW_SIGNAL_LEVEL ** 2) {
        return;
    }

    if (this.alive()) {
        this.orbit.draw(ctx);
    }

    // draw the ship
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.heading);
    // draw flames
    if (this.alive()) {
        let inner = Ship.FLAME_SIZE * Math.random();
        let outer = inner + Ship.FLAME_SIZE * Math.random();
        if (this.controls.forward()) {
            this.drawThrust(ctx, outer, Ship.OUTER_FLAME_COLOR);
            this.drawThrust(ctx, inner, Ship.INNER_FLAME_COLOR);
        } else if (this.controls.backward()) {
            this.drawRetro(ctx, -1, outer / 2, Ship.OUTER_FLAME_COLOR);
            this.drawRetro(ctx, -1, inner / 2, Ship.INNER_FLAME_COLOR);
            this.drawRetro(ctx, 1, outer / 2, Ship.OUTER_FLAME_COLOR);
            this.drawRetro(ctx, 1, inner / 2, Ship.INNER_FLAME_COLOR);
        }
    }
    // draw a spaceship pointing right
    ctx.fillStyle = this.color;
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

Ship.prototype.drawThrust = function(ctx, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(-6 - size, 0);
    ctx.lineTo(-6, -2);
    ctx.fill();
}

Ship.prototype.drawRetro = function(ctx, dir, size, color) {
    let y = dir * Ship.RETRO_DISPLACEMENT;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-2, y - 2);
    ctx.lineTo(size, y);
    ctx.lineTo(-2, y + 2);
    ctx.fill();
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
