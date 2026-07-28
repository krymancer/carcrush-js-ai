import { CONFIG } from './config.js';
import Enemy from './Enemy.js';

export const TRAFFIC_GAP = CONFIG.TRAFFIC_GAP;

export function createTraffic(context, count = CONFIG.TRAFFIC_COUNT, random = Math.random) {
    return Array.from(
        { length: count },
        (_, index) => new Enemy(
            context,
            CONFIG.TRAFFIC_START_Y - index * CONFIG.TRAFFIC_GAP,
            random
        )
    );
}

export function resetTraffic(enemies) {
    enemies.forEach((enemy, index) => {
        enemy.reset(CONFIG.TRAFFIC_START_Y - index * CONFIG.TRAFFIC_GAP);
    });
}

export function recyclePassedTraffic(enemies) {
    const passed = enemies.filter((enemy) => enemy.die());
    if (!passed.length) return;

    const survivors = enemies.filter((enemy) => !enemy.die());
    const firstSpawnY = Math.min(
        CONFIG.TRAFFIC_START_Y,
        ...survivors.map((enemy) => enemy.y - CONFIG.TRAFFIC_GAP)
    );

    passed.forEach((enemy, index) => {
        enemy.reset(firstSpawnY - index * CONFIG.TRAFFIC_GAP);
    });
}
