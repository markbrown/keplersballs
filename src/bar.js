import Vec from "./vec.js";

// progress bar
export default function Bar(col, title, color) {
    this.pos = Vec((col - 0.5) * (Bar.WIDTH + Bar.SEP), Bar.TITLE_OFFSET);
    this.x = (col - 1) * (Bar.WIDTH + Bar.SEP) + Bar.SEP / 2;
    this.title = title;
    this.color = color;
}

Bar.SEP = 40;
Bar.WIDTH = 240;
Bar.HEIGHT = 12;
Bar.OFFSET = 316;
Bar.TITLE_OFFSET = 340;
Bar.TITLE_FONT = "16pt Philosopher, sans-serif";
Bar.TITLE_COLOR = "#ccc";

Bar.prototype.draw = function(ctx, frac = 0) {
    this.pos.write(ctx, Bar.TITLE_FONT, this.title, 0, Bar.TITLE_COLOR);
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.strokeRect(this.x, Bar.OFFSET, Bar.WIDTH, Bar.HEIGHT);
    ctx.fillRect(this.x, Bar.OFFSET, frac * Bar.WIDTH, Bar.HEIGHT);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
