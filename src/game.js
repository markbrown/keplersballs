import Audio from "./audio.js";
import Clock from "./clock.js";
import Controls from "./controls.js";
import Help from "./help.js";
import Vec from "./vec.js";
import World from "./world.js";

export default function Game() {
    let canvas = document.getElementById("canvas");
    canvas.width = Game.WIDTH;
    canvas.height = Game.HEIGHT;

    // setup Cartesian coordinates
    this.ctx = canvas.getContext("2d");
    this.ctx.translate(Game.WIDTH / 2, Game.HEIGHT / 2);
    this.ctx.scale(1, -1);

    // center text
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.head = Vec(0, Game.TITLE_OFFSET);
    this.sub = Vec(0, Game.CLOCK_OFFSET);
    this.foot = Vec(0, -Game.TITLE_OFFSET);

    // keyboard state
    this.controls = new Controls();

    // game state
    this.title = true;
    this.running = false;
    this.replay = false;
    this.result = null;
    this.audio = null;
    this.clock = new Clock();
    this.world = new World(this.controls);
    this.help = new Help();

    // press any key to start
    addEventListener("keydown", (ev) => this.hitkey());
}

Game.WIDTH = 1280;
Game.HEIGHT = 720;
Game.TITLE_OFFSET = 260;
Game.CLOCK_OFFSET = 200;

Game.REPLAY_DELAY_MS = 2000;

Game.CLOCK_COLOR = "#f40";
Game.WIN_COLOR = "#ccc";

Game.TITLE_TEXT = "KEPLER'S BALLS";
Game.WIN_TEXT = "YOU WIN!";
Game.LOSE_TEXT = "GAME OVER";
Game.PLAY_TEXT = "press any key to play";
Game.REPLAY_TEXT = "press any key to play again";

Game.TITLE_FONT = "100px sans-serif";
Game.RESULT_FONT = "80px sans-serif";
Game.CLOCK_FONT = "20px sans-serif";
Game.PLAY_FONT = "28px sans-serif";

Game.prototype.hitkey = function() {
    if (this.title || this.replay) {
        if (!this.audio) {
            this.audio = new Audio();
        }
        this.help.hide();
        this.world = new World(this.controls, this.audio);
        this.title = false;
        this.running = true;
        this.replay = false;
        this.result = null;
        this.controls.enable();
        this.clock.start();
    }
}

Game.prototype.run = function() {
    this.clock.frame(this.world);

    // detect win
    if (this.running) {
        if (this.world.finished()) {
            this.audio.win();
            this.finish(this.clock.text(true));
        } else if (!this.controls.enabled) {
            this.finish();
        }
    }

    this.draw();
    requestAnimationFrame(() => this.run());
}

Game.prototype.finish = function(result = null) {
    this.running = false;
    this.result = result;
    setTimeout(() => { this.replay = true; }, Game.REPLAY_DELAY_MS);
}

Game.prototype.draw = function() {
    this.clear();
    this.world.draw(this.ctx);
    if (this.title) {
        this.head.write(this.ctx, Game.TITLE_FONT, Game.TITLE_TEXT);
        this.foot.write(this.ctx, Game.PLAY_FONT, Game.PLAY_TEXT);
        this.help.scroll(this.clock.time);
        this.help.draw(this.ctx);
    } else if (this.running) {
        let text = this.clock.text();
        this.sub.write(this.ctx, Game.CLOCK_FONT, text, 0, Game.CLOCK_COLOR);
    } else {
        if (this.result) {
            this.head.write(this.ctx, Game.RESULT_FONT, Game.WIN_TEXT);
            let text = this.result;
            this.sub.write(this.ctx, Game.CLOCK_FONT, text, 0, Game.WIN_COLOR);
        } else {
            this.head.write(this.ctx, Game.RESULT_FONT, Game.LOSE_TEXT);
        }
        if (this.replay) {
            this.foot.write(this.ctx, Game.PLAY_FONT, Game.REPLAY_TEXT);
        }
    }
}

Game.prototype.clear = function() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(-Game.WIDTH/2, -Game.HEIGHT/2, Game.WIDTH, Game.HEIGHT);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
