import Vec from "./vec.js";

const TAU = 2 * Math.PI;

export default function Pilot(ship, home) {
    this.ship = ship;
    this.home = home;
    this.plan = "";
    this.parked = false;
}

Pilot.TURN_RATE = Math.PI;
Pilot.THRUST = 12;
Pilot.MIN_RADIUS = 10;
Pilot.FAR_MULTIPLIER = 4;
Pilot.FONT = "20pt 'League Spartan', sans-serif";
Pilot.COLOR = "lime";
Pilot.EPSILON_R = 5;
Pilot.EPSILON_E = 0.05;

Pilot.prototype.tick = function(ticks, effects) {
}

Pilot.prototype.done = function() {
    let pos = this.ship.pos();
    let orbit = this.ship.orbit;
    let dr = Math.abs(pos.len() - this.home);
    return (dr < Pilot.EPSILON_R && orbit.e < Pilot.EPSILON_E);
}

Pilot.prototype.advance = function(ds) {
    if (this.parked) {
        this.steer(Math.PI / 2, false, ds);
    } else if (this.done()) {
        this.parked = true;
        this.plan = "parked";
    } else {
        let pos = this.ship.pos();
        let orbit = this.ship.orbit;
        let ra = pos.dot(orbit.major);
        let rb = pos.dot(orbit.minor);
        this.plan = this.action();
        switch (this.plan) {
            case "expand":
                this.aim(1, ra > 0, ds);
                break;
            case "contract":
                if (ra > 0) {
                    this.aim(-1, true, ds);
                } else {
                    this.aim(1, rb > 0, ds);
                }
                break;
            case "start flip":
                this.aim(1, ra < 0 && rb > 0, ds);
                break;
            case "build flip":
                this.aim(1, ra < 0, ds);
                break;
            case "flip":
                this.aim(1, true, ds);
                break;
            case "recover":
                this.aim(-1, rb < 0, ds);
                break;
            case "scramble":
                this.aim(-1, true, ds);
                break;
            case "yikes":
                this.aim(-1, ra < 0, ds);
                break;
        }
    }
}

Pilot.prototype.action = function() {
    let orbit = this.ship.orbit;
    let apoapsis = orbit.p / (1 - orbit.e);
    let periapsis = orbit.p / (1 + orbit.e);

    if (apoapsis < this.home) {
        if (periapsis < Pilot.MIN_RADIUS) {
            return "scramble";
        } else {
            return "expand";
        }
    } else {
        if (orbit.h > 0) {
            if (periapsis > this.home) {
                return "contract";
            } else if (periapsis < Pilot.MIN_RADIUS) {
                return "scramble";
            } else {
                return "recover";
            }
        } else {
            if (apoapsis > this.home * Pilot.FAR_MULTIPLIER) {
                if (periapsis > this.home) {
                    return "start flip";
                } else if (periapsis < Pilot.MIN_RADIUS) {
                    return "flip";
                } else {
                    return "build flip";
                }
            } else {
                if (periapsis < Pilot.MIN_RADIUS) {
                    if (orbit.p > this.home) {
                        return "flip";
                    } else {
                        return "yikes";
                    }
                } else {
                    return "expand";
                }
            }
        }
    }
}

Pilot.prototype.aim = function(sense, throttle, ds) {
    let theta = this.ship.orbit.minor.scale(sense).theta();
    this.steer(theta, throttle, ds);
}

Pilot.prototype.steer = function(theta, throttle, ds) {
    let rot = theta - this.ship.heading;
    if (rot > Math.PI) {
        rot -= TAU;
    } else if (rot < -Math.PI) {
        rot += TAU;
    }
    let turn = Pilot.TURN_RATE * ds;
    if (Math.abs(rot) > turn) {
        this.ship.heading += Math.sign(rot) * turn;
    } else {
        this.ship.heading = theta;
        throttle && this.ship.thrust(ds * Pilot.THRUST);
    }
}

Pilot.prototype.draw = function(ctx) {
    Vec(0, -150).write(ctx, Pilot.FONT, this.plan, 0, Pilot.COLOR);

    let r = this.ship.pos().len();
    let e = this.ship.orbit.e;
    let text = `r = ${Math.floor(r)}, e = ${Math.floor(e * 100) / 100}`;
    Vec(0, -180).write(ctx, Pilot.FONT, text, 0, Pilot.COLOR);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
