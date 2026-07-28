import { CONFIG } from './config.js';
import Player from './Player.js';

export function createPopulation(size = CONFIG.POPULATION, random = Math.random) {
    return Array.from({ length: size }, () => new Player(null, { random }));
}

export function normalizeFitness(cars) {
    const weights = cars.map((car) => Math.pow(car.fitnessValue(), CONFIG.FITNESS_POWER));
    const total = weights.reduce((sum, weight) => sum + weight, 0);

    if (total === 0) {
        const equalShare = cars.length ? 1 / cars.length : 0;
        cars.forEach((car) => { car.fitness = equalShare; });
        return;
    }

    cars.forEach((car, index) => {
        car.fitness = weights[index] / total;
    });
}

export function selectParent(cars, random = Math.random) {
    let threshold = random();
    for (const car of cars) {
        threshold -= car.fitness;
        if (threshold <= 0) return car;
    }
    return cars[cars.length - 1];
}

export function nextGeneration(oldCars, random = Math.random) {
    normalizeFitness(oldCars);

    const eliteCount = Math.min(CONFIG.ELITE_COUNT, oldCars.length);
    const ranked = [...oldCars].sort((a, b) => b.fitnessValue() - a.fitnessValue());
    const next = ranked
        .slice(0, eliteCount)
        .map((car) => car.copy({ mutate: false, random }));

    while (next.length < oldCars.length) {
        next.push(selectParent(oldCars, random).copy({ mutate: true, random }));
    }

    return next;
}
