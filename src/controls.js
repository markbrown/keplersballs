export default function Controls() {
    this.enabled = false;
    this.reset();
    addEventListener("blur", (ev) => this.reset());
    addEventListener("keydown", (ev) => this.keyevent(ev.code, true));
    addEventListener("keyup", (ev) => this.keyevent(ev.code, false));
}

Controls.prototype.reset = function() {
    this.arrowUp = false;
    this.arrowDown = false;
    this.arrowLeft = false;
    this.arrowRight = false;

    this.keyW = false;
    this.keyA = false;
    this.keyS = false;
    this.keyD = false;

    this.numpad2 = false;
    this.numpad4 = false;
    this.numpad5 = false;
    this.numpad6 = false;
    this.numpad8 = false;

    this.space = false;
}

Controls.prototype.enable = function() {
    this.reset();
    this.enabled = true;
}

Controls.prototype.keyevent = function(code, val) {
    if (!this.enabled) {
        return;
    }
    switch (code) {
        case "ArrowUp":
            this.arrowUp = val;
            break;
        case "ArrowDown":
            this.arrowDown = val;
            break;
        case "ArrowLeft":
            this.arrowLeft = val;
            break;
        case "ArrowRight":
            this.arrowRight = val;
            break;
        case "KeyW":
            this.keyW = val;
            break;
        case "KeyA":
            this.keyA = val;
            break;
        case "KeyS":
            this.keyS = val;
            break;
        case "KeyD":
            this.keyD = val;
            break;
        case "Numpad2":
            this.numpad2 = val;
            break;
        case "Numpad4":
            this.numpad4 = val;
            break;
        case "Numpad5":
            this.numpad5 = val;
            break;
        case "Numpad6":
            this.numpad6 = val;
            break;
        case "Numpad8":
            this.numpad8 = val;
            break;
        case "Space":
            this.space = val;
            break;
    }
}

Controls.prototype.forward = function() {
    return this.arrowUp || this.keyW || this.numpad8;
}

Controls.prototype.backward = function() {
    return this.arrowDown || this.keyS || this.numpad2;
}

Controls.prototype.left = function() {
    return this.arrowLeft || this.keyA || this.numpad4;
}

Controls.prototype.right = function() {
    return this.arrowRight || this.keyD || this.numpad6;
}

Controls.prototype.trigger = function() {
    return this.space || this.numpad5;
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
