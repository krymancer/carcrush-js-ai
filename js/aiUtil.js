import Player from './Player.js'
import { resetTraffic } from './traffic.js';

export function createPopulation(totalPopulation) {
    let allCars = [];
    let activeCars = [];
    for (let i = 0; i < totalPopulation; i++) {
        let car = new Player();
        activeCars[i] = car;
        allCars[i] = car;
    }

    return {allCars, activeCars};
}

export function nextGeneration(allCars,activeCars,generation,enemies) {
    generation++;
    resetTraffic(enemies);
    normalizeFitness(allCars);
    activeCars = generate(allCars);
    allCars = activeCars.slice();
    return {allCars, activeCars, generation};
}

function generate(oldCars) {
    let newCars = [];
    oldCars.forEach((cars,index) => {
        newCars[index] = new Player(poolSelection(oldCars).brain);
    });
    return newCars;
}

function normalizeFitness(cars) {
    let sum = 0;
    cars.forEach(car => {
        sum += car.score;
    });

    if (sum === 0) {
        const equalShare = 1 / cars.length;
        cars.forEach(car => {
            car.fitness = equalShare;
        });
        return;
    }

    cars.forEach(car => {
        car.fitness = car.score / sum;
    });
}

function poolSelection(cars) {
    let index = 0;
    let r = Math.random();
    while (r > 0 && index < cars.length) {
        r -= cars[index].fitness;
        index++;
    }
    index = Math.min(cars.length - 1, Math.max(0, index - 1));
    return cars[index].copy();
}
