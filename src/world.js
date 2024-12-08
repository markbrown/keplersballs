import Path from "./path.js";
import Roid from "./roid.js";
import Ship from "./ship.js";
import Vec from "./vec.js";

const TAU = 2 * Math.PI;

export default
function World(params, controls, audio) {
    // sound effects
    this.audio = audio;

    // visual effects
    this.effects = [];

    // the sun
    this.color = params.sunColor;
    this.radius = params.sunRadius;

    // gravitational parameter
    this.mu = params.mu;

    // ship
    let path = this.circle(params.shipRadius);
    this.ship = new Ship(params, controls, path);

    // bullets currently in flight
    this.bullets = [];

    // roids
    this.total = 0;
    this.roids = [];
    for (let i = 0; i < params.roidCount; i++) {
        this.addRoid(params);
    }

    // progress
    this.popped = 0;
}

// return a path for a circular orbit
World.prototype.circle = function(radius, theta = 0) {
    let speed = Math.sqrt(this.mu / radius);
    let pos = Vec.polar(radius, theta);
    let vel = Vec.polar(speed, theta + Math.PI / 2);
    return new Path(pos, vel);
}

// add a random roid
World.prototype.addRoid = function(params) {
    let radius = params.roidMin + Math.random() * params.roidVar;
    let path = this.circle(radius, Math.random() * TAU);
    this.roids.push(new Roid(params, path, params.roidSize));
    this.total += 2 ** (params.roidSize + 1) - 1;
}

// check if all roids are destroyed
World.prototype.finished = function() {
    return this.roids.length == 0;
}

// perform actions at regular intervals
World.prototype.tick = function(ticks) {
    this.ship && this.ship.tick(ticks, this.bullets, this.effects);
}

// update the world each animation frame
World.prototype.update = function(dt) {
    this.ship && this.ship.advance(dt);

    let bullets = [];
    this.bullets.forEach((bullet) => bullet.advance(dt, bullets));
    this.bullets = bullets;

    let roids = [];
    this.roids.forEach((roid) => roid.advance(dt, roids));
    this.roids = roids;

    let effects = [];
    this.effects.forEach((effect) => effect.advance(dt, effects));
    this.effects = effects;

    // only check for collisions once the game has started
    this.audio && this.collisions();
}

World.prototype.collisions = function() {
    // check for bullets hitting roids
    let roids = [];
    this.roids.forEach((roid) => {
        let hits = 0;
        this.bullets.forEach((bullet) => {
            if (roid.collide(bullet.position(), bullet.radius)) {
                hits += bullet.hit(this.audio);
            }
        });
        this.popped += roid.smash(hits, roids, this.effects, this.audio);
    });
    this.roids = roids;

    this.ship && this.checkShip();
}

World.prototype.checkShip = function() {
    // check for ship hitting a roid
    this.roids.forEach((roid) => {
        if (roid.collide(this.ship.pos(), Ship.SIZE)) {
            this.ship.crash(this.audio);
        }
    });

    // check for ship overheating or hitting the sun
    if (this.ship.alive() && this.ship.heat >= 1) {
        this.ship.die("ship overheated");
    }
    if (this.ship.fried(this.radius, this.audio)) {
        this.ship = null;
    }
}

World.prototype.signal = function() {
    return this.ship ? this.ship.pos().sqr() : 0;
}

World.prototype.shipHeat = function() {
    return this.ship ? Math.min(1, this.ship.heat) : 0;
}

World.prototype.shipDeath = function() {
    return this.ship ? this.ship.death : "";
}

World.prototype.progress = function() {
    return this.popped / this.total;
}

World.prototype.draw = function(ctx) {
    this.ship && this.ship.draw(ctx);
    this.bullets.forEach((bullet) => bullet.draw(ctx));
    this.effects.forEach((effect) => effect.draw(ctx));
    this.roids.forEach((roid) => roid.draw(ctx));

    // draw sun
    Vec().spot(ctx, this.radius, this.color);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
