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

    // add a fullscreen button if we can
    if (document.fullscreenEnabled) {
        this.fullscreen = new Image();
        this.fullscreen.src = Expand;
        this.fullscreen.addEventListener("click", (e) => this.doFullscreen());
        this.buttons.appendChild(this.fullscreen);
        document.addEventListener("fullscreenchange",
            (e) => this.fullscreenChange());
    }

    this.fx = new Image();
    this.fx.src = Speaker;
    this.fx.addEventListener("click", (e) => this.doFx());
    this.buttons.appendChild(this.fx);

    this.music= new Image();
    this.music.src = Quavers;
    this.music.addEventListener("click", (e) => this.doMusic());
    this.buttons.appendChild(this.music);
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
