import Audio from "./audio.js";
import Expand from "./expand.svg";
import Quavers from "./quavers.svg";
import QuaversOff from "./quaversoff.svg";
import Retract from "./retract.svg";
import Speaker from "./speaker.svg";
import SpeakerOff from "./speakeroff.svg";

export default function Buttons(game) {
    this.game = game;
    this.container = document.getElementById("container");
    this.buttons = document.getElementById("buttons");
    this.fullscreen = null;
    this.idleTimer = null;
    this.ignoreMove = false;

    // add a fullscreen button if we can
    if (document.fullscreenEnabled) {
        this.fullscreen = new Image();
        this.fullscreen.src = Expand;
        this.fullscreen.addEventListener("click", (e) => this.doFullscreen());
        this.buttons.appendChild(this.fullscreen);
        document.addEventListener("fullscreenchange",
            (e) => this.fullscreenChange());
        document.addEventListener("mousemove", () => this.mousemove());
        document.addEventListener("mouseover", () => this.mouseover());
    }

    this.fx = new Image();
    this.fx.src = Speaker;
    this.fx.addEventListener("click", (e) => this.doFx());
    this.buttons.appendChild(this.fx);

    this.music = new Image();
    this.music.src = Quavers;
    this.music.addEventListener("click", (e) => this.doMusic());
    this.buttons.appendChild(this.music);
}

Buttons.MOUSE_TIMEOUT = 1000;

Buttons.prototype.mouseover = function() {
    if (!document.fullscreenElement) {
        this.container.style.cursor = "";
    }
}

Buttons.prototype.mousemove = function() {
    if (this.ignoreMove) {
        return;
    } else if (document.fullscreenElement) {
        this.container.style.cursor = "";
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            this.container.style.cursor = "none";
            this.ignoreMove = true;
            setTimeout(() => { this.ignoreMove = false; }, 200);
        }, Buttons.MOUSE_TIMEOUT);
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
        // just expanded
        this.fullscreen.src = Retract;
        this.container.style.cursor = "none";
    } else {
        // just retracted
        this.fullscreen.src = Expand;
        this.container.style.cursor = "";
    }
}

Buttons.prototype.doFx = function() {
    if (this.game.audio.fx) {
        this.fx.src = SpeakerOff;
        this.game.audio.disableFx();
    } else {
        this.fx.src = Speaker;
        this.game.audio.enableFx();
    }
}

Buttons.prototype.doMusic = function() {
    if (this.game.audio.music) {
        this.music.src = QuaversOff;
        this.game.audio.disableMusic();
    } else {
        this.music.src = Quavers;
        this.game.audio.enableMusic();
    }
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
