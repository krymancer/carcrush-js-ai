export function selectFeaturedCar(cars, current = null) {
    if (!cars.length) return null;

    const startingCar = cars.includes(current) ? current : cars[0];
    return cars.reduce(
        (best, car) => car.score > best.score ? car : best,
        startingCar
    );
}
