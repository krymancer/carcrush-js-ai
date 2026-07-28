import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.Image = class Image {};

const { CONFIG } = await import('../js/config.js');
const { default: Player } = await import('../js/Player.js');
const { createPopulation, nextGeneration, normalizeFitness } = await import('../js/ga.js');
const { selectFeaturedCar } = await import('../js/featuredCar.js');
const { drawGame } = await import('../js/render.js');
const { recyclePassedTraffic, resetTraffic, TRAFFIC_GAP } = await import('../js/traffic.js');

function threats() {
    return [
        { lane: 0, x: 36, y: 500, height: CONFIG.CAR_HEIGHT },
        { lane: 2, x: 236, y: 100, height: CONFIG.CAR_HEIGHT },
        { lane: 3, x: 336, y: -200, height: CONFIG.CAR_HEIGHT }
    ];
}

test('sensors report the current lane and nearest clearance in every lane', () => {
    const car = new Player();
    const inputs = car.sense(threats());

    assert.equal(inputs.length, CONFIG.NN_INPUTS);
    assert.equal(inputs[0], 1 / 3);
    assert.ok(inputs[1] < inputs[3]);
    assert.equal(inputs[2], 1);
    assert.ok(inputs.every((value) => value >= 0 && value <= 1));
});

test('the network exposes eight hidden activations and three actions', () => {
    const car = new Player();
    car.think(threats());

    assert.equal(car.lastHidden.length, CONFIG.NN_HIDDEN);
    assert.equal(car.lastOutput.length, CONFIG.NN_OUTPUTS);
    assert.ok(['LEFT', 'STAY', 'RIGHT'].includes(car.lastDecision));
});

test('STAY preserves a safe lane and movement is rate-limited', () => {
    const car = new Player();
    car.brain.activations = () => ({
        hidden: new Array(CONFIG.NN_HIDDEN).fill(0.5),
        output: [0, 1, 0]
    });
    car.think(threats());
    assert.equal(car.lane, 1);

    car.brain.activations = () => ({
        hidden: new Array(CONFIG.NN_HIDDEN).fill(0.5),
        output: [0, 0, 1]
    });
    car.think(threats());
    assert.equal(car.lane, 2);
    car.think(threats());
    assert.equal(car.lane, 2);
});

test('the visible car interpolates toward its logical lane', () => {
    const car = new Player();
    car.move('RIGHT');
    let renderedX;
    car.show({ drawImage(_asset, x) { renderedX = x; } });
    assert.ok(renderedX > CONFIG.LANES[1] && renderedX < CONFIG.LANES[2]);
});

test('dense progress fitness distinguishes cars before either passes traffic', () => {
    const early = new Player();
    const survivor = new Player();
    survivor.recordProgress();
    survivor.recordProgress();

    normalizeFitness([early, survivor]);

    assert.equal(early.fitness, 0);
    assert.equal(survivor.fitness, 1);
});

test('elitism preserves the strongest brain without mutation', () => {
    const population = createPopulation(CONFIG.ELITE_COUNT + 5);
    population.forEach((car, index) => {
        car.survivalTicks = index;
        car.score = index;
    });
    const strongest = population.at(-1);
    const expectedWeights = Array.from(strongest.brain.weightsIH);

    const next = nextGeneration(population);

    assert.equal(next.length, population.length);
    assert.deepEqual(Array.from(next[0].brain.weightsIH), expectedWeights);
    assert.notEqual(next[0].brain, strongest.brain);
});

test('a zero-progress population can still evolve', () => {
    const population = createPopulation(8);
    const next = nextGeneration(population);

    assert.equal(next.length, 8);
    assert.ok(next.every((car) => Number.isFinite(car.brain.weightsIH[0])));
});

test('the featured car stays stable on a tie and falls back to the best survivor', () => {
    const first = { score: 4 };
    const current = { score: 8 };
    const best = { score: 12 };

    assert.equal(selectFeaturedCar([first, current], current), current);
    assert.equal(selectFeaturedCar([first, best], current), best);
    assert.equal(selectFeaturedCar([], current), null);
});

test('a frame clears old pixels and draws exactly one featured AI car', () => {
    let clears = 0;
    let trafficDraws = 0;
    let featuredDraws = 0;
    const context = {
        canvas: { width: CONFIG.CANVAS_WIDTH, height: CONFIG.CANVAS_HEIGHT },
        clearRect() { clears++; },
        drawImage() {},
        save() {},
        restore() {},
        strokeRect() {},
        fillRect() {},
        fillText() {}
    };
    const enemies = Array.from({ length: CONFIG.TRAFFIC_COUNT }, () => ({
        show() { trafficDraws++; }
    }));
    const featured = {
        x: CONFIG.LANES[0],
        y: CONFIG.PLAYER_Y,
        width: CONFIG.CAR_WIDTH,
        height: CONFIG.CAR_HEIGHT,
        show() { featuredDraws++; }
    };

    drawGame(context, enemies, featured);

    assert.equal(clears, 1);
    assert.equal(trafficDraws, CONFIG.TRAFFIC_COUNT);
    assert.equal(featuredDraws, 1);
});

test('traffic keeps a safe vertical gap after generation resets', () => {
    const enemies = Array.from({ length: CONFIG.TRAFFIC_COUNT }, () => ({
        reset(y) { this.y = y; }
    }));

    resetTraffic(enemies);

    assert.equal(enemies[0].y - enemies[1].y, TRAFFIC_GAP);
    assert.equal(enemies[1].y - enemies[2].y, TRAFFIC_GAP);
});

test('traffic spacing leaves time to escape before the next collision window', () => {
    assert.ok(TRAFFIC_GAP > CONFIG.CAR_HEIGHT * 2);
});

test('passed traffic respawns above and behind every surviving obstacle', () => {
    const passed = {
        y: CONFIG.CANVAS_HEIGHT + 201,
        die() { return this.y > CONFIG.CANVAS_HEIGHT + 200; },
        reset(y) { this.y = y; }
    };
    const survivors = [420, 760].map((y) => ({
        y,
        die() { return false; },
        reset() {}
    }));

    recyclePassedTraffic([passed, ...survivors]);

    assert.ok(passed.y <= CONFIG.TRAFFIC_START_Y);
    assert.ok(Math.min(...survivors.map((enemy) => enemy.y)) - passed.y >= TRAFFIC_GAP);
});
