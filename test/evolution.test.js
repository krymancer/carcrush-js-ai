import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.Image = class Image {};

const { default: Player } = await import('../js/Player.js');
const { createPopulation, nextGeneration } = await import('../js/aiUtil.js');
const { selectFeaturedCar } = await import('../js/featuredCar.js');
const { drawGame } = await import('../js/render.js');
const { recyclePassedTraffic, resetTraffic, TRAFFIC_GAP } = await import('../js/traffic.js');

test('a car records the neural-network state used for its decision', () => {
    const car = new Player();
    const enemies = [
        { x: 36, y: 300, height: 138 },
        { x: 136, y: 200, height: 138 },
        { x: 236, y: 100, height: 138 }
    ];

    car.think(enemies);

    assert.equal(car.lastInputs.length, 5);
    assert.equal(car.lastHidden.length, 10);
    assert.equal(car.lastOutput.length, 2);
    assert.ok(['LEFT', 'RIGHT'].includes(car.lastDecision));
    assert.ok([36, 136].includes(car.x));
});

test('lane changes are rate-limited and the visible car moves smoothly', () => {
    const car = new Player();
    car.brain.activations = () => ({
        hidden: new Array(10).fill(0.5),
        output: [1, 0]
    });
    const enemies = [
        { x: 36, y: 300, height: 138 },
        { x: 136, y: 200, height: 138 },
        { x: 236, y: 100, height: 138 }
    ];

    car.think(enemies);
    assert.equal(car.x, 136);
    car.think(enemies);
    assert.equal(car.x, 136);

    let renderedX;
    car.show({ drawImage(_asset, x) { renderedX = x; } });
    assert.ok(renderedX > 36 && renderedX < 136);
});

test('a zero-score population can still evolve', () => {
    const population = createPopulation(8);
    const next = nextGeneration(population.allCars, [], 1, [{ reset() {} }]);

    assert.equal(next.generation, 2);
    assert.equal(next.allCars.length, 8);
    assert.equal(next.activeCars.length, 8);
    assert.ok(next.allCars.every((car) => Number.isFinite(car.brain.weights_ih.data[0][0])));
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
        canvas: { width: 509, height: 900 },
        clearRect() { clears++; },
        drawImage() {},
        save() {},
        restore() {},
        strokeRect() {},
        fillRect() {},
        fillText() {}
    };
    const enemies = Array.from({ length: 3 }, () => ({
        show() { trafficDraws++; }
    }));
    const featured = {
        x: 36,
        y: 720,
        width: 70,
        height: 138,
        show() { featuredDraws++; }
    };

    drawGame(context, enemies, featured);

    assert.equal(clears, 1);
    assert.equal(trafficDraws, 3);
    assert.equal(featuredDraws, 1);
});

test('traffic keeps a safe vertical gap after generation resets', () => {
    const enemies = Array.from({ length: 3 }, () => ({
        reset(y) { this.y = y; }
    }));

    resetTraffic(enemies);

    assert.equal(enemies[0].y - enemies[1].y, TRAFFIC_GAP);
    assert.equal(enemies[1].y - enemies[2].y, TRAFFIC_GAP);
});

test('passed traffic respawns above and behind every surviving obstacle', () => {
    const passed = {
        y: 1101,
        die() { return this.y > 1100; },
        reset(y) { this.y = y; }
    };
    const survivors = [420, 760].map((y) => ({
        y,
        die() { return false; },
        reset() {}
    }));

    recyclePassedTraffic([passed, ...survivors]);

    assert.ok(passed.y <= -140);
    assert.ok(Math.min(...survivors.map((enemy) => enemy.y)) - passed.y >= TRAFFIC_GAP);
});
