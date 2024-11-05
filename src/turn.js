const TAU = 2 * Math.PI;

// keep track of the current turning rate
export default function Turn() {
    this.rate = 0;
}

Turn.RATE = TAU;
Turn.RAMP = 5 * TAU;
Turn.DECAY = 2 * TAU;

// how much turn do we get within our limits
Turn.prototype.turn = function(ds) {
    let ramp = ds * Turn.RAMP;
    let next = Math.min(this.rate + ramp, Turn.RATE);
    let avg = (this.rate + next) / 2;
    this.rate = next;
    return ds * avg;
}

Turn.prototype.decay = function(ds) {
    let decay = ds * Turn.DECAY;
    this.rate = Math.max(0, this.rate - decay);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
