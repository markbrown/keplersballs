import Vec from "./vec.js";

export default function Bullet(path, heading) {
    this.path = path.copy();
    this.age = 0;

    // fire the bullet
    this.path.impulse(Vec.polar(Bullet.MUZZLE_VELOCITY, heading));
    let speed = this.path.speed();
    for (let critical of Bullet.criticals) {
        if (speed > critical.speed) {
            this.color = critical.color;
            this.life = critical.life;
            let extra = Math.floor(Math.random() * critical.varhp);
            this.damage = critical.minhp + extra;
            break;
        }
    }
}

Bullet.MUZZLE_VELOCITY = 200;
Bullet.RADIUS = 1.6;

Bullet.criticals = [
    // speed thresholds must be decreasing in this list
    {speed: 450, color: "cyan", life: 2200, minhp: 16, varhp: 25},
    {speed: 380, color: "yellow", life: 1500, minhp: 8, varhp: 14},
    {speed: 330, color: "red", life: 1200, minhp: 4, varhp: 6},
    {speed: 0, color: "white", life: 1000, minhp: 1, varhp: 0},
];

Bullet.prototype.alive = function() {
    return this.age < this.life;
}

Bullet.prototype.position = function() {
    return this.path.position(this.age);
}

Bullet.prototype.advance = function(dt, list = null) {
    this.age += dt;
    if (list && this.alive()) {
        list.push(this);
    }
}

// use the bullet up and return the amount of damage caused
Bullet.prototype.hit = function(audio) {
    if (this.alive()) {
        audio.hit();
        this.life = 0;
        return this.damage;
    } else {
        return 0;
    }
}

Bullet.prototype.draw = function(ctx) {
    if (this.alive()) {
        this.position().spot(ctx, Bullet.RADIUS, this.color);
    }
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
