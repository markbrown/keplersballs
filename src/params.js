export default function Params(difficulty) {
    this.difficulty = difficulty;
    this.sunColor = "yellow";
    this.sunRadius = 10;
    this.setup(difficulty);

    // gravitational parameter
    this.mu = this.sunRadius * 1e5;

    // initial ship position
    this.shipRadius = this.sunRadius * 10;
}

Params.prototype.setup = function(difficulty) {
    if (difficulty == "easy") {
        this.setupEasy();
    } else if (difficulty == "hard") {
        this.setupHard();
    } else {
        this.setupMedium();
    }
}

Params.prototype.setupEasy = function() {
    this.roidCount = 4;
    this.roidSize = 2;
    this.roidMin = 360;
    this.roidVar = 30;
}

Params.prototype.setupMedium = function() {
    this.roidCount = 6;
    this.roidSize = 3;
    this.roidMin = 380;
    this.roidVar = 30;
}

Params.prototype.setupHard = function() {
    this.roidCount = 9;
    this.roidSize = 3;
    this.roidMin = 380;
    this.roidVar = 40;
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
