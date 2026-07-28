import { gaussian } from './util.js';

const sigmoid = (value) => 1 / (1 + Math.exp(-value));

function randomArray(length, random) {
    const values = new Float32Array(length);
    for (let index = 0; index < length; index++) {
        values[index] = random() * 2 - 1;
    }
    return values;
}

export default class NeuralNetwork {
    constructor(inputs, hidden, outputs, random = Math.random) {
        this.inputs = inputs;
        this.hidden = hidden;
        this.outputs = outputs;
        this.weightsIH = randomArray(hidden * inputs, random);
        this.weightsHO = randomArray(outputs * hidden, random);
        this.biasH = randomArray(hidden, random);
        this.biasO = randomArray(outputs, random);
    }

    activations(inputValues) {
        if (inputValues.length !== this.inputs) {
            throw new Error(`Expected ${this.inputs} inputs, received ${inputValues.length}`);
        }

        const hiddenValues = new Array(this.hidden);
        for (let row = 0; row < this.hidden; row++) {
            let sum = this.biasH[row];
            for (let column = 0; column < this.inputs; column++) {
                sum += this.weightsIH[row * this.inputs + column] * inputValues[column];
            }
            hiddenValues[row] = sigmoid(sum);
        }

        const outputValues = new Array(this.outputs);
        for (let row = 0; row < this.outputs; row++) {
            let sum = this.biasO[row];
            for (let column = 0; column < this.hidden; column++) {
                sum += this.weightsHO[row * this.hidden + column] * hiddenValues[column];
            }
            outputValues[row] = sigmoid(sum);
        }

        return { hidden: hiddenValues, output: outputValues };
    }

    predict(inputValues) {
        return this.activations(inputValues).output;
    }

    copy() {
        const clone = Object.create(NeuralNetwork.prototype);
        clone.inputs = this.inputs;
        clone.hidden = this.hidden;
        clone.outputs = this.outputs;
        clone.weightsIH = this.weightsIH.slice();
        clone.weightsHO = this.weightsHO.slice();
        clone.biasH = this.biasH.slice();
        clone.biasO = this.biasO.slice();
        return clone;
    }

    mutate(rate, strength, random = Math.random) {
        const mutateValues = (values) => {
            for (let index = 0; index < values.length; index++) {
                if (random() < rate) values[index] += gaussian(random) * strength;
            }
        };

        mutateValues(this.weightsIH);
        mutateValues(this.weightsHO);
        mutateValues(this.biasH);
        mutateValues(this.biasO);
    }
}
