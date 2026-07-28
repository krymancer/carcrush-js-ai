import { performance } from 'node:perf_hooks';

globalThis.Image = class Image {};

function mulberry32(seed) {
    return function random() {
        let value = (seed += 0x6d2b79f5);
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

const seed = Number(process.argv[2] ?? 1);
const maximumGenerations = Number(process.argv[3] ?? 50);
const targetScore = Number(process.argv[4] ?? 100);
const populationSize = Number(process.argv[5] ?? 1000);
const random = mulberry32(seed);

const { createPopulation, nextGeneration } = await import('../js/ga.js');
const { createTraffic, recyclePassedTraffic, resetTraffic } = await import('../js/traffic.js');

const enemies = createTraffic(null, undefined, random);
let population = createPopulation(populationSize, random);
let activeCars = [...population];
let bestEver = 0;
let generationsRun = 0;
const startedAt = performance.now();

for (let generation = 1; generation <= maximumGenerations; generation++) {
    generationsRun = generation;

    while (activeCars.length && bestEver < targetScore) {
        enemies.forEach((enemy) => enemy.update());
        const passedTraffic = enemies.filter((enemy) => enemy.die()).length;

        for (let index = activeCars.length - 1; index >= 0; index--) {
            const car = activeCars[index];
            if (enemies.some((enemy) => car.collide(enemy))) {
                activeCars.splice(index, 1);
                continue;
            }

            car.recordProgress(passedTraffic);
            bestEver = Math.max(bestEver, car.score);
            car.think(enemies);
        }

        recyclePassedTraffic(enemies);
    }

    if (bestEver >= targetScore || generation === maximumGenerations) break;

    resetTraffic(enemies);
    population = nextGeneration(population, random);
    activeCars = [...population];
}

const result = {
    seed,
    populationSize,
    generationsRun,
    targetScore,
    solved: bestEver >= targetScore,
    bestEver,
    elapsedMs: Math.round(performance.now() - startedAt)
};

console.log(JSON.stringify(result, null, 2));
if (!result.solved) process.exitCode = 1;
