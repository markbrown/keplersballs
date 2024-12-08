import Vec from "./vec.js";

export default function Help() {
    // about
    this.help = document.getElementById("help");
    this.about = document.getElementById("about");
}

Help.SCROLL_START = 100;
Help.SCROLL_RATE = 16;

// hide the help
Help.prototype.hide = function() {
    this.help.style.visibility = "hidden";
}

// show the help
Help.prototype.show = function() {
    this.help.style.visibility = "visible";
}

Help.prototype.scroll = function(time) {
    let viewheight = this.about.offsetParent.offsetHeight;
    let helpheight = this.about.offsetHeight;
    let start = viewheight - Help.SCROLL_START;
    let max = helpheight + viewheight;
    let scroll = Math.min(max, time * Help.SCROLL_RATE / 1000);
    this.about.style.marginTop = `${start - scroll}px`;
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
