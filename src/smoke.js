import Vec from "./vec.js";

export default function Smoke(pos, radius) {
    this.pos = pos.plus(Vec.fuzz(Smoke.FUZZ));
    this.radius = radius;
    this.age = 0;
    this.life = Smoke.LIFE_MS;
}

Smoke.LIFE_MS = 2800;
Smoke.EXPANSION = 4;
Smoke.FUZZ = 3.5;

Smoke.prototype.alive = function() {
    return this.age < this.life;
}

Smoke.prototype.advance = function(dt, list = null) {
    this.age += dt;
    if (list && this.alive()) {
        list.push(this);
    }
}

Smoke.prototype.draw = function(ctx) {
    let radius = this.radius + this.age * Smoke.EXPANSION / 1000;
    let frac = Math.max(0, 1 - this.age / this.life);
    let alpha = 0.5 * frac ** 2;
    this.pos.spot(ctx, radius, `rgb(192 192 192 / ${alpha})`);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
