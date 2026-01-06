/*! K:ai0002:1:31:k0:f6g7 !*/
/**
 * KONOMI:HASKELL AI Algorithms
 * Pure functional implementations
 */
const AI = {
  // A* Search
  astar: {
    search(start, goal, neighbors, h, cost = () => 1) {
      const open = [{ n: start, g: 0, f: h(start, goal), path: [start] }];
      const closed = new Set();

      while (open.length) {
        open.sort((a, b) => a.f - b.f);
        const cur = open.shift();
        if (cur.n === goal) return cur.path;
        if (closed.has(cur.n)) continue;
        closed.add(cur.n);

        for (const next of neighbors(cur.n)) {
          if (closed.has(next)) continue;
          const g = cur.g + cost(cur.n, next);
          open.push({ n: next, g, f: g + h(next, goal), path: [...cur.path, next] });
        }
      }
      return null;
    }
  },

  // Minimax with Alpha-Beta
  minimax: {
    search(state, depth, isMax, evaluate, getMoves, apply) {
      if (depth === 0 || getMoves(state).length === 0) return { score: evaluate(state) };

      const moves = getMoves(state);
      let best = { score: isMax ? -Infinity : Infinity };

      for (const move of moves) {
        const next = apply(state, move);
        const result = this.search(next, depth - 1, !isMax, evaluate, getMoves, apply);
        if (isMax ? result.score > best.score : result.score < best.score) {
          best = { move, score: result.score };
        }
      }
      return best;
    }
  },

  // Genetic Algorithm
  genetic: {
    evolve(pop, fitness, crossover, mutate, gens = 100) {
      let gen = [...pop];
      for (let i = 0; i < gens; i++) {
        const scored = gen.map(g => ({ g, f: fitness(g) })).sort((a, b) => b.f - a.f);
        const elite = scored.slice(0, Math.floor(gen.length / 4)).map(s => s.g);
        const next = [...elite];
        while (next.length < gen.length) {
          const p1 = elite[Math.floor(Math.random() * elite.length)];
          const p2 = elite[Math.floor(Math.random() * elite.length)];
          next.push(mutate(crossover(p1, p2)));
        }
        gen = next;
      }
      return gen.reduce((a, b) => fitness(a) > fitness(b) ? a : b);
    }
  },

  // Simple Neural Network
  nn: {
    create(layers) {
      const weights = [];
      for (let i = 1; i < layers.length; i++) {
        weights.push(Array.from({ length: layers[i] }, () =>
          Array.from({ length: layers[i-1] }, () => Math.random() * 2 - 1)
        ));
      }
      return weights;
    },
    sigmoid: (x) => 1 / (1 + Math.exp(-x)),
    forward(weights, input) {
      return weights.reduce((a, layer) =>
        layer.map(neuron => AI.nn.sigmoid(neuron.reduce((s, w, i) => s + w * a[i], 0)))
      , input);
    }
  },

  // Q-Learning
  qlearn: {
    create() { return {}; },
    key: (s, a) => `${JSON.stringify(s)}:${a}`,
    get(Q, s, a) { return Q[this.key(s, a)] || 0; },
    update(Q, s, a, r, ns, actions, lr = 0.1, gamma = 0.9) {
      const maxQ = Math.max(...actions.map(na => this.get(Q, ns, na)), 0);
      Q[this.key(s, a)] = this.get(Q, s, a) + lr * (r + gamma * maxQ - this.get(Q, s, a));
      return Q;
    }
  },

  // Demo
  demo() {
    console.log('AI A*:', AI.astar.search(0, 5, n => [n+1,n+2].filter(x=>x<=5), (a,b) => Math.abs(a-b)));
    console.log('AI NN:', AI.nn.forward(AI.nn.create([2,3,1]), [0.5, 0.5]));
    console.log('AI Genetic:', AI.genetic.evolve(
      Array.from({length:10}, () => Math.random()*10),
      x => -Math.abs(x - 7),
      (a,b) => (a+b)/2,
      x => x + (Math.random()-0.5),
      50
    ));
  }
};

if (typeof module !== 'undefined') module.exports = AI;
if (typeof window !== 'undefined') window.AI = AI;
