import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.Image = class Image {};

const { default: Player } = await import('../js/Player.js');
const { createPopulation, nextGeneration } = await import('../js/aiUtil.js');

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

test('a zero-score population can still evolve', () => {
    const population = createPopulation(8);
    const next = nextGeneration(population.allCars, [], 1, [{ reset() {} }]);

    assert.equal(next.generation, 2);
    assert.equal(next.allCars.length, 8);
    assert.equal(next.activeCars.length, 8);
    assert.ok(next.allCars.every((car) => Number.isFinite(car.brain.weights_ih.data[0][0])));
});
