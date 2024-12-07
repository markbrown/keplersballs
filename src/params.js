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
    this.roidMin = 320;
    this.roidVar = 40;
    this.roidBaseHP = -2;
    this.shipThrust = 24;
    this.shipDissipationMin = 18e-3;
    this.shipDissipationVar = 12e-3;
}

Params.prototype.setupMedium = function() {
    this.roidCount = 6;
    this.roidSize = 3;
    this.roidMin = 380;
    this.roidVar = 30;
    this.roidBaseHP = 0;
    this.shipThrust = 20;
    this.shipDissipationMin = 15e-3;
    this.shipDissipationVar = 10e-3;
}

Params.prototype.setupHard = function() {
    this.roidCount = 9;
    this.roidSize = 3;
    this.roidMin = 370;
    this.roidVar = 40;
    this.roidBaseHP = 2;
    this.shipThrust = 16;
    this.shipDissipationMin = 15e-3;
    this.shipDissipationVar = 7e-3;
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
