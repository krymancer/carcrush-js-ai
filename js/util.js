export function randomInt(min, max, random = Math.random) {
    return Math.floor(random() * (max - min)) + min;
}

export function gaussian(random = Math.random) {
    let u = 0;
    let v = 0;
    while (u === 0) u = random();
    while (v === 0) v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
