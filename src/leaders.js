import Vec from "./vec.js";
import Clock from "./clock.js";

export default function Leaders(name = "keplersballs") {
    this.name = name;
    this.times = {
        easy: this.read("easy"),
        medium: this.read("medium"),
        hard: this.read("hard"),
    };
    this.setup();
}

Leaders.FONT = "24pt 'League Spartan', sans-serif";
Leaders.ROWS = 6;
Leaders.COLS = 2;
Leaders.LINE_TOP = 80;
Leaders.LINE_HEIGHT = 36;
Leaders.COL1 = -220;
Leaders.COL2 = 80;
Leaders.NUM_WIDTH = 50;
Leaders.COLOR = "#ddd";
Leaders.HIGHLIGHT = "DarkOrange";

Leaders.prototype.setup = function() {
    this.place = -1;
    this.difficulty = null;
}

Leaders.prototype.reset = function() {
    localStorage.clear();
    this.times.easy = [];
    this.times.medium = [];
    this.times.hard = [];
    this.setup();
}

Leaders.prototype.read = function(difficulty) {
    let val = localStorage.getItem(`${this.name}.${difficulty}`);
    return val ? val.split(" ").map(str => Number(str)) : [];
}

Leaders.prototype.write = function(difficulty) {
    let val = this.times[difficulty].join(" ");
    localStorage.setItem(`${this.name}.${difficulty}`, val);
}

Leaders.prototype.insert = function(time, difficulty) {
    const count = Leaders.COLS * Leaders.ROWS;

    let times = this.times[difficulty];
    this.place = times.findIndex(t => time < t);
    if (this.place >= 0) {
        times.splice(this.place, 0, time);
        this.times[difficulty] = times.slice(0, count);
    } else if (times.length < count) {
        this.place = times.length;
        times.push(time);
    }

    if (this.place >= 0) {
        this.difficulty = difficulty;
        this.write(difficulty);
    }
}

Leaders.prototype.ordinal = function() {
    switch (this.place) {
        case 0: return "New record!!";
        case 1: return "2nd best time!";
        case 2: return "3rd best time!";
        default: return this.place > 2 ? `${this.place + 1}th best time` : "";
    }
}

Leaders.prototype.draw = function(ctx, difficulty) {
    ctx.save();
    ctx.textAlign = "left";
    for (let row = 0; row < Leaders.ROWS; row++) {
        let y = Leaders.LINE_TOP - row * Leaders.LINE_HEIGHT;
        this.drawLeader(ctx, difficulty, row, Leaders.COL1, y);
        this.drawLeader(ctx, difficulty, row + Leaders.ROWS, Leaders.COL2, y);
    }
    ctx.restore();
}

Leaders.prototype.drawLeader = function(ctx, difficulty, place, x, y) {
    let color = Leaders.COLOR;
    if (difficulty == this.difficulty && place == this.place) {
        color = Leaders.HIGHLIGHT;
    }
    let text = "--m--.-s";
    let times = this.times[difficulty];
    if (place < times.length) {
        text = Clock.format(times[place], true);
    }
    Vec(x, y).write(ctx, Leaders.FONT, place + 1, 0, color);
    Vec(x + Leaders.NUM_WIDTH, y).write(ctx, Leaders.FONT, text, 0, color);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
