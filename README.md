# CarCrush AI

CarCrush AI is a browser-based neuroevolution experiment. A population of cars,
each controlled by a small neural network, learns to change lanes and avoid
oncoming traffic. When every car crashes, fitness-weighted selection creates the
next generation from the most successful networks.

Play it at <https://krymancer.github.io/carcrush-js-ai/>.

## Run locally

The project uses native JavaScript modules and has no build step. Serve the
repository from any static HTTP server, for example:

```sh
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

Run the automated checks and deterministic learning benchmark with:

```sh
npm test
npm run benchmark
```

The benchmark succeeds only when an evolved car passes 100 obstacles within 50
generations. Optional arguments are `seed`, `generations`, `target score`, and
`population size`, in that order.

## Visualization

The dashboard shows the simulation as it learns:

- only the best surviving car is drawn; when it crashes, the view follows the
  next-best survivor while the full population continues training—the featured
  car has a gold `AI` marker, while the green cars are obstacle traffic;
- enemy traffic is respawned with a fixed safety gap so its sprites never
  overlap;
- AI lane changes are rate-limited and visually interpolated to prevent rapid
  left/right decisions from appearing as two cars;
- live generation, score, population, and best-ever statistics;
- a table of the most recent generations;
- best and average score history;
- the previous generation's score distribution;
- the number of cars still alive; and
- live neural-network inputs, activations, connections, and decisions.

Press `N` to switch the network view between the leading car and the best car
from completed generations. Press `V` to pause or resume the visualization
panels while the simulation continues.

## Neural network

Each car uses five normalized inputs: its current lane plus the distance to the
nearest approaching obstacle in each of the four lanes. Eight hidden nodes feed
three actions (`LEFT`, `STAY`, and `RIGHT`). The population size is 1,000;
fitness combines dense survival time with passed-traffic score, the 50 strongest
brains are preserved unchanged, and selected offspring are mutated exactly once.
