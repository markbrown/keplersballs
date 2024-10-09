const TAU = 2 * Math.PI;

// display additional info
const DEV = false;

// physical constants
const GRAVITY_FACTOR = 1e5;
const SHIP_SIZE = 5;
const TURN_RAD_PER_SEC = TAU;
const THRUST_ACCEL = 10;
const RETRO_ACCEL = 6;
const BULLET_LIFE_MS = 1000;
const BULLET_SIZE = 1;
const MUZZLE_VELOCITY = 200;
const ROID_SIZE_FACTOR = 8;
const ROID_SPEED_LOSS_FACTOR = 0.5;
const ROID_SPEED_FUZZ_FACTOR = 0.2;

// visual effects
const SMOKE_LIFE_MS = 2400;
const SMOKE_EXPANSION_RATE = 4;
const SMOKE_FUZZ = 3.5;
const THRUST_SMOKE_SIZE = 4.5;
const RETRO_SMOKE_SIZE = 2.5;
const SHIP_SMASH_SLOWDOWN = 0.1;

// animation
const TICK_MS = 100;
const MAX_GAME_TIME_PER_FRAME_MS = 25;

// put an angle in the range 0..TAU
function angle(theta) {
    theta %= TAU;
    return theta < 0 ? theta + TAU : theta;
}

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

    // the sun
    this.color = color;
    this.radius = radius;

    // the ship will be added during setup
    this.ship = null;

    // other objects
    this.smokes = [];
    this.bullets = [];
    this.roids = [];

    this.setup(path);

    // keep track of game time
    this.last = Date.now();
    this.time = 0;
    this.ticks = 0;
}

World.prototype.setup = function(path) {
    // place ship in circular orbit by default
    if (!path) {
        path = this.circularPath(this.radius * 10);
    }
    this.ship = new Ship(this.mu, path);

    // add a roid
    this.addRoid();
}

World.prototype.circularPath = function(radius, phi = 0) {
    let speed = Math.sqrt(this.mu / radius);
    let pos = Vec.polar(radius, phi);
    let vel = Vec.polar(speed, phi + TAU / 4);
    return new Path(pos, vel);
}

World.prototype.addRoid = function() {
    let path = this.circularPath(this.width * 0.4);
    this.roids.push(new Roid(this.mu, 3, path));
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
    this.ship && this.ship.advance(dt);
    for (let roid of this.roids) {
        roid.advance(dt);
    }
    let smokes1 = [];
    for (let smoke of this.smokes) {
        if (smoke.age < SMOKE_LIFE_MS) {
            smoke.advance(dt);
            smokes1.push(smoke);
        }
    }
    this.smokes = smokes1;
    let bullets1 = [];
    for (let bullet of this.bullets) {
        if (bullet.age < BULLET_LIFE_MS) {
            bullet.advance(dt);
            bullets1.push(bullet);
        }
    }
    this.bullets = bullets1;
    this.detectCollisions();
    this.time = next;
}

World.prototype.detectCollisions = function() {
    let ship = this.ship;
    if (ship) {
        // check for ship hitting the sun
        if (ship.path.pos.sqr() < this.radius ** 2) {
            this.ship = null;
        }

        // check for ship hitting a roid
        for (let roid of this.roids) {
            if (roid.hit(ship.path.pos, ship.size)) {
                ship.crash();
            }
        }
    }

    // check for bullets hitting roids
    let roids1 = [];
    for (let roid of this.roids) {
        let hit = false;
        for (let bullet of this.bullets) {
            if (roid.hit(bullet.position(), BULLET_SIZE)) {
                bullet.destroy();
                hit = true;
            }
        }
        if (hit) {
            roid.smash(roids1);
        } else {
            roids1.push(roid);
        }
    }
    this.roids = roids1;
}

// perform actions at regular intervals
World.prototype.tick = function() {
    this.ship && this.ship.tick(this.ticks, this.smokes, this.bullets);
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
    for (let smoke of this.smokes) {
        smoke.draw(this.ctx);
    }
    for (let bullet of this.bullets) {
        bullet.draw(this.ctx);
    }
    this.ship && this.ship.draw(this.ctx);
    for (let roid of this.roids) {
        roid.draw(this.ctx);
    }
    Vec().spot(this.ctx, this.radius, this.color);
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

function Ship(mu, path, heading = TAU / 4) {
    this.size = SHIP_SIZE;
    this.color = "lime";
    this.alive = true;
    this.mu = mu;

    // current position, velocity and heading
    this.path = path;
    this.heading = heading;

    // determine orbit from the path
    this.determineOrbit();

    // controls
    this.keys = new KeyState();
}

Ship.prototype.ahead = function(s = 1) {
    return Vec.polar(s, this.heading);
}

Ship.prototype.determineOrbit = function() {
    this.orbit = new Orbit(this.mu, this.path);
}

Ship.prototype.advance = function(dt) {
    if (this.alive) {
        // steering
        let turn = dt * TURN_RAD_PER_SEC / 1000;
        if (this.keys.left) {
            this.heading += turn;
        }
        if (this.keys.right) {
            this.heading -= turn;
        }
        this.heading = angle(this.heading);

        // thrust
        if (this.keys.forward) {
            this.thrust(dt * THRUST_ACCEL / 1000);
        }
        if (this.keys.backward) {
            this.thrust(-dt * RETRO_ACCEL / 1000);
        }
    }

    // move ship in orbit
    this.orbit.advance(dt);
    this.orbit.getPath(this.path);
}

Ship.prototype.thrust = function(dv) {
    this.path.impulse(this.ahead(dv));
    this.determineOrbit();
}

// ship is hit by a roid
Ship.prototype.crash = function() {
    if (this.alive) {
        this.alive = false;
        this.color = "SlateGrey";
        this.path.vel = this.path.vel.scale(SHIP_SMASH_SLOWDOWN);
        this.determineOrbit();
    }
}

Ship.prototype.tick = function(ticks, smokes, bullets) {
    if (this.alive) {
        if (this.keys.forward && ticks % 2) {
            let aft = this.path.pos.plus(this.ahead(-5));
            smokes.push(new Smoke(aft, THRUST_SMOKE_SIZE));
        }
        if (this.keys.backward && ticks % 2 == 1) {
            let ahead = this.ahead();
            let fore = this.path.pos.plus(ahead.scale(4));
            let side = ahead.crossZ(3);
            smokes.push(new Smoke(fore.plus(side), RETRO_SMOKE_SIZE));
            smokes.push(new Smoke(fore.minus(side), RETRO_SMOKE_SIZE));
        }
        if (this.keys.trigger) {
            bullets.push(new Bullet(this.path, this.heading));
        }
    }
}

Ship.prototype.draw = function(ctx) {
    DEV && this.path.draw(ctx, "blue");
    DEV && this.keys.draw(ctx);
    if (this.alive) {
        this.orbit.draw(ctx);
    }
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

function Roid(mu, size, path) {
    this.color = "#840";
    this.size = size;
    this.path = path.copy();
    this.orbit = new Orbit(mu, this.path);
}

Roid.prototype.sizeInPx = function() {
    return this.size * ROID_SIZE_FACTOR;
}

Roid.prototype.advance = function(dt) {
    this.orbit.advance(dt);
    this.orbit.getPath(this.path);
}

// detect whether the roid is hit by an object at the given position,
// and that has the given radius
Roid.prototype.hit = function(pos, radius = 0) {
    let r = pos.minus(this.path.pos);
    return r.sqr() < (this.sizeInPx() + radius) ** 2;
}

// split a roid and add any remnants to the given list
Roid.prototype.smash = function(roids) {
    if (this.size > 1) {
        let mu = this.orbit.mu;
        let size = this.size - 1;
        let pos = this.path.pos;
        let side = pos.unit().scale(this.sizeInPx() / 3);;
        let vel = this.path.vel.scale(ROID_SPEED_LOSS_FACTOR);
        let fuzz = this.path.vel.len() * ROID_SPEED_FUZZ_FACTOR;
        let path1 = new Path(pos.plus(side), vel.plus(Vec.fuzz(fuzz)));
        let path2 = new Path(pos.minus(side), vel.plus(Vec.fuzz(fuzz)));
        roids.push(new Roid(mu, size, path1));
        roids.push(new Roid(mu, size, path2));
    }
}

Roid.prototype.draw = function(ctx) {
    this.path.pos.spot(ctx, this.sizeInPx(), this.color);
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

    // the orbit position should be the same as what was passed in
    DEV && this.check(path.pos);
}

Orbit.prototype.check = function(oldpos) {
    let newpath = new Path();
    this.getPath(newpath);
    let d = newpath.pos.minus(oldpos);
    if (d.dot(d) > 1) {
        console.log("pos error " + JSON.stringify(d));
    }
}

Orbit.prototype.advance = function(dt) {
    // advance the mean anomaly
    this.phi += dt * this.omega / 1000;
    this.phi = angle(this.phi);
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
    return angle(Math.atan2(y, x));
}

// convert eccentric anomaly to mean anomaly
Orbit.prototype.eccentricToMean = function(rho) {
    return angle(rho - this.e * Math.sin(rho));
}

// convert mean anomaly to eccentric anomaly using Newton's method
Orbit.prototype.meanToEccentric = function(phi) {
    const limit = 30;
    const epsilon = 1e-4;
    phi = angle(phi);
    let count = 0;
    let rho = (this.e < 0.8) ? phi : TAU / 2;
    let delta = rho - this.e * Math.sin(phi) - phi;
    while (Math.abs(delta) > epsilon && count < limit) {
        rho = angle(rho - delta / (1 - this.e * Math.cos(rho)));
        delta = this.eccentricToMean(rho) - phi;
        count++;
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
    DEV && this.drawDevInfo(ctx);

    // draw points one second apart
    ctx.fillStyle = "rgb(192 192 192 / 50%";
    let path = new Path();
    for (let t = TAU / this.omega; t > 0; t--) {
        this.getPath(path, t);
        path.pos.spot(ctx, 1);
    }
}

Orbit.prototype.drawDevInfo = function(ctx) {
    new Path(this.center, this.major).draw(ctx, "red");
    new Path(this.center, this.minor).draw(ctx, "red");
    new Path(Vec(), this.major.rotate(this.phi)).draw(ctx, "brown");

    let rho = this.meanToEccentric(this.phi);
    let phi2 = this.eccentricToMean(rho);
    let rho2 = this.meanToEccentric(phi2);

    this.drawAnomaly(ctx, 1, this.phi, "brown");
    this.drawAnomaly(ctx, 1, rho, "green");
    this.drawAnomaly(ctx, 0.8, phi2, "fuchsia");
    this.drawAnomaly(ctx, 0.8, rho2, "yellow");
}

Orbit.prototype.drawAnomaly = function(ctx, s, theta, color = null) {
    new Path(this.center, this.major.rotate(theta).scale(s)).draw(ctx, color);
}

function Smoke(pos, radius) {
    this.pos = pos.plus(Vec.fuzz(SMOKE_FUZZ));
    this.radius = radius;
    this.age = 0;
}

Smoke.prototype.advance = function(dt) {
    this.age += dt;
}

Smoke.prototype.draw = function(ctx) {
    let currentradius = this.radius + this.age * SMOKE_EXPANSION_RATE / 1000;
    let frac = Math.max(0, 1 - this.age / SMOKE_LIFE_MS);
    let alpha = 0.5 * frac ** 2;
    this.pos.spot(ctx, currentradius, `rgb(192 192 192 / ${alpha})`);
}

function Bullet(path, heading) {
    this.path = path.copy();
    this.path.impulse(Vec.polar(MUZZLE_VELOCITY, heading));
    this.age = 0;
}

Bullet.prototype.advance = function(dt) {
    this.age += dt;
}

// make the bullet disappear at the start of the next frame
Bullet.prototype.destroy = function() {
    this.age = BULLET_LIFE_MS;
}

Bullet.prototype.position = function() {
    return this.path.position(this.age);
}

Bullet.prototype.draw = function(ctx) {
    this.position().spot(ctx, BULLET_SIZE, "#fff");
}

function Path(pos = Vec(), vel = Vec()) {
    this.pos = pos;
    this.vel = vel;
}

Path.prototype.copy = function() {
    return new Path(this.pos, this.vel);
}

Path.prototype.position = function(t = 0) {
    return this.pos.plus(this.vel.scale(t / 1000));
}

Path.prototype.impulse = function(dv) {
    this.vel = this.vel.plus(dv);
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

Vec.fuzz = function(radius) {
    return Vec.polar(radius * Math.random(), TAU * Math.random());
}

Vec.polar = function(radius, theta) {
    return Vec(radius * Math.cos(theta), radius * Math.sin(theta));
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
    return Math.sqrt(this.sqr());
}

Vec.prototype.sqr = function() {
    return this.dot(this);
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

// const w = new World("yellow", 10, sample2);

const w = new World();

w.run();

// vi: set ai sw=4 ts=8 et sts=4 :
