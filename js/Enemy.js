import { CONFIG } from './config.js';
import { randomInt } from './util.js';

export default class Enemy {
    constructor(context, spawnY = CONFIG.TRAFFIC_START_Y, random = Math.random) {
        this.context = context;
        this.random = random;
        this.asset = new Image();
        this.asset.src = './assets/green.png';
        this.velocity = CONFIG.TRAFFIC_SPEED;
        this.height = CONFIG.CAR_HEIGHT;
        this.width = CONFIG.CAR_WIDTH;
        this.reset(spawnY);
    }

    reset(spawnY = CONFIG.TRAFFIC_START_Y) {
        this.lane = randomInt(0, CONFIG.LANES.length, this.random);
        this.x = CONFIG.LANES[this.lane];
        this.y = spawnY;
    }

    show() {
        this.context.drawImage(this.asset, this.x, this.y);
    }

    update() {
        this.y += this.velocity;
    }

    die() {
        return this.y > CONFIG.CANVAS_HEIGHT + 200;
    }
}
