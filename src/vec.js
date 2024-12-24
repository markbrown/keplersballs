const TAU = 2 * Math.PI;

export default function Vec(x = 0, y = 0) {
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

Vec.prototype.theta = function() {
    let theta = Math.atan2(this.y, this.x);
    return (theta < 0) ? theta + TAU : theta;
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

// vi: set ai sw=4 ts=8 et sts=4 :
