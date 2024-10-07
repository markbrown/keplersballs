const TAU = 2 * Math.PI;

// display additional info
const DEV = false;

// animation
const TICK_MS = 100;
const MAX_GAME_TIME_PER_FRAME_MS = 25;

// physical constants
const GRAVITY_FACTOR = 1e5;

function World(color = "yellow", radius = 10, path = null) {
    this.canvas = document.querySelector("#canvas");
    this.width = canvas.width = window.innerWidth;
    this.height = canvas.height = window.innerHeight;

    // set up Cartesian coordinates
    this.ctx = this.canvas.getContext("2d");
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(1, -1);

    // gravitational parameter
    this.mu = radius * GRAVITY_FACTOR;

    // place ship in circular orbit by default
    if (!path) {
        let p = radius * 10;
        let v = Math.sqrt(this.mu / p);
        path = new Path(Vec(p, 0), Vec(0, v));
    }
    this.ship = new Ship(this.mu, path);

    // the sun
    this.color = color;
    this.radius = radius;

    // keep track of game time
    this.last = Date.now();
    this.time = 0;
    this.ticks = 0;
}

World.prototype.run = function() {
    this.frame();
    requestAnimationFrame(() => this.run());
}

World.prototype.frame = function() {
    let now = Date.now();

    // limit game speed so we get at least a set number of frames per tick
    let dt = Math.min(MAX_GAME_TIME_PER_FRAME_MS, now - this.last);

    // go into stasis if we lag more than a tick behind
    this.last = Math.max(this.last + dt, now - TICK_MS);

    // update the world, stopping to tick if need be
    let next = this.time + dt;
    if (next > this.ticks * TICK_MS) {
        this.update(this.ticks * TICK_MS);
        this.ticks++;
        this.tick();
    }
    this.update(next);
    this.draw();
}

// update the world each animation frame
World.prototype.update = function(next) {
    let dt = next - this.time;
    if (dt <= 0) {
        return;
    }
    this.ship.advance(dt);
    this.time = next;
}

// perform actions at regular intervals
World.prototype.tick = function() {
    this.ship.tick(this.ticks);
}

// clear the canvas
World.prototype.clear = function() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(-this.width / 2, -this.height / 2,
        this.width, this.height);
}

World.prototype.draw = function(clear = true) {
    if (clear) {
        this.clear();
    }
    Vec().spot(this.ctx, this.radius, this.color);
    this.ship.draw(this.ctx);
}

// keep track of which keys are currently pressed
function KeyState() {
    this.reset();
    addEventListener("blur", (ev) => this.reset());
    addEventListener("keydown", (ev) => this.keyevent(ev.code, true));
    addEventListener("keyup", (ev) => this.keyevent(ev.code, false));
}

KeyState.prototype.reset = function() {
    this.forward = false;
    this.backward = false;
    this.left = false;
    this.right = false;
    this.trigger = false;
}

KeyState.prototype.keyevent = function(code, val) {
    switch (code) {
        case "ArrowUp":
        case "Numpad8":
        case "KeyW":
            this.forward = val;
            break;
        case "ArrowDown":
        case "Numpad2":
        case "KeyS":
            this.backward = val;
            break;
        case "ArrowLeft":
        case "Numpad4":
        case "KeyA":
            this.left = val;
            break;
        case "ArrowRight":
        case "Numpad6":
        case "KeyD":
            this.right = val;
            break;
        case "Space":
        case "Numpad5":
            this.trigger = val;
            break;
    }
}

KeyState.prototype.draw = function(ctx) {
    if (this.forward) { Vec(0, 160).spot(ctx, 3, "red"); }
    if (this.backward) { Vec(0, 120).spot(ctx, 3, "red"); }
    if (this.left) { Vec(-20, 140).spot(ctx, 3, "red"); }
    if (this.right) { Vec(20, 140).spot(ctx, 3, "red"); }
    if (this.trigger) { Vec(0, 140).spot(ctx, 2, "white"); }
}

function Ship(mu, path, heading = Math.PI / 2) {
    this.color = "lime";
    this.mu = mu;

    // current position, velocity and heading
    this.path = path;
    this.heading = heading;

    // determine orbit from the path
    this.orbit = new Orbit(this.mu, path);

    // controls
    this.keys = new KeyState();
}

Ship.prototype.advance = function(dt) {
    this.orbit.advance(dt);
    this.orbit.getPath(this.path);
}

Ship.prototype.tick = function(ticks) {
}

Ship.prototype.draw = function(ctx) {
    DEV && this.path.draw(ctx, "blue");
    DEV && this.keys.draw(ctx);
    this.orbit.draw(ctx);
    ctx.save();
    ctx.translate(this.path.pos.x, this.path.pos.y);
    ctx.rotate(this.heading);
    ctx.fillStyle = this.color;
    // draw an isosceles triangle pointing right
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-4, 4);
    ctx.fill();
    ctx.restore();
}

function Orbit(mu, path) {
    this.mu = mu;

    // specific angular momentum
    let h = path.pos.cross2d(path.vel);

    // eccentricity
    let eVector = path.vel.crossZ(h / mu).minus(path.pos.unit());
    this.e = eVector.len();
    let fSqr = 1 - this.e ** 2;

    // semi-latus rectum
    let r = h ** 2 / mu;

    // semi-major axis, semi-minor axis
    this.a = r / fSqr;
    this.b = Math.sign(h) * r / Math.sqrt(fSqr);
    if (this.e < 1e-6) {
        // too close to a circle so we choose an arbitrary periapsis
        this.major = Vec(this.a, 0);
        this.minor = Vec(0, this.b);
    } else {
        let eUnit = eVector.unit();
        this.major = eUnit.scale(this.a);
        this.minor = eUnit.crossZ(-this.b);
    }

    // center of the ellipse
    this.center = eVector.scale(-this.a);

    // mean anomaly and mean motion
    this.phi = this.meanAnomaly(path.pos);
    this.omega = Math.sqrt(mu / this.a ** 3);
}

Orbit.prototype.advance = function(dt) {
    // advance the mean anomaly
    this.phi += dt * this.omega / 1000;
    this.phi %= TAU;
}

// returns the mean anomaly at a given position
Orbit.prototype.meanAnomaly = function(pos) {
    let rho = this.eccentricAnomaly(pos);
    return this.eccentricToMean(rho);
}

// returns the eccentric anomaly at a given position
Orbit.prototype.eccentricAnomaly = function(pos) {
    let r = pos.minus(this.center);
    let x = r.dot(this.major) / this.a ** 2;
    let y = r.dot(this.minor) / this.b ** 2;
    return Math.atan2(y, x);
}

// convert eccentric anomaly to mean anomaly
Orbit.prototype.eccentricToMean = function(rho) {
    return rho - this.e * Math.sin(rho);
}

// convert mean anomaly to eccentric anomaly using Newton's method
Orbit.prototype.meanToEccentric = function(phi, n = 6) {
    let rho = phi % TAU;
    let prev = rho;
    for (let i = 0; i < n; i++) {
        prev = rho;
        rho = phi + this.e * Math.sin(rho);
    }
    if (Math.abs(rho - Math.PI) < Math.PI / 2) {
        // deal with slow convergence near the apoapsis
        rho = (rho + prev) / 2;
    }
    return rho;
}

// predict the path after t seconds
Orbit.prototype.getPath = function(path, t = 0) {
    // eccentric anomaly
    let rho = this.meanToEccentric(this.phi + t * this.omega);
    let cos = Math.cos(rho);
    let sin = Math.sin(rho);

    // position
    let pa = this.major.scale(cos);
    let pb = this.minor.scale(sin);
    path.pos = this.center.plus(pa).plus(pb);

    // bearing
    let ba = this.major.scale(-sin);
    let bb = this.minor.scale(cos);
    let bUnit = ba.plus(bb).unit();

    // vis-viva equation
    let speed = Math.sqrt(this.mu * (2 / path.pos.len() - 1 / this.a));
    path.vel = bUnit.scale(speed);
}

Orbit.prototype.draw = function(ctx) {
    DEV && new Path(this.center, this.major).draw(ctx, "red");
    DEV && new Path(this.center, this.minor).draw(ctx, "red");
    DEV && new Path(Vec(), this.major.rotate(this.phi)).draw(ctx, "brown");

    // draw points one second apart
    ctx.fillStyle = "rgb(192 192 192 / 50%";
    let max = TAU / this.omega;
    let path = new Path();
    for (let t = 0; t < max; t++) {
        this.getPath(path, t);
        path.pos.spot(ctx, 1);
    }
}

function Path(pos = Vec(), vel = Vec()) {
    this.pos = pos;
    this.vel = vel;
}

Path.prototype.draw = function(ctx, color = null) {
    if (color) {
        ctx.strokeStyle = color;
    }
    let tip = this.pos.plus(this.vel);
    ctx.beginPath();
    this.pos.moveTo(ctx);
    tip.lineTo(ctx);
    ctx.stroke();
}

function Vec(x = 0, y = 0) {
    if (!new.target) {
        return new Vec(x, y);
    }
    this.x = x;
    this.y = y;
}

Vec.prototype.plus = function(a) {
    return Vec(this.x + a.x, this.y + a.y);
}

Vec.prototype.minus = function(a) {
    return Vec(this.x - a.x, this.y - a.y);
}

Vec.prototype.scale = function(s) {
    return Vec(this.x * s, this.y * s);
}

Vec.prototype.descale = function(s) {
    return Vec(this.x / s, this.y / s);
}

Vec.prototype.unit = function() {
    return this.descale(this.len());
}

Vec.prototype.len = function() {
    return Math.sqrt(this.dot(this));
}

Vec.prototype.dot = function(a) {
    return this.x * a.x + this.y * a.y;
}

Vec.prototype.cross2d = function(a) {
    return this.x * a.y - this.y * a.x;
}

Vec.prototype.crossZ = function(z) {
    return Vec(this.y * z, -this.x * z);
}

Vec.prototype.rotate = function(theta) {
    let sin = Math.sin(theta);
    let cos = Math.cos(theta);
    return Vec(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
}

Vec.prototype.moveTo = function(ctx) {
    ctx.moveTo(this.x, this.y);
}

Vec.prototype.lineTo = function(ctx) {
    ctx.lineTo(this.x, this.y);
}

Vec.prototype.spot = function(ctx, radius, color = null) {
    if (color) {
        ctx.fillStyle = color;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, TAU);
    ctx.fill();
}

// tests

let sample1 = new Path(Vec(100, 0), Vec(0, 40));
let sample2 = new Path(Vec(150, -120), Vec(75, 25));
let sample3 = new Path(Vec(0, -120), Vec(20, 20));
let sample4 = new Path(Vec(100, -80), Vec(30, 20));
let sample5 = new Path(Vec(-12, 0), Vec(0, 162));

const w = new World("yellow", 10, sample2);

w.run();

// vi: set ai sw=4 ts=8 et sts=4 :
