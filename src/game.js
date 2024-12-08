import Audio from "./audio.js";
import Bar from "./bar.js";
import Buttons from "./buttons.js";
import Clock from "./clock.js";
import Controls from "./controls.js";
import Help from "./help.js";
import Leaders from "./leaders.js";
import Params from "./params.js";
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

    // input
    this.controls = new Controls();
    this.buttons = new Buttons(this);

    // game state
    this.title = true;
    this.running = false;
    this.replay = false;
    this.win = false;
    this.result = null;
    this.audio = new Audio();
    this.clock = new Clock();
    this.params = new Params(this.difficulty());
    this.world = new World(this.params, this.controls, this.audio);
    this.leaders = new Leaders();
    this.help = new Help();

    // status bars
    this.progress = new Bar(0, "progress", Game.PROGRESS_COLOR);
    this.heat = new Bar(1, "temperature", Game.HEAT_COLOR);
    this.range = Game.WIDTH ** 2 + Game.HEIGHT ** 2;

    // press any key to start
    addEventListener("keydown", (ev) => this.hitkey(ev));
    addEventListener("click", (ev) => this.click(ev));
}

Game.WIDTH = 1280;
Game.HEIGHT = 720;
Game.TITLE_OFFSET = 240;
Game.CLOCK_OFFSET = 150;

Game.REPLAY_DELAY_MS = 2000;

Game.CLOCK_COLOR = "DarkOrange";
Game.WIN_COLOR = "#ccc";
Game.PROGRESS_COLOR = "RoyalBlue";
Game.HEAT_COLOR = "Crimson";
Game.WARNING_COLOR = "Crimson";

Game.TITLE_TEXT = "KEPLER'S BALLS";
Game.WIN_TEXT = "YOU WIN!";
Game.LOSE_TEXT = "GAME OVER";
Game.PLAY_TEXT = "press any key to play";
Game.REPLAY_TEXT = "press any key to play again";
Game.WARNING_TEXT = "LOW SIGNAL WARNING";

Game.TITLE_FONT = "80pt Philosopher, sans-serif";
Game.PLAY_FONT = "28pt Philosopher, sans-serif";
Game.RESULT_FONT = "60pt Philosopher, sans-serif";
Game.CLOCK_FONT = "20pt 'League Spartan', sans-serif";
Game.WARNING_FONT = "60pt 'League Spartan', sans-serif";

Game.prototype.difficulty = function() {
    return this.buttons.difficulty.value;
}

Game.prototype.hitkey = function(ev) {
    this.buttons.hideConfirm();
    if (this.title || this.replay) {
        if (!this.audio.ctx) {
            this.audio.setup();
        }
        this.help.hide();
        this.buttons.startPlaying();
        this.params.setup(this.difficulty());
        this.world = new World(this.params, this.controls, this.audio);
        this.title = false;
        this.running = true;
        this.replay = false;
        this.result = null;
        this.leaders.setup();
        this.controls.enable();
        this.clock.start();
        this.audio.startPlaying();
    }
}

Game.prototype.click = function(ev) {
    this.buttons.hideConfirm();
}

Game.prototype.reload = function() {
    this.title = true;
    this.running = false;
    this.controls.enabled = false;
    this.buttons.stopPlaying();
    this.audio.stopMusic();
    this.clock.start();
    this.help.show();
}

Game.prototype.run = function() {
    this.clock.frame(this.world);

    // detect end of game
    if (this.running) {
        if (this.world.finished()) {
            this.audio.win();
            this.win = true;
            this.result = this.clock.finish(this.leaders, this.difficulty());
            this.finish();
        } else if (!this.controls.enabled) {
            this.win = false;
            this.result = this.world.shipDeath();
            this.finish();
        } else if (this.world.signal() > this.range) {
            this.win = false;
            this.result = "ship lost";
            this.finish();
        }
    }

    this.draw();
    requestAnimationFrame(() => this.run());
}

Game.prototype.finish = function() {
    this.running = false;
    this.controls.enabled = false;
    this.audio.stopPlaying();
    this.buttons.stopPlaying();
    setTimeout(() => { this.replay = true; }, Game.REPLAY_DELAY_MS);
}

Game.prototype.draw = function() {
    this.clear();
    this.world.draw(this.ctx);
    if (this.title) {
        this.head.write(this.ctx, Game.TITLE_FONT, Game.TITLE_TEXT);
        this.foot.write(this.ctx, Game.PLAY_FONT, Game.PLAY_TEXT);
        this.help.scroll(this.clock.time);
    } else if (this.running) {
        // time
        let text = this.clock.current;
        this.sub.write(this.ctx, Game.CLOCK_FONT, text, 0, Game.CLOCK_COLOR);
        this.drawStatus();

        // low signal warning
        if (this.world.signal() > this.range / 4 && Date.now() % 800 < 400) {
            Vec().write(this.ctx, Game.WARNING_FONT, Game.WARNING_TEXT, 0,
                Game.WARNING_COLOR);
        }
    } else {
        if (this.win) {
            this.head.write(this.ctx, Game.RESULT_FONT, Game.WIN_TEXT);
        } else {
            this.head.write(this.ctx, Game.RESULT_FONT, Game.LOSE_TEXT);
        }
        if (this.result) {
            let text = this.result;
            this.sub.write(this.ctx, Game.CLOCK_FONT, text, 0, Game.WIN_COLOR);
        }
        this.drawStatus();
        this.leaders.draw(this.ctx, this.difficulty());
        if (this.replay) {
            this.foot.write(this.ctx, Game.PLAY_FONT, Game.REPLAY_TEXT);
        }
    }
}

Game.prototype.drawStatus = function() {
    this.progress.draw(this.ctx, this.world.progress());
    this.heat.draw(this.ctx, this.world.shipHeat());
}

Game.prototype.clear = function() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(-Game.WIDTH/2, -Game.HEIGHT/2, Game.WIDTH, Game.HEIGHT);
}

// vi: set ai sw=4 ts=8 sts=4 et ai :
