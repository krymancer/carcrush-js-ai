import { CONFIG } from './config.js';
import NeuralNetwork from './NeuralNetwork.js';
import { clamp, randomInt } from './util.js';

const ACTIONS = Object.freeze(['LEFT', 'STAY', 'RIGHT']);
const COLORS = Object.freeze(['blue', 'gray', 'pinck', 'pruple']);

export default class Player {
    constructor(brain = null, { mutate = true, random = Math.random } = {}) {
        this.random = random;
        this.lane = 1;
        this.x = CONFIG.LANES[this.lane];
        this.displayX = this.x;
        this.y = CONFIG.PLAYER_Y;
        this.width = CONFIG.CAR_WIDTH;
        this.height = CONFIG.CAR_HEIGHT;
        this.score = 0;
        this.survivalTicks = 0;
        this.fitness = 0;
        this.lastInputs = null;
        this.lastHidden = null;
        this.lastOutput = null;
        this.lastDecision = 'STAY';
        this.framesUntilMove = 0;

        this.color = COLORS[randomInt(0, COLORS.length, random)];
        this.asset = new Image();
        this.asset.src = `./assets/${this.color}.png`;

        if (brain instanceof NeuralNetwork) {
            this.brain = brain.copy();
            if (mutate) {
                this.brain.mutate(
                    CONFIG.MUTATION_RATE,
                    CONFIG.MUTATION_STRENGTH,
                    random
                );
            }
        } else {
            this.brain = new NeuralNetwork(
                CONFIG.NN_INPUTS,
                CONFIG.NN_HIDDEN,
                CONFIG.NN_OUTPUTS,
                random
            );
        }
    }

    collide(enemy) {
        const sameLane = this.lane === (enemy.lane ?? CONFIG.LANES.indexOf(enemy.x));
        const overlapsY = this.y <= enemy.y + enemy.height && this.y + this.height > enemy.y;
        return sameLane && overlapsY;
    }

    show(context) {
        const distance = this.x - this.displayX;
        this.displayX += Math.sign(distance)
            * Math.min(Math.abs(distance), CONFIG.DISPLAY_MOVE_SPEED);
        context.drawImage(this.asset, this.displayX, this.y);
    }

    move(direction) {
        const delta = direction === 'LEFT' ? -1 : direction === 'RIGHT' ? 1 : 0;
        const nextLane = clamp(this.lane + delta, 0, CONFIG.LANES.length - 1);
        if (nextLane === this.lane) return false;
        this.lane = nextLane;
        this.x = CONFIG.LANES[this.lane];
        return true;
    }

    sense(enemies) {
        const clearances = new Array(CONFIG.LANES.length).fill(1);

        for (const enemy of enemies) {
            if (enemy.y > this.y + this.height) continue;
            const lane = enemy.lane ?? CONFIG.LANES.indexOf(enemy.x);
            if (lane < 0) continue;
            const gap = Math.max(0, this.y - (enemy.y + enemy.height));
            const normalizedGap = clamp(gap / CONFIG.SENSOR_RANGE, 0, 1);
            clearances[lane] = Math.min(clearances[lane], normalizedGap);
        }

        return [this.lane / (CONFIG.LANES.length - 1), ...clearances];
    }

    think(enemies) {
        const inputs = this.sense(enemies);
        const activations = this.brain.activations(inputs);
        const actionIndex = activations.output.reduce(
            (best, value, index, values) => value > values[best] ? index : best,
            0
        );

        this.lastInputs = inputs;
        this.lastHidden = activations.hidden;
        this.lastOutput = activations.output;
        this.lastDecision = ACTIONS[actionIndex];

        if (this.framesUntilMove > 0) {
            this.framesUntilMove--;
            return;
        }
        if (this.lastDecision === 'STAY') return;

        if (this.move(this.lastDecision)) {
            this.framesUntilMove = CONFIG.LANE_CHANGE_COOLDOWN;
        }
    }

    recordProgress(passedTraffic = 0) {
        this.survivalTicks++;
        this.score += passedTraffic;
    }

    fitnessValue() {
        return this.survivalTicks + this.score * CONFIG.PASS_BONUS;
    }

    copy({ mutate = true, random = this.random } = {}) {
        return new Player(this.brain, { mutate, random });
    }
}
