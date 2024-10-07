const DEV = true;

const TAU = 2 * Math.PI;

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
}

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

function Ship(mu, path, heading = Math.PI / 2) {
    this.color = "lime";
    this.mu = mu;

    // current position, velocity and heading
    this.path = path;
    this.heading = heading;

    // determine orbit from the path
    this.orbit = new Orbit(this.mu, path);
}

Ship.prototype.draw = function(ctx) {
    DEV && this.path.draw(ctx, "blue");
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

w.draw();

// vi: set ai sw=4 ts=8 et sts=4 :
