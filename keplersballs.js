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

    this.mu = radius * GRAVITY_FACTOR;
    if (!path) {
        // place ship in circular orbit
        let p = radius * 10;
        let v = Math.sqrt(this.mu / p);
        path = new Path(Vec(p, 0), Vec(0, v));
    }
    this.ship = new Ship(path);

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

function Ship(path, heading = Math.PI / 2) {
    this.color = "lime";
    this.path = path;
    this.heading = heading;
}

Ship.prototype.draw = function(ctx) {
    DEV && this.path.draw(ctx, "blue");
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

function Path(pos, vel) {
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

const w = new World();

w.draw();

// vi: set ai sw=4 ts=8 et sts=4 :
