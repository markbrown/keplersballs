const TAU = 2 * Math.PI;

// display additional info
const DEV = false;

// fonts
const TITLE_FONT = "100px sans-serif";
const RESULT_FONT = "80px sans-serif";
const CLOCK_FONT = "20px sans-serif";
const PLAY_FONT = "30px sans-serif";
const HELP_FONT = "24px sans-serif";

// overlay
const TITLE_OFFSET = 300;
const CLOCK_OFFSET = 240;
const TITLE_TEXT = "KEPLER'S BALLS";
const VICTORY_TEXT = "YOU WIN!";
const GAME_OVER_TEXT = "GAME OVER";
const PLAY_TEXT = "press any key to play";
const REPLAY_TEXT = "press any key to play again";
const REPLAY_DELAY_MS = 2000;
const SCROLL_START = 100;
const SCROLL_RATE = 16;
const HELP_LINEHEIGHT = 36;
const HELP_COL1 = 140;
const HELP_COL2 = 400;
const HELP = [
    ["Thrusters:", "↑ or W"],
    ["Turn left:", "← or A"],
    ["Turn right:", "→ or D"],
    ["Retro thrusters:", "↓ or S"],
    ["Shoot:", "space"],
];

// physical constants
const GRAVITY_FACTOR = 1e5;
const SHIP_SIZE = 5;
const TURN_RAD_PER_SEC = TAU;
const TURN_RAMP_RATE = 5 * TAU;
const THRUST_ACCEL = 11;
const RETRO_ACCEL = 8;
const SPEED_CAP = 0.98;
const SHIP_CRASH_SLOWDOWN = 0.1;

// bullets
const BULLET_LIFE_MS = 1000;
const MUZZLE_VELOCITY = 200;

// roids
const ROID_COUNT = 7;
const ROID_DISTANCE_MIN = 400;
const ROID_DISTANCE_VAR = 60;
const ROID_MAX_SIZE = 4;
const ROID_SPEED_LOSS_FACTOR = 0.8;
const ROID_SPEED_FUZZ_FACTOR = 0.15;

// visual effects
const ORBIT_MARKER_SIZE = 2;
const ORBIT_ALPHA = 80;
const ORBIT_FADEOUT = 18;
const SMOKE_LIFE_MS = 2800;
const SMOKE_EXPANSION_RATE = 4;
const SMOKE_FUZZ = 3.5;
const THRUST_SMOKE_SIZE = 5;
const RETRO_SMOKE_SIZE = 2.5;

// sound effects
const WIN_URL = "win.mp3";
const CRASH_URL = "crash.mp3";
const HIT_URL = "hit.mp3";
const POP_URL = "pop.mp3";
const POP_VARIANTS = 4;
const SAMPLE_OFFSET = 0.5;
const SAMPLE_LENGTH = 0.4;


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
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;

    // set up Cartesian coordinates
    this.ctx = this.canvas.getContext("2d");
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(1, -1);

    // center text
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    // game state
    this.audio = new Audio();
    this.clock = new Clock();
    this.overlay = new Overlay(this);
    this.controls = new KeyState();
    this.running = false;

    // gravitational parameter
    this.mu = radius * GRAVITY_FACTOR;

    // the sun
    this.color = color;
    this.radius = radius;

    // create world objects
    this.setup(path);
}

World.prototype.setup = function(path = null) {
    // place ship in circular orbit by default
    if (!path) {
        path = this.circularPath(this.radius * 10);
    }
    this.ship = new Ship(this.controls, this.mu, path);

    // other objects
    this.smokes = [];
    this.bullets = [];
    this.roids = [];

    // add roids
    let count = DEV ? 1 : ROID_COUNT;
    for (let i = 0; i < count; i++) {
        this.addRoid();
    }
}

World.prototype.circularPath = function(radius, phi = 0) {
    let speed = Math.sqrt(this.mu / radius);
    let pos = Vec.polar(radius, phi);
    let vel = Vec.polar(speed, phi + TAU / 4);
    return new Path(pos, vel);
}

World.prototype.addRoid = function() {
    let radius = ROID_DISTANCE_MIN + (Math.random() * ROID_DISTANCE_VAR);
    let path = this.circularPath(radius, Math.random() * TAU);
    this.roids.push(new Roid(this.mu, path));
}

// called from `Overlay` when a key is pressed
World.prototype.start = function() {
    if (!this.overlay.title) {
        this.setup();
    }
    this.clock.start();
    this.controls.enable();
    this.running = true;
}

World.prototype.run = function() {
    this.clock.frame(this);
    this.draw();
    requestAnimationFrame(() => this.run());
}

// update the world each animation frame
World.prototype.update = function(dt) {
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
        if (bullet.age < bullet.life) {
            bullet.advance(dt);
            bullets1.push(bullet);
        }
    }
    this.bullets = bullets1;
    this.detectCollisions();
    this.detectFinish();
}

World.prototype.detectCollisions = function() {
    this.ship && this.detectShipCollision();

    // check for bullets hitting roids
    let roids1 = [];
    for (let roid of this.roids) {
        let hits = 0;
        for (let bullet of this.bullets) {
            if (roid.hit(bullet.position(), bullet.radius)) {
                hits += bullet.destroy(this.audio);
            }
        }
        roid.smash(hits, roids1, this.audio);
    }
    this.roids = roids1;
}

World.prototype.detectShipCollision = function() {
    let ship = this.ship;

    // check for ship hitting a roid
    for (let roid of this.roids) {
        if (roid.hit(ship.path.pos, ship.size)) {
            ship.crash(this.audio);
        }
    }

    // check for ship hitting the sun
    if (ship.path.pos.sqr() < (this.radius + ship.size) ** 2) {
        if (ship.crashed || ship.toast) {
            this.ship = null;
        } else {
            ship.die();
        }
    }
}

World.prototype.detectFinish = function() {
    if (this.running) {
        if (!this.controls.enabled) {
            this.overlay.finish(this.clock.text(), false);
            this.running = false;
        } else if (this.roids.length == 0) {
            this.audio.win();
            this.overlay.finish(this.clock.text(), true);
            this.controls.enabled = false;
            this.running = false;
        }
    }
}

// perform actions at regular intervals
World.prototype.tick = function(ticks) {
    this.ship && this.ship.tick(ticks, this.smokes, this.bullets);
}

// draw everything
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


    if (this.running) {
        this.clock.draw(this.ctx);
    } else {
        // draw game overlay any time the controls are not enabled
        this.overlay.scroll(this.clock.time);
        this.overlay.draw(this.ctx);
    }
}

// clear the canvas
World.prototype.clear = function() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(-this.width / 2, -this.height / 2,
        this.width, this.height);
}

function Audio() {
    this.ctx = new AudioContext();
    (async () => {
        this.winBuffer = await this.load(WIN_URL);
        this.crashBuffer = await this.load(CRASH_URL);
        this.hitBuffer = await this.load(HIT_URL);
        this.popBuffer = await this.load(POP_URL);
    })();
}

Audio.prototype.load = function(url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => this.ctx.decodeAudioData(data));
}

Audio.prototype.win = function() {
    this.playBuffer(this.winBuffer);
}

Audio.prototype.crash = function() {
    this.playBuffer(this.crashBuffer);
}

Audio.prototype.hit = function(sample) {
    this.playSample(this.hitBuffer, sample);
}

Audio.prototype.pop = function(size) {
    let variant = Math.floor(Math.random() * POP_VARIANTS);
    let sample = variant * ROID_MAX_SIZE + size - 1;
    this.playSample(this.popBuffer, sample);
}

Audio.prototype.playBuffer = function(buffer) {
    let source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    source.start();
}

Audio.prototype.playSample = function(buffer, sample) {
    let source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    source.start(0, sample * SAMPLE_OFFSET, SAMPLE_LENGTH);
}

// keep track of game time
function Clock(pos = Vec(0, CLOCK_OFFSET)) {
    this.pos = pos;
    this.start();
}

Clock.prototype.start = function() {
    this.last = Date.now();
    this.time = 0;
    this.ticks = 0;
}

// update game time from the clock and call update/tick as required
Clock.prototype.frame = function(w) {
    let now = Date.now();

    // limit game speed so we get at least a set number of frames per tick
    let dt = Math.min(MAX_GAME_TIME_PER_FRAME_MS, now - this.last);

    // go into stasis if we lag more than a tick behind
    this.last = Math.max(this.last + dt, now - TICK_MS);

    // perform update, stopping to tick if need be
    let next = this.time + dt;
    if (next > this.ticks * TICK_MS) {
        this.update(w, this.ticks * TICK_MS);
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

Clock.prototype.text = function() {
    let mins = Math.floor(this.ticks / 600);
    let secs = Math.floor(this.ticks / 10) % 60;
    let dec = this.ticks % 10;
    return `${mins}m${("0" + secs).slice(-2)}.${dec}s`;
}

Clock.prototype.draw = function(ctx, color = "#f40") {
    this.pos.write(ctx, CLOCK_FONT, this.text(), 0, color);
}

// keep track of the state of the game
function Overlay(world) {
    this.helpscroll = document.querySelector("#helpscroll");
    this.scrollheight = this.helpscroll.offsetParent.offsetHeight;
    this.helpheight = this.helpscroll.offsetHeight;

    this.world = world;
    this.title = true;
    this.victory = false;
    this.replay = false;
    this.result = null;
    this.head = Vec(0, TITLE_OFFSET);
    this.subhead = Vec(0, CLOCK_OFFSET);
    this.foot = Vec(0, -TITLE_OFFSET);

    addEventListener("keydown", (ev) => this.hitkey());
}

Overlay.prototype.hitkey = function() {
    if (this.title || this.replay) {
        this.helpscroll.style.visibility = "hidden";
        this.title = false;
        this.victory = false;
        this.replay = false;
        this.world.start();
    }
}

Overlay.prototype.finish = function(result, victory) {
    this.victory = victory;
    this.result = result;
    setTimeout(() => { this.replay = true; }, REPLAY_DELAY_MS);
}

Overlay.prototype.scroll = function(time) {
    if (this.title) {
        let avail = this.scrollheight - SCROLL_START;
        let max = this.helpheight + this.scrollheight;
        let scroll = Math.min(max, time * SCROLL_RATE / 1000);
        this.helpscroll.style.marginTop = "" + (avail - scroll) + "px";
    }
}

Overlay.prototype.draw = function(ctx) {
    if (this.title) {
        this.head.write(ctx, TITLE_FONT, TITLE_TEXT);
        this.foot.write(ctx, PLAY_FONT, PLAY_TEXT);
        this.help(ctx);
    } else {
        if (this.victory) {
            this.head.write(ctx, RESULT_FONT, VICTORY_TEXT);
            this.subhead.write(ctx, CLOCK_FONT, this.result, 0, "#ccc");
        } else {
            this.head.write(ctx, RESULT_FONT, GAME_OVER_TEXT);
        }
        if (this.replay) {
            this.foot.write(ctx, PLAY_FONT, REPLAY_TEXT);
        }
    }
}

Overlay.prototype.help = function(ctx) {
    ctx.save();
    let y = (HELP.length - 1) * HELP_LINEHEIGHT / 2;
    for (let line of HELP) {
        ctx.textAlign = "left";
        Vec(HELP_COL1, y).write(ctx, HELP_FONT, line[0]);
        ctx.textAlign = "center";
        Vec(HELP_COL2, y).write(ctx, HELP_FONT, line[1]);
        y -= HELP_LINEHEIGHT;
    }
    ctx.restore();
}

// keep track of which keys are currently pressed
function KeyState() {
    this.enabled = false;
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

KeyState.prototype.enable = function() {
    this.reset();
    this.enabled = true;
}

KeyState.prototype.keyevent = function(code, val) {
    if (!this.enabled) {
        return;
    }
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

// keep track of the current turning rate
function Turn() {
    this.rate = 0;
}

// how much turn do we get within our limits?
Turn.prototype.turn = function(ds) {
    let ramp = ds * TURN_RAMP_RATE;
    let next = Math.min(this.rate + ramp, TURN_RAD_PER_SEC);
    let avg = (this.rate + next) / 2;
    this.rate = next;
    return ds * avg;
}

Turn.prototype.decay = function(ds) {
    // turning rate decreases at half the rate it increases
    let ramp = ds * TURN_RAMP_RATE / 2;
    this.rate = Math.max(0, this.rate - ramp);
}

function Ship(controls, mu, path, heading = TAU / 4) {
    this.controls = controls;
    this.mu = mu;
    this.path = path;
    this.heading = heading;

    // rate of turn
    this.left = new Turn();
    this.right = new Turn();

    // ship state
    this.size = SHIP_SIZE;
    this.color = "lime";
    this.crashed = false;
    this.toast = false;

    // determine orbit from the path
    this.determineOrbit();
}

Ship.prototype.alive = function() {
    // controls are disabled once the ship dies
    return this.controls.enabled;
}

Ship.prototype.ahead = function(s = 1) {
    return Vec.polar(s, this.heading);
}

Ship.prototype.determineOrbit = function() {
    this.orbit = new Orbit(this.mu, this.path);
}

Ship.prototype.advance = function(dt) {
    if (this.alive()) {
        let ds = dt / 1000;

        // steering
        if (this.controls.left) {
            this.heading += this.left.turn(ds);
            this.right.rate = 0;
        } else {
            this.left.decay(ds);
        }
        if (this.controls.right) {
            this.heading -= this.right.turn(ds);
            this.left.rate = 0;
        } else {
            this.right.decay(ds);
        }
        this.heading = angle(this.heading);

        // thrust
        if (this.controls.forward) {
            this.thrust(ds * THRUST_ACCEL);
        } else if (this.controls.backward) {
            this.thrust(-ds * RETRO_ACCEL);
        }
    } else if (this.orbit.phi > TAU / 4 && this.orbit.phi < TAU / 2) {
        // we hit the sun earlier and have now left, dead but not gone,
        // but we will burn up completely next time we hit
        this.toast = true;
    }

    // move ship in orbit
    this.orbit.advance(dt);
    this.orbit.getPath(this.path);
}

Ship.prototype.thrust = function(dv) {
    this.path.impulse(this.ahead(dv));

    // ensure ship does not reach escape velocity
    let vmax = Math.sqrt(2 * this.mu / this.path.pos.len()) * SPEED_CAP;
    this.path.speedCap(vmax);

    // determine the new orbit after the change in velocity
    this.determineOrbit();
}

// ship is hit by a roid
Ship.prototype.crash = function(audio) {
    if (!this.crashed) {
        audio.crash();
        this.die();
        this.crashed = true;
        this.path.vel = this.path.vel.scale(SHIP_CRASH_SLOWDOWN);
        this.determineOrbit();
    }
}

Ship.prototype.die = function() {
    this.controls.enabled = false;
    this.color = "SlateGrey";
}

Ship.prototype.tick = function(ticks, smokes, bullets) {
    if (this.alive()) {
        if (this.controls.forward && ticks) {
            let aft = this.path.pos.plus(this.ahead(-5));
            smokes.push(new Smoke(aft, THRUST_SMOKE_SIZE));
        }
        if (this.controls.backward && ticks % 2) {
            let ahead = this.ahead();
            let fore = this.path.pos.plus(ahead.scale(4));
            let side = ahead.crossZ(3);
            smokes.push(new Smoke(fore.plus(side), RETRO_SMOKE_SIZE));
            smokes.push(new Smoke(fore.minus(side), RETRO_SMOKE_SIZE));
        }
        if (this.controls.trigger) {
            bullets.push(new Bullet(this.path, this.heading));
        }
    }
}

Ship.prototype.draw = function(ctx) {
    DEV && this.path.draw(ctx, "blue");
    DEV && this.controls.draw(ctx);
    if (this.alive()) {
        this.orbit.draw(ctx);
    }
    ctx.save();
    ctx.translate(this.path.pos.x, this.path.pos.y);
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

function Roid(mu, path, size = ROID_MAX_SIZE) {
    this.color = Roid.colors[Math.floor(Math.random() * Roid.colors.length)];
    this.size = size;
    this.info = Roid.info[this.size - 1];
    this.path = path.copy();
    this.fuzz(mu);
    this.orbit = new Orbit(mu, this.path);

    // hit points
    this.hp = this.info.minhp + Math.floor(this.info.varhp * Math.random());
}

// information for each roid size
Roid.info = [
    {radius: 12, minhp: 5, varhp: 8, font: "18px sans-serif", offset: 1.2},
    {radius: 18, minhp: 7, varhp: 10, font: "24px sans-serif", offset: 1.4},
    {radius: 24, minhp: 11, varhp: 12, font: "30px sans-serif", offset: 1},
    {radius: 30, minhp: 14, varhp: 12, font: "38px sans-serif", offset: 2},
];

Roid.colors = [
    "IndianRed", "PaleVioletRed", "Tomato", "Orchid", "DarkKhaki",
    "RebeccaPurple", "DarkSlateBlue", "Purple", "Olive", "Teal",
    "CadetBlue", "CornflowerBlue", "RosyBrown", "SaddleBrown", "Maroon",
];

Roid.prototype.advance = function(dt) {
    this.orbit.advance(dt);
    this.orbit.getPath(this.path);
}

// randomize the speed a little
Roid.prototype.fuzz = function(mu) {
    let fuzz = this.path.vel.len() * ROID_SPEED_FUZZ_FACTOR;
    this.path.impulse(Vec.fuzz(fuzz));
    // ensure roid does not reach escape velocity
    let vmax = Math.sqrt(2 * mu / this.path.pos.len()) * SPEED_CAP;
    this.path.speedCap(vmax);
}

// detect whether the roid is hit by an object at the given position,
// and that has the given radius
Roid.prototype.hit = function(pos, radius = 0) {
    let r = pos.minus(this.path.pos);
    return r.sqr() < (this.info.radius + radius) ** 2;
}

// take a bullet hit
Roid.prototype.smash = function(hits, roids, audio) {
    if (this.hp > hits) {
        this.hp -= hits;
        // keep this roid
        roids.push(this);
    } else {
        audio.pop(this.size);
        if (this.size > 1) {
            let mu = this.orbit.mu;
            let size = this.size - 1;
            let pos = this.path.pos;
            let side = pos.unit().scale(this.info.radius / 3);;
            let vel = this.path.vel.scale(ROID_SPEED_LOSS_FACTOR);
            let path1 = new Path(pos.plus(side), vel);
            let path2 = new Path(pos.minus(side), vel);
            // keep the remnants
            roids.push(new Roid(mu, new Path(pos.plus(side), vel), size));
            roids.push(new Roid(mu, new Path(pos.minus(side), vel), size));
        }
    }
}

Roid.prototype.draw = function(ctx) {
    let radius = this.info.radius;
    this.path.pos.spot(ctx, radius, this.color);
    this.path.pos.write(ctx, this.info.font, this.hp, this.info.offset);
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
    let t = 1;
    let period = TAU / this.omega;
    let alpha = ORBIT_ALPHA;
    while (alpha > 0 && t < period) {
        this.getPath(path, t);
        let color = "rgb(192 192 192 / " + Math.floor(alpha) + "%)";
        path.pos.spot(ctx, ORBIT_MARKER_SIZE, color);
        alpha -= this.omega * ORBIT_FADEOUT;
        t += 1;
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
    this.color = "white";
    this.radius = 1;
    this.damage = 1;
    this.life = BULLET_LIFE_MS;
    this.sample = 0;
    this.age = 0;
    this.path.impulse(Vec.polar(MUZZLE_VELOCITY, heading));
    this.setCritical(this.path.vel.len() - MUZZLE_VELOCITY);
}

Bullet.speedRecord = 0;

Bullet.criticals = [
    // speed thresholds must be decreasing in this list
    {speed: 250,
        color: "cyan",
        radius: 1,
        sample: 3,
        minhp: 9,
        varhp: 15,
        life: 600,
    },
    {speed: 180,
        color: "yellow",
        radius: 1.1,
        sample: 2,
        minhp: 4,
        varhp: 8,
        life: 340,
    },
    {speed: 130,
        color: "red",
        radius: 1.2,
        sample: 1,
        minhp: 2,
        varhp: 3,
        life: 160,
    },
];

Bullet.prototype.setCritical = function(speed) {
    if (DEV) {
        if (speed > Bullet.speedRecord) {
            Bullet.speedRecord = speed;
            console.log("bullet speed " + speed);
        }
    }
    for (let critical of Bullet.criticals) {
        if (speed > critical.speed) {
            this.color = critical.color;
            this.radius = critical.radius;
            this.sample = critical.sample;
            let extra = Math.floor(Math.random() * critical.varhp);
            this.damage = critical.minhp + extra;
            this.life += critical.life;
            break;
        }
    }
}

Bullet.prototype.advance = function(dt) {
    this.age += dt;
}

// use the bullet up and return the amount of damage caused
Bullet.prototype.destroy = function(audio) {
    if (this.age < this.life) {
        this.age = this.life;
        audio.hit(this.sample);
        return this.damage;
    } else {
        return 0;
    }
}

Bullet.prototype.position = function() {
    return this.path.position(this.age);
}

Bullet.prototype.draw = function(ctx) {
    if (this.age < this.life) {
        this.position().spot(ctx, this.radius, this.color);
    }
}

function Path(pos = Vec(), vel = Vec()) {
    this.pos = pos;
    this.vel = vel;
}

Path.prototype.copy = function() {
    return new Path(this.pos, this.vel);
}

Path.prototype.rotate = function(theta) {
    this.pos = this.pos.rotate(theta);
    this.vel = this.vel.rotate(theta);
}

Path.prototype.position = function(t = 0) {
    return this.pos.plus(this.vel.scale(t / 1000));
}

Path.prototype.impulse = function(dv) {
    this.vel = this.vel.plus(dv);
}

// cap the speed at the given amount
Path.prototype.speedCap = function(vmax) {
    let v = this.vel.len();
    if (v > vmax) {
        DEV && console.log("escape averted");
        this.vel = this.vel.scale(vmax / v);
    }
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

Vec.prototype.write = function(ctx, font, text, offset = 0, color = "#fff") {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.translate(this.x, this.y);
    ctx.scale(1, -1);
    ctx.fillText(text, 0, offset);
    ctx.restore();
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
