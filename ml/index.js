/*! K:ml0002:1:21:k0:c4d5 !*/
/**
 * KONOMI:HASKELL ML Algorithms
 * Pure functional implementations
 */
const ML = {
  // Linear Regression
  linear: {
    fit(data) {
      const n = data.length;
      const sx = data.reduce((a, [x]) => a + x, 0);
      const sy = data.reduce((a, [, y]) => a + y, 0);
      const sxy = data.reduce((a, [x, y]) => a + x * y, 0);
      const sxx = data.reduce((a, [x]) => a + x * x, 0);
      const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      const b = (sy - m * sx) / n;
      return { m, b, predict: (x) => m * x + b };
    }
  },

  // K-Nearest Neighbors
  knn: {
    dist: (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0)),
    fit(data, k = 3) {
      return {
        predict: (x) => {
          const dists = data.map(([p, l]) => [this.dist(x, p), l]);
          dists.sort((a, b) => a[0] - b[0]);
          const votes = dists.slice(0, k).map(d => d[1]);
          return votes.sort((a, b) =>
            votes.filter(v => v === b).length - votes.filter(v => v === a).length
          )[0];
        }
      };
    }
  },

  // K-Means Clustering
  kmeans: {
    fit(data, k = 3, iters = 10) {
      let centers = data.slice(0, k).map(d => [...d]);
      for (let i = 0; i < iters; i++) {
        const clusters = Array.from({ length: k }, () => []);
        data.forEach(p => {
          const dists = centers.map(c => ML.knn.dist(p, c));
          clusters[dists.indexOf(Math.min(...dists))].push(p);
        });
        centers = clusters.map(cl =>
          cl[0]?.map((_, i) => cl.reduce((s, p) => s + p[i], 0) / cl.length) || centers[0]
        );
      }
      return { centers, predict: (x) => {
        const dists = centers.map(c => ML.knn.dist(x, c));
        return dists.indexOf(Math.min(...dists));
      }};
    }
  },

  // Naive Bayes
  naive: {
    fit(data) {
      const labels = [...new Set(data.map(d => d[1]))];
      const priors = {};
      const stats = {};
      labels.forEach(l => {
        const subset = data.filter(d => d[1] === l).map(d => d[0]);
        priors[l] = subset.length / data.length;
        stats[l] = subset[0].map((_, i) => {
          const vals = subset.map(s => s[i]);
          const mean = vals.reduce((a, b) => a + b) / vals.length;
          const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
          return { mean, std };
        });
      });
      return {
        predict: (x) => labels.reduce((best, l) => {
          const prob = Math.log(priors[l]) + x.reduce((s, v, i) => {
            const { mean, std } = stats[l][i];
            return s - 0.5 * ((v - mean) / std) ** 2 - Math.log(std);
          }, 0);
          return prob > best.prob ? { label: l, prob } : best;
        }, { label: null, prob: -Infinity }).label
      };
    }
  },

  // Demo
  demo() {
    console.log('ML Linear:', ML.linear.fit([[1,2],[2,4],[3,6]]).predict(4));
    console.log('ML KNN:', ML.knn.fit([[[0,0],'A'],[[1,1],'B']], 1).predict([0.5,0.5]));
    console.log('ML KMeans:', ML.kmeans.fit([[0,0],[1,1],[10,10],[11,11]], 2).centers);
  }
};

if (typeof module !== 'undefined') module.exports = ML;
if (typeof window !== 'undefined') window.ML = ML;
