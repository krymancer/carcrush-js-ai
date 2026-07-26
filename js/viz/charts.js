import { roundRect } from './network.js';

const AXIS = 'rgba(255, 255, 255, 0.18)';
const BEST = '#f5b83d';
const AVERAGE = '#5adca0';
const POPULATION = '#69c7ff';

export function drawDashboard(ctx, stats) {
    const width = ctx.canvas.width;
    const padding = 16;
    const innerWidth = width - padding * 2;
    const chartY = 44;
    const chartHeight = 200;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f5f7fb';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('SCORE / GENERATION', padding, 26);

    drawLineChart(ctx, stats.history, padding, chartY, innerWidth, chartHeight);

    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = BEST;
    ctx.fillText('■ best', padding, chartY + chartHeight + 22);
    ctx.fillStyle = AVERAGE;
    ctx.fillText('■ average', padding + 70, chartY + chartHeight + 22);
    ctx.fillStyle = 'rgba(230, 235, 245, 0.62)';
    ctx.textAlign = 'right';
    ctx.fillText(`gen ${stats.generation}`, padding + innerWidth, chartY + chartHeight + 22);

    const aliveY = chartY + chartHeight + 56;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f5f7fb';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('POPULATION ALIVE', padding, aliveY);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(230, 235, 245, 0.86)';
    ctx.fillText(`${stats.alive} / ${stats.population}`, padding + innerWidth, aliveY);

    const barY = aliveY + 12;
    const barHeight = 16;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    roundRect(ctx, padding, barY, innerWidth, barHeight, 6);
    ctx.fill();
    const fraction = stats.population ? stats.alive / stats.population : 0;
    if (fraction > 0) {
        ctx.fillStyle = POPULATION;
        roundRect(ctx, padding, barY, innerWidth * fraction, barHeight, 6);
        ctx.fill();
    }

    const histogramLabelY = barY + barHeight + 40;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f5f7fb';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('LAST GENERATION SCORES', padding, histogramLabelY);
    drawHistogram(ctx, stats.distribution, padding, histogramLabelY + 10, innerWidth, 74);
    ctx.restore();
}

function drawLineChart(ctx, history, x, y, width, height) {
    drawBaseline(ctx, x, y, width, height);
    if (!history.length) {
        drawEmptyState(ctx, 'waiting for generation 1…', x, y, height);
        return;
    }

    const visible = history.slice(-50);
    const maximum = Math.max(1, ...visible.map((entry) => entry.best));
    const xAt = (index) => visible.length > 1
        ? x + (width * index) / (visible.length - 1)
        : x + width / 2;
    const yAt = (value) => y + height - (height * Math.max(0, value)) / maximum;

    const line = (key, color, lineWidth) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        visible.forEach((entry, index) => {
            const pointX = xAt(index);
            const pointY = yAt(entry[key]);
            if (index === 0) ctx.moveTo(pointX, pointY);
            else ctx.lineTo(pointX, pointY);
        });
        ctx.stroke();
    };

    line('avg', AVERAGE, 2);
    line('best', BEST, 2.5);
    ctx.fillStyle = 'rgba(230, 235, 245, 0.7)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(String(maximum), x + 4, y + 12);
    ctx.fillText('0', x + 4, y + height - 4);
}

function drawHistogram(ctx, distribution, x, y, width, height) {
    drawBaseline(ctx, x, y, width, height);
    if (!distribution.length) {
        drawEmptyState(ctx, '—', x, y, height);
        return;
    }

    const bins = 16;
    const maximum = Math.max(...distribution);
    const counts = new Array(bins).fill(0);
    distribution.forEach((score) => {
        const index = maximum > 0
            ? Math.min(bins - 1, Math.floor((score / maximum) * bins))
            : 0;
        counts[index]++;
    });

    const maximumCount = Math.max(1, ...counts);
    const barWidth = width / bins;
    counts.forEach((count, index) => {
        const barHeight = (height * count) / maximumCount;
        ctx.fillStyle = POPULATION;
        ctx.fillRect(x + index * barWidth + 1, y + height - barHeight, barWidth - 2, barHeight);
    });
}

function drawBaseline(ctx, x, y, width, height) {
    ctx.strokeStyle = AXIS;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
}

function drawEmptyState(ctx, label, x, y, height) {
    ctx.fillStyle = 'rgba(200, 210, 230, 0.5)';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(label, x + 6, y + height / 2);
}
