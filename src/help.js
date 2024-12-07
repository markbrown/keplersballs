import Vec from "./vec.js";

export default function Help() {
    // controls
    this.linetop = (Help.lines.length - 1) * Help.LINEHEIGHT / 2;

    // about
    this.helpscroll = document.getElementById("helpscroll");
}

Help.lines = [
    {name: "Thrusters:", controls: "↑ or W"},
    {name: "Turn left:", controls: "← or A"},
    {name: "Turn right:", controls: "→ or D"},
    {name: "Retro thrusters:", controls: "↓ or S"},
    {name: "Trigger:", controls: "space"},
    {name: "Trigger lock:", controls: "enter"},
];

Help.FONT = "22pt Philosopher, sans-serif";
Help.SCROLL_START = 100;
Help.SCROLL_RATE = 16;
Help.LINEHEIGHT = 36;
Help.COL1 = 120;
Help.COL2 = 400;
Help.COLOR = "#ddd";

// hide the helpscroll
Help.prototype.hide = function() {
    this.helpscroll.style.visibility = "hidden";
}

// show the helpscroll
Help.prototype.show = function() {
    this.helpscroll.style.visibility = "visible";
}

Help.prototype.scroll = function(time) {
    let viewheight = this.helpscroll.offsetParent.offsetHeight;
    let helpheight = this.helpscroll.offsetHeight;
    let start = viewheight - Help.SCROLL_START;
    let max = helpheight + viewheight;
    let scroll = Math.min(max, time * Help.SCROLL_RATE / 1000);
    this.helpscroll.style.marginTop = `${start - scroll}px`;
}

Help.prototype.draw = function(ctx) {
    ctx.save();
    for (let i = 0; i < Help.lines.length; i++) {
        let line = Help.lines[i];
        let y = this.linetop - i * Help.LINEHEIGHT;
        ctx.textAlign = "left";
        Vec(Help.COL1, y).write(ctx, Help.FONT, line.name, 0, Help.COLOR);
        ctx.textAlign = "center";
        Vec(Help.COL2, y).write(ctx, Help.FONT, line.controls, 0, Help.COLOR);
    }
    ctx.restore();
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
