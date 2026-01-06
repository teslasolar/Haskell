#!/usr/bin/env node
/*! K:airead:1:32:k0:g7h8 !*/
/**
 * AI README - Executable Entry
 * Run: node ai/README.md [cmd]
 */

const AI = require('./index.js');

const CMDS = {
  help: () => console.log(`
AI Algorithms B[6][y][z]
  astar    A* pathfinding
  minimax  Game tree search
  genetic  Genetic algorithm
  nn       Neural network
  qlearn   Q-learning
  demo     Run all demos
`),

  astar: () => {
    const grid = [[0,0,0,0],[0,1,1,0],[0,0,0,0]];
    const neighbors = (n) => {
      const [r,c] = [Math.floor(n/4), n%4];
      return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
        .filter(([r,c]) => r>=0 && r<3 && c>=0 && c<4 && grid[r][c]===0)
        .map(([r,c]) => r*4+c);
    };
    const h = (a,b) => Math.abs(Math.floor(a/4)-Math.floor(b/4)) + Math.abs(a%4-b%4);
    console.log('A* Pathfinding');
    console.log('Path:', AI.astar.search(0, 11, neighbors, h));
  },

  genetic: () => {
    const pop = Array.from({length:20}, () => Math.random()*20-10);
    const best = AI.genetic.evolve(pop,
      x => -Math.abs(x - Math.PI),
      (a,b) => (a+b)/2,
      x => x + (Math.random()-0.5)*0.1,
      100
    );
    console.log('Genetic Algorithm');
    console.log('Finding PI:', best.toFixed(6));
  },

  nn: () => {
    const net = AI.nn.create([2,4,1]);
    console.log('Neural Network [2,4,1]');
    console.log('Forward([0,1]):', AI.nn.forward(net, [0,1]));
  },

  qlearn: () => {
    let Q = AI.qlearn.create();
    for (let i = 0; i < 100; i++) {
      Q = AI.qlearn.update(Q, 0, 'right', 1, 1, ['left','right']);
    }
    console.log('Q-Learning');
    console.log('Q(0,right):', AI.qlearn.get(Q, 0, 'right').toFixed(2));
  },

  demo: () => AI.demo()
};

const [,, cmd = 'help'] = process.argv;
(CMDS[cmd] || CMDS.help)();
