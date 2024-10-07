function World() {
    this.canvas = document.querySelector("#canvas");
    this.width = canvas.width = window.innerWidth;
    this.height = canvas.height = window.innerHeight;

    // set up Cartesian coordinates
    this.ctx = this.canvas.getContext("2d");
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(1, -1);
}

World.prototype.clear = function() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(-this.width / 2, -this.height / 2,
        this.width, this.height);
}

const w = new World();

w.clear();

// vi: set ai sw=4 ts=8 et sts=4 :
