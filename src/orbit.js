import Path from "./path.js";
import Vec from "./vec.js";

const TAU = 2 * Math.PI;

export default function Orbit(mu, path) {
    this.mu = mu;
    this.path = path;
    this.periapsis = false;

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
        let eUnit = eVector.descale(this.e);
        this.major = eUnit.scale(this.a);
        this.minor = eUnit.crossZ(-this.b);
    }

    // center of the ellipse
    this.center = eVector.scale(-this.a);

    // mean anomaly and mean motion
    this.phi = this.meanAnomaly(path.pos);
    this.omega = Math.sqrt(mu / this.a ** 3);
}

Orbit.MARKER_SIZE = 3;
Orbit.ALPHA = 80;
Orbit.FADEOUT = 18;

// advance the position and velocity
Orbit.prototype.advance = function(dt) {
    this.phi += dt * this.omega / 1000;

    if (this.phi >= TAU) {
        this.phi -= TAU;
        this.periapsis = true;
    } else if (this.phi < 0) {
        this.phi += TAU;
        this.periapsis = true;
    }

    this.get(this.path);
}

// return true exactly once after each pass of the periapsis
Orbit.prototype.complete = function() {
    if (this.periapsis) {
        this.periapsis = false;
        return true;
    } else {
        return false;
    }
}

// predict the path after t seconds
Orbit.prototype.get = function(path, t = 0) {
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

// returns the mean anomaly at the given position
Orbit.prototype.meanAnomaly = function(pos) {
    let rho = this.eccentricAnomaly(pos);
    return this.eccentricToMean(rho);
}

// returns the eccentric anomaly at the given position
Orbit.prototype.eccentricAnomaly = function(pos) {
    let r = pos.minus(this.center);
    let x = r.dot(this.major) / this.a ** 2;
    let y = r.dot(this.minor) / this.b ** 2;
    let angle = Math.atan2(y, x);
    return (angle < 0) ? angle + TAU : angle;
}

// convert eccentric anomaly to mean anomaly
Orbit.prototype.eccentricToMean = function(rho) {
    return rho - this.e * Math.sin(rho);
}

// convert mean anomaly to eccentric anomaly using Newton's method
Orbit.prototype.meanToEccentric = function(phi) {
    const limit = 8;
    const epsilon = 1e-4;
    const cutoff = 0.8;

    phi %= TAU;
    if (phi < 0) {
        phi += TAU;
    }

    let count = 0;
    let rho = (this.e < cutoff) ? phi : Math.PI;
    let delta = rho - this.e * Math.sin(phi) - phi;
    while (Math.abs(delta) > epsilon && count < limit) {
        rho = rho - delta / (1 - this.e * Math.cos(rho));
        delta = this.eccentricToMean(rho) - phi;
        count++;
    }
    return rho;
}

Orbit.prototype.draw = function(ctx) {
    // draw points one second apart
    let path = new Path();
    let t = 0;
    let period = TAU / this.omega;
    let alpha = Orbit.ALPHA;
    while (alpha >= 1 && ++t < period) {
        this.get(path, t);
        let color = `rgb(192 192 192 / ${Math.floor(alpha)}%)`;
        path.pos.spot(ctx, Orbit.MARKER_SIZE, color);
        alpha -= this.omega * Orbit.FADEOUT;
    }
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
