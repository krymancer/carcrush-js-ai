import { loadAssets } from './image.js';
import { CONFIG } from './config.js';
import { selectFeaturedCar } from './featuredCar.js';
import { createPopulation, nextGeneration } from './ga.js';
import { drawGame } from './render.js';
import { createTraffic, recyclePassedTraffic, resetTraffic } from './traffic.js';
import { drawDashboard } from './viz/charts.js';
import { drawNetwork } from './viz/network.js';

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const statsContext = document.getElementById('stats').getContext('2d');
const tableContext = document.getElementById('gentable').getContext('2d');
const chartContext = document.getElementById('charts').getContext('2d');
const networkContext = document.getElementById('network').getContext('2d');

let generation = 1;
let bestScore = 0;
let history = [];
let distribution = [];
let champion = null;
let networkTarget = 'leading';
let showVisualizations = true;

const enemies = createTraffic(context);
let allCars = createPopulation();
let activeCars = [...allCars];
let featuredCar = selectFeaturedCar(activeCars);

loadAssets();
document.addEventListener('keydown', onKeyDown);
requestAnimationFrame(update);

function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key === 'n') {
        networkTarget = networkTarget === 'leading' ? 'champion' : 'leading';
    } else if (key === 'v') {
        showVisualizations = !showVisualizations;
    }
}

function update() {
    enemies.forEach((enemy) => enemy.update());

    const passedEnemies = enemies.filter((enemy) => enemy.die()).length;
    for (let index = activeCars.length - 1; index >= 0; index--) {
        const car = activeCars[index];
        if (enemies.some((enemy) => car.collide(enemy))) {
            activeCars.splice(index, 1);
            continue;
        }

        car.recordProgress(passedEnemies);
        bestScore = Math.max(bestScore, car.score);
        car.think(enemies);
    }

    recyclePassedTraffic(enemies);

    if (activeCars.length === 0) evolve();
    featuredCar = selectFeaturedCar(activeCars, featuredCar);
    drawGame(context, enemies, featuredCar);

    drawStats(statsContext);
    drawGenerationTable(tableContext);
    if (showVisualizations) drawVisualizations();

    requestAnimationFrame(update);
}

function evolve() {
    const scores = allCars.map((car) => car.score);
    const best = Math.max(0, ...scores);
    const average = scores.length
        ? scores.reduce((total, score) => total + score, 0) / scores.length
        : 0;
    history.push({ gen: generation, best, avg: average });
    distribution = scores;
    bestScore = Math.max(bestScore, best);

    const bestCar = allCars.reduce((current, car) => car.score > current.score ? car : current);
    if (!champion || bestCar.score > champion.score) {
        champion = { brain: bestCar.brain.copy(), score: bestCar.score };
    }

    resetTraffic(enemies);
    generation++;
    allCars = nextGeneration(allCars);
    activeCars = [...allCars];
}

function leadingCar() {
    if (featuredCar?.lastInputs) return featuredCar;
    return activeCars.find((car) => car.lastInputs) ?? null;
}

function drawVisualizations() {
    clearCanvas(chartContext);
    drawDashboard(chartContext, {
        history,
        distribution,
        alive: activeCars.length,
        population: allCars.length,
        generation
    });

    clearCanvas(networkContext);
    const leading = leadingCar();
    if (!leading?.lastInputs) return;

    if (networkTarget === 'champion' && champion) {
        const activations = champion.brain.activations(leading.lastInputs);
        const actions = ['LEFT', 'STAY', 'RIGHT'];
        const actionIndex = activations.output.reduce(
            (best, value, index, values) => value > values[best] ? index : best,
            0
        );
        const decision = actions[actionIndex];
        drawNetwork(
            networkContext,
            champion.brain,
            activations,
            leading.lastInputs,
            decision,
            `champion · score ${champion.score}`
        );
        return;
    }

    drawNetwork(
        networkContext,
        leading.brain,
        { hidden: leading.lastHidden, output: leading.lastOutput },
        leading.lastInputs,
        leading.lastDecision,
        'leading car'
    );
}

function drawStats(ctx) {
    clearCanvas(ctx);
    const width = ctx.canvas.width;
    const x = 18;
    const last = history[history.length - 1];
    const currentScore = activeCars.reduce((maximum, car) => Math.max(maximum, car.score), 0);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f5f7fb';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('CarCrush AI', x, 34);
    ctx.fillStyle = 'rgba(191, 203, 224, 0.72)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('neuroevolution traffic lab', x, 50);

    const rows = [
        ['GENERATION', String(generation), true],
        ['SCORE (this run)', String(currentScore), false],
        ['ALIVE', `${activeCars.length} / ${allCars.length}`, false],
        ['BEST EVER', String(bestScore), false],
        ['LAST GEN', last ? `best ${last.best} · avg ${formatAverage(last.avg)}` : '—', false]
    ];

    let y = 84;
    rows.forEach(([label, value, prominent]) => {
        ctx.fillStyle = 'rgba(191, 203, 224, 0.72)';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(label, x, y);
        ctx.fillStyle = prominent ? '#f5b83d' : '#f5f7fb';
        ctx.font = prominent ? 'bold 34px system-ui, sans-serif' : 'bold 22px system-ui, sans-serif';
        ctx.fillText(value, x, y + (prominent ? 34 : 26));
        y += prominent ? 62 : 50;
    });

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(width - x, y - 6);
    ctx.stroke();

    const configuration = [
        ['population', String(CONFIG.POPULATION)],
        ['network', `${CONFIG.NN_INPUTS} → ${CONFIG.NN_HIDDEN} → ${CONFIG.NN_OUTPUTS}`],
        ['elite carried', String(CONFIG.ELITE_COUNT)],
        ['mutation', `${Math.round(CONFIG.MUTATION_RATE * 100)}% · σ ${CONFIG.MUTATION_STRENGTH}`]
    ];
    y += 14;
    ctx.font = '12px system-ui, sans-serif';
    configuration.forEach(([label, value]) => {
        ctx.fillStyle = 'rgba(191, 203, 224, 0.72)';
        ctx.textAlign = 'left';
        ctx.fillText(label, x, y);
        ctx.fillStyle = 'rgba(238, 242, 249, 0.92)';
        ctx.textAlign = 'right';
        ctx.fillText(value, width - x, y);
        y += 20;
    });
    ctx.textAlign = 'left';
}

function drawGenerationTable(ctx) {
    clearCanvas(ctx);
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const x = 18;
    const bestColumn = width - 105;
    const averageColumn = width - 18;

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f5f7fb';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GENERATIONS', x, 26);

    ctx.fillStyle = 'rgba(191, 203, 224, 0.72)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('GEN', x, 48);
    ctx.textAlign = 'right';
    ctx.fillText('BEST', bestColumn, 48);
    ctx.fillText('AVG', averageColumn, 48);

    const rowHeight = 21;
    const maximumRows = Math.floor((height - 60) / rowHeight);
    const rows = history.slice(-maximumRows).reverse();
    let y = 68;
    ctx.font = '13px system-ui, sans-serif';
    rows.forEach((row) => {
        ctx.fillStyle = row.best === bestScore ? '#f5b83d' : 'rgba(238, 242, 249, 0.92)';
        ctx.textAlign = 'left';
        ctx.fillText(String(row.gen), x, y);
        ctx.textAlign = 'right';
        ctx.fillText(String(row.best), bestColumn, y);
        ctx.fillStyle = 'rgba(191, 203, 224, 0.82)';
        ctx.fillText(formatAverage(row.avg), averageColumn, y);
        y += rowHeight;
    });

    if (!rows.length) {
        ctx.fillStyle = 'rgba(200, 210, 230, 0.5)';
        ctx.textAlign = 'left';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('waiting for generation 1…', x, y);
    }
}

function formatAverage(value) {
    return value < 10 ? value.toFixed(1) : String(Math.round(value));
}

function clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
