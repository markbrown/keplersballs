import Vec from "./vec.js";
import Clock from "./clock.js";

export default function Leaders(name = "best") {
    this.name = name;
    this.times = this.read();
    this.setup();
}

Leaders.FONT = "24px sans-serif";
Leaders.ROWS = 6;
Leaders.COLS = 2;
Leaders.LINE_TOP = 100;
Leaders.LINE_HEIGHT = 36;
Leaders.COL1 = -220;
Leaders.COL2 = 80;
Leaders.NUM_WIDTH = 50;
Leaders.COLOR = "#ddd";
Leaders.HIGHLIGHT = "DarkOrange";

Leaders.prototype.setup = function() {
    this.place = -1;
}

Leaders.prototype.read = function() {
    let best = localStorage.getItem(this.name);
    return best ? best.split(" ").map(str => Number(str)) : [];
}

Leaders.prototype.write = function() {
    localStorage.setItem(this.name, this.times.join(" "));
}

Leaders.prototype.insert = function(time) {
    this.place = this.times.findIndex(t => time < t);
    if (this.place >= 0) {
        this.times.splice(this.place, 0, time);
        this.times = this.times.slice(0, Leaders.COLS * Leaders.ROWS);
        this.write();
    } else if (this.times.length < Leaders.COLS * Leaders.ROWS) {
        this.place = this.times.length;
        this.times.push(time);
        this.write();
    }
}

Leaders.prototype.ordinal = function() {
    switch (this.place) {
        case 0: return "New record!!";
        case 1: return "2nd fastest!";
        case 2: return "3rd fastest!";
        default: return this.place > 2 ? `${this.place + 1}th fastest` : "";
    }
}

Leaders.prototype.draw = function(ctx) {
    ctx.save();
    ctx.textAlign = "left";
    for (let row = 0; row < Leaders.ROWS; row++) {
        let y = Leaders.LINE_TOP - row * Leaders.LINE_HEIGHT;
        this.drawLeader(ctx, row, Leaders.COL1, y);
        this.drawLeader(ctx, row + Leaders.ROWS, Leaders.COL2, y);
    }
    ctx.restore();
}

Leaders.prototype.drawLeader = function(ctx, i, x, y) {
    let color = (i == this.place) ? Leaders.HIGHLIGHT : Leaders.COLOR;
    let text = "--:--.-";
    if (i < this.times.length) {
        text = Clock.format(this.times[i], true);
    }
    Vec(x, y).write(ctx, Leaders.FONT, i + 1, 0, color);
    Vec(x + Leaders.NUM_WIDTH, y).write(ctx, Leaders.FONT, text, 0, color);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
