import Vec from "./vec.js";

const TAU = 2 * Math.PI;

export default function Debris(path, color, origRadius) {
    let scale = 1 + Math.random();

    this.path = path.copy();
    this.color = color;
    this.radius = origRadius * Debris.SIZE_FACTOR / scale ** 2;
    this.age = 0;
    this.life = Debris.LIFE_MS;

    let speed = scale * Debris.BASE_SPEED;
    this.path.impulse(Vec.polar(speed, TAU * Math.random()));
}

Debris.LIFE_MS = 200;
Debris.BASE_SPEED = 250;
Debris.SIZE_FACTOR = 0.2;

Debris.prototype.alive = function() {
    return this.age < this.life;
}

Debris.prototype.advance = function(dt, list = null) {
    this.age += dt;
    if (list && this.alive()) {
        list.push(this);
    }
}

Debris.prototype.draw = function(ctx) {
    let pos = this.path.position(this.age);
    pos.spot(ctx, this.radius, this.color);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
