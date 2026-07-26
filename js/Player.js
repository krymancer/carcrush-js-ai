import NeuralNetwork from './NeuralNetwork.js';
import { map, mutate, random } from './util.js';

const LANE_CHANGE_COOLDOWN = 8;
const DISPLAY_MOVE_SPEED = 18;

export default class Player {
    constructor(brain) {
        this.x = 36;
        this.displayX = this.x;
        this.y = 720;
        this.colors = ['blue', 'gray', 'pinck', 'pruple', 'gray'];
        this.color = this.colors[random(0, 5)]
        this.asset = new Image();
        this.asset.src = `./assets/${this.color}.png`

        this.offset = 100;

        this.height = 138;
        this.width = 70;

        this.score = 0;
        this.lift = -12;
        this.fitness = 0;

        this.left = 0;
        this.right = 0;
        this.lastInputs = null;
        this.lastHidden = null;
        this.lastOutput = null;
        this.lastDecision = null;
        this.framesUntilMove = 0;

        if (brain instanceof NeuralNetwork) {
            this.brain = brain.copy();
            this.brain.mutate(mutate);
        } else {
            this.brain = new NeuralNetwork(5, 10, 2);
        }
    }

    collide(enemy) {
        if (this.x === enemy.x) {
            if (this.y <= (enemy.y + enemy.height) && (this.y + this.height) > enemy.y) {
                return true;
            }
        }
    }

    show(context) {
        const distance = this.x - this.displayX;
        this.displayX += Math.sign(distance) * Math.min(Math.abs(distance), DISPLAY_MOVE_SPEED);
        context.drawImage(this.asset, this.displayX, this.y);
    }

    move(direction) {
        if (this.x !== 36) {
            if (direction === 'LEFT') {
                this.x -= this.offset;
                this.left++;
            }
        }

        if (this.x !== 336) {
            if (direction === 'RIGHT') {
                this.x += this.offset;
                this.right++;
            }
        }
    }

    copy() {
        return new Player(this.brain);
    }

    think(enemies) {
        const positions = [36, 136, 236, 336];
        const laneIndex = (x) => Math.max(0, positions.indexOf(x));
        const closest = enemies
            .filter((enemy) => enemy.y <= this.y + this.height)
            .sort((a, b) => b.y - a.y)
            .slice(0, 3);
        const pressure = new Array(positions.length).fill(0);

        closest.forEach((enemy) => pressure[laneIndex(enemy.x)]++);
        const safeLane = pressure.indexOf(Math.min(...pressure));
        const enemyInputs = [0, 1, 2].map((index) => {
            const enemy = closest[index];
            return enemy ? (laneIndex(enemy.x) + 1) / positions.length : 0;
        });
        const inputs = [
            map(this.x, positions[0], positions[positions.length - 1], 0, 1),
            ...enemyInputs,
            safeLane / (positions.length - 1)
        ];

        const activations = this.brain.activations(inputs);
        this.lastInputs = inputs;
        this.lastHidden = activations.hidden;
        this.lastOutput = activations.output;

        this.lastDecision = activations.output[0] > activations.output[1] ? 'RIGHT' : 'LEFT';
        if (this.framesUntilMove > 0) {
            this.framesUntilMove--;
            return;
        }

        this.move(this.lastDecision);
        this.framesUntilMove = LANE_CHANGE_COOLDOWN;
    }
}
