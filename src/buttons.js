import Audio from "./audio.js";
import Expand from "./expand.svg";
import Retract from "./retract.svg";
import Speaker from "./speaker.svg";
import SpeakerOff from "./speakeroff.svg";

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

    this.mute = new Image();
    this.mute.src = Speaker;
    this.mute.addEventListener("click", (e) => this.doMute());
    this.buttons.appendChild(this.mute);
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

Buttons.prototype.doMute = function() {
    if (!this.game.audio) {
        this.mute.src = SpeakerOff;
        this.game.audio = new Audio(false);
    } else if (this.game.audio.enabled) {
        this.mute.src = SpeakerOff;
        this.game.audio.disable();
    } else {
        this.mute.src = Speaker;
        this.game.audio.enable();
    }
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
