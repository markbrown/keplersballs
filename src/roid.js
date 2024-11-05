import Debris from "./debris.js";
import Orbit from "./orbit.js";
import Path from "./path.js";
import Vec from "./vec.js";

export default function Roid(mu, path, size = Roid.info.length - 1) {
    this.size = size;
    this.color = Roid.colors[Math.floor(Math.random() * Roid.colors.length)];

    // determine orbit
    path = path.copy();
    path.impulse(Vec.fuzz(path.speed() * Roid.FUZZ_FACTOR));
    path.cap(Math.sqrt(2 * mu / path.altitude()) * Roid.SPEED_CAP);
    this.orbit = new Orbit(mu, path);

    // size-dependant attributes
    let info = Roid.info[this.size];
    this.radius = info.radius;
    this.hp = info.minhp + Math.floor(info.varhp * Math.random());
    this.font = info.font;
    this.offset = info.offset;
}

Roid.LOSS_FACTOR = 0.8;
Roid.FUZZ_FACTOR = 0.15;
Roid.SPEED_CAP = 0.99;
Roid.DEBRIS = 9;

Roid.colors = [
    "IndianRed", "PaleVioletRed", "Tomato", "Orchid", "DarkKhaki",
    "RebeccaPurple", "DarkSlateBlue", "Purple", "Olive", "Teal",
    "CadetBlue", "CornflowerBlue", "RosyBrown", "SaddleBrown", "Maroon",
];

// information for each roid size
Roid.info = [
    {radius: 12, minhp: 5, varhp: 8, font: "18px sans-serif", offset: 1.2},
    {radius: 18, minhp: 7, varhp: 10, font: "24px sans-serif", offset: 1.4},
    {radius: 24, minhp: 11, varhp: 12, font: "30px sans-serif", offset: 1},
    {radius: 30, minhp: 14, varhp: 12, font: "38px sans-serif", offset: 2},
];

Roid.prototype.pos = function() {
    return this.orbit.path.pos;
}

Roid.prototype.vel = function() {
    return this.orbit.path.vel;
}

Roid.prototype.advance = function(dt, list = null) {
    this.orbit.advance(dt);
    if (list) {
        list.push(this);
    }
}

// detect whether the roid is hit by an object at the given position,
// and that has the given radius
Roid.prototype.collide = function(pos, radius = 0) {
    let r = pos.minus(this.pos());
    return r.sqr() < (this.radius + radius) ** 2;
}

// take a bullet hit and return the number of pops
Roid.prototype.smash = function(hits, roids, effects, audio) {
    if (this.hp > hits) {
        this.hp -= hits;
        // keep this roid
        roids.push(this);
        return 0;
    } else {
        audio.pop(this.size);
        for (let i = 0; i < Roid.DEBRIS; i++) {
            effects.push(new Debris(this.orbit.path, this.color, this.radius));
        }
        let result = 1;
        if (this.size > 0) {
            let mu = this.orbit.mu;
            let size = this.size - 1;
            let pos = this.pos();
            let side = pos.unit().scale(this.radius / 3);
            let vel = this.vel().scale(Roid.LOSS_FACTOR);
            // create remnants
            let r1 = new Roid(mu, new Path(pos.plus(side), vel), size);
            let r2 = new Roid(mu, new Path(pos.minus(side), vel), size);
            // keep doing damage
            let excess = hits - this.hp;
            let hits1 = Math.floor(excess * Math.random());
            let hits2 = excess - hits1;
            result += r1.smash(hits1, roids, effects, audio);
            result += r2.smash(hits2, roids, effects, audio);
        }
        return result;
    }
}

Roid.prototype.draw = function(ctx) {
    let pos = this.pos();
    pos.spot(ctx, this.radius, this.color);
    pos.write(ctx, this.font, this.hp, this.offset);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
