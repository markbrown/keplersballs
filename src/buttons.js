import Expand from "./expand.svg";
import Retract from "./retract.svg";

export default function Buttons(game) {
    this.game = game;
    this.container = document.getElementById("container");
    this.buttons = document.getElementById("buttons");

    // add a fullscreen button if we can
    if (document.fullscreenEnabled) {
        this.fullscreen = new Image();
        this.fullscreen.src = Expand;
        this.fullscreen.addEventListener("click", (e) => this.doFullscreen());
        this.buttons.appendChild(this.fullscreen);
        document.addEventListener("fullscreenchange",
            (e) => this.fullscreenChange());
    }
}

Buttons.prototype.doFullscreen = function() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        this.container.requestFullscreen();
    }
}

Buttons.prototype.fullscreenChange = function() {
    if (document.fullscreenElement) {
        this.fullscreen.src = Retract;
    } else {
        this.fullscreen.src = Expand;
    }
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
