import Enemy from './Enemy.js';

export const TRAFFIC_START_Y = -140;
export const TRAFFIC_GAP = 230;

export function createTraffic(context, count = 3) {
    return Array.from(
        { length: count },
        (_, index) => new Enemy(context, TRAFFIC_START_Y - index * TRAFFIC_GAP)
    );
}

export function resetTraffic(enemies) {
    enemies.forEach((enemy, index) => {
        enemy.reset(TRAFFIC_START_Y - index * TRAFFIC_GAP);
    });
}

export function recyclePassedTraffic(enemies) {
    const passed = enemies.filter((enemy) => enemy.die());
    if (!passed.length) return;

    const survivors = enemies.filter((enemy) => !enemy.die());
    const firstSpawnY = Math.min(
        TRAFFIC_START_Y,
        ...survivors.map((enemy) => enemy.y - TRAFFIC_GAP)
    );

    passed.forEach((enemy, index) => {
        enemy.reset(firstSpawnY - index * TRAFFIC_GAP);
    });
}
