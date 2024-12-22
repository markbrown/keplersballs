import Audio from "./audio.js";
import Expand from "./expand.svg";
import Retract from "./retract.svg";

export default function Buttons(game) {
    this.game = game;
    this.container = document.getElementById("container");
    this.buttons = document.getElementById("buttons");
    this.confirmItem = document.getElementById("confirm");
    this.fullscreen = null;
    this.idleTimer = null;
    this.ignoreMove = false;
    this.confirmReset = false;

    this.reload = document.getElementById("reload");
    this.reload.addEventListener("click", () => this.doReload());

    this.reset = document.getElementById("reset");
    this.reset.addEventListener("click", (ev) => this.doReset(ev));

    this.difficulty = document.getElementById("difficulty");
    this.difficulty.addEventListener("change", () => this.difficultyChange());
    this.difficulty.addEventListener("focus", () => this.hideConfirm());

    this.quavers = document.getElementById("quavers");
    this.quavers.addEventListener("click", () => this.doQuavers());

    this.speaker = document.getElementById("speaker");
    this.speaker.addEventListener("click", () => this.doSpeaker());

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
}

Buttons.MOUSE_TIMEOUT = 1000;
Buttons.COLOR_ON = "#fff";
Buttons.COLOR_OFF = "#444";

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

Buttons.prototype.startPlaying = function() {
    this.reset.style.visibility = "hidden";
    this.difficulty.disabled = true;
}

Buttons.prototype.stopPlaying = function() {
    this.reset.style.visibility = "visible";
    this.difficulty.disabled = false;
}

Buttons.prototype.doReload = function() {
    this.game.reload();
}

Buttons.prototype.doReset = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    if (this.confirmReset) {
        this.hideConfirm();
        this.game.leaders.reset();
    } else {
        this.showConfirm();
    }
}

Buttons.prototype.showConfirm = function() {
    if (!this.confirmReset) {
        this.confirmReset = true;
        this.confirmItem.classList.add("highlight");
    }
}

Buttons.prototype.hideConfirm = function() {
    if (this.confirmReset) {
        this.confirmReset = false;
        this.confirmItem.classList.remove("highlight");
    }
}

Buttons.prototype.doQuavers = function() {
    if (this.game.audio.music) {
        this.game.audio.disableMusic();
        this.quavers.style.fill = Buttons.COLOR_OFF;
    } else {
        this.game.audio.enableMusic();
        this.quavers.style.fill = Buttons.COLOR_ON;
    }
}

Buttons.prototype.doSpeaker = function() {
    if (this.game.audio.fx) {
        this.game.audio.disableFx();
        this.speaker.style.fill = Buttons.COLOR_OFF;
    } else {
        this.game.audio.enableFx();
        this.speaker.style.fill = Buttons.COLOR_ON;
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

Buttons.prototype.difficultyChange = function() {
    this.game.result = null;
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
