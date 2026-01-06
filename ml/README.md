#!/usr/bin/env node
/*! K:mlread:1:22:k0:d5e6 !*/
/**
 * ML README - Executable Entry
 * Run: node ml/README.md [cmd]
 */

const ML = require('./index.js');

const CMDS = {
  help: () => console.log(`
ML Algorithms B[5][y][z]
  linear   Linear regression
  knn      K-nearest neighbors
  kmeans   K-means clustering
  naive    Naive Bayes
  demo     Run all demos
`),

  linear: () => {
    const data = [[1,2],[2,4],[3,6],[4,8]];
    const model = ML.linear.fit(data);
    console.log('Linear Regression');
    console.log('Data:', data);
    console.log('Predict(5):', model.predict(5));
  },

  knn: () => {
    const data = [[[0,0],'A'],[[0,1],'A'],[[1,0],'B'],[[1,1],'B']];
    const model = ML.knn.fit(data, 3);
    console.log('KNN (k=3)');
    console.log('Predict([0.5,0.2]):', model.predict([0.5,0.2]));
  },

  kmeans: () => {
    const data = [[0,0],[1,1],[2,2],[10,10],[11,11],[12,12]];
    const model = ML.kmeans.fit(data, 2, 20);
    console.log('K-Means (k=2)');
    console.log('Centers:', model.centers);
  },

  naive: () => {
    const data = [[[1,1],'A'],[[2,2],'A'],[[10,10],'B'],[[11,11],'B']];
    const model = ML.naive.fit(data);
    console.log('Naive Bayes');
    console.log('Predict([1.5,1.5]):', model.predict([1.5,1.5]));
  },

  demo: () => ML.demo()
};

const [,, cmd = 'help'] = process.argv;
(CMDS[cmd] || CMDS.help)();
