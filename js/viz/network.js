const INPUT_LABELS = ['car lane', 'traffic 1', 'traffic 2', 'traffic 3', 'safe lane'];
const OUTPUT_LABELS = ['RIGHT', 'LEFT'];

function activationFill(value) {
    const t = Math.max(0, Math.min(1, value ?? 0));
    const red = Math.round(42 + t * 213);
    const green = Math.round(58 + t * 157);
    const blue = Math.round(132 - t * 78);
    return `rgb(${red}, ${green}, ${blue})`;
}

function column(count, x, top, bottom) {
    const step = count > 1 ? (bottom - top) / (count - 1) : 0;
    return Array.from({ length: count }, (_, index) => ({
        x,
        y: count > 1 ? top + step * index : (top + bottom) / 2
    }));
}

export function drawNetwork(ctx, network, activations, inputs, decision, subtitle) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const radius = 11;
    const top = 58;
    const bottom = height - 34;
    const columns = [102, width / 2, width - 102];
    const inputPositions = column(network.input_nodes, columns[0], top, bottom);
    const hiddenPositions = column(network.hidden_nodes, columns[1], top, bottom);
    const outputPositions = column(network.output_nodes, columns[2], top, bottom);

    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f5f7fb';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NEURAL NETWORK', 16, 26);
    ctx.fillStyle = 'rgba(191, 203, 224, 0.72)';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(subtitle, width - 16, 26);

    drawEdges(ctx, inputPositions, hiddenPositions, network.weights_ih);
    drawEdges(ctx, hiddenPositions, outputPositions, network.weights_ho);
    drawNodes(ctx, inputPositions, inputs, radius, INPUT_LABELS, 'left');
    drawNodes(ctx, hiddenPositions, activations.hidden, radius);
    drawNodes(ctx, outputPositions, activations.output, radius, OUTPUT_LABELS, 'right');

    const selectedIndex = decision === 'RIGHT' ? 0 : 1;
    const selected = outputPositions[selectedIndex];
    ctx.strokeStyle = '#f5b83d';
    ctx.shadowColor = '#f5b83d';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(selected.x, selected.y, radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#f5b83d';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`decision: ${decision.toLowerCase()}`, width - 14, height - 8);
    ctx.restore();
}

function drawEdges(ctx, from, to, weights) {
    for (let row = 0; row < to.length; row++) {
        for (let columnIndex = 0; columnIndex < from.length; columnIndex++) {
            const weight = weights.data[row][columnIndex];
            const magnitude = Math.min(1, Math.abs(weight));
            ctx.strokeStyle = weight >= 0
                ? `rgba(90, 220, 160, ${magnitude * 0.6})`
                : `rgba(245, 110, 95, ${magnitude * 0.6})`;
            ctx.lineWidth = 0.5 + magnitude * 2.2;
            ctx.beginPath();
            ctx.moveTo(from[columnIndex].x, from[columnIndex].y);
            ctx.lineTo(to[row].x, to[row].y);
            ctx.stroke();
        }
    }
}

function drawNodes(ctx, positions, values, radius, labels, labelSide) {
    ctx.font = '12px system-ui, sans-serif';
    positions.forEach((position, index) => {
        ctx.fillStyle = activationFill(values?.[index]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!labels) return;
        ctx.fillStyle = 'rgba(235, 239, 247, 0.9)';
        ctx.textBaseline = 'middle';
        ctx.textAlign = labelSide === 'left' ? 'right' : 'left';
        const offset = labelSide === 'left' ? -radius - 8 : radius + 8;
        ctx.fillText(labels[index], position.x + offset, position.y);
        ctx.textBaseline = 'alphabetic';
    });
}

export function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
}
