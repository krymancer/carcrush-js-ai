import { drawBackground } from './image.js';

export function drawGame(context, enemies, featuredCar) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    drawBackground(context);
    enemies.forEach((enemy) => enemy.show());

    if (!featuredCar) return;
    featuredCar.show(context);
    drawFeaturedMarker(context, featuredCar);
}

function drawFeaturedMarker(context, car) {
    const padding = 5;
    const labelWidth = 30;
    const labelHeight = 20;
    const labelX = car.x + car.width - labelWidth;
    const labelY = car.y - labelHeight - padding;

    context.save();
    context.strokeStyle = '#f5b83d';
    context.lineWidth = 3;
    context.shadowColor = '#f5b83d';
    context.shadowBlur = 10;
    context.strokeRect(
        car.x - padding,
        car.y - padding,
        car.width + padding * 2,
        car.height + padding * 2
    );
    context.shadowBlur = 0;
    context.fillStyle = '#f5b83d';
    context.fillRect(labelX, labelY, labelWidth, labelHeight);
    context.fillStyle = '#17120a';
    context.font = 'bold 13px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('AI', labelX + labelWidth / 2, labelY + labelHeight / 2);
    context.restore();
}
