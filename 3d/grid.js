/*! K:3dgrid:1:68:k0:g1r2 !*/
/**
 * KONOMI Grid System - 1000³ Addressable Space
 * Each cell can contain content, code, or navigation
 */
const GRID = {
  // Dimensions
  SIZE: 1000,
  TOTAL: 1000 * 1000 * 1000, // 1 billion cells

  // Sparse storage - only store occupied cells
  cells: new Map(),

  // Cell types
  TYPES: {
    EMPTY: 0,
    CONTENT: 1,
    CODE: 2,
    NAV: 3,
    PORTAL: 4,
    LOCKED: 5,
    ACADEMY: 6
  },

  // Convert 3D coord to 1D index
  toIndex(x, y, z) {
    return x + y * this.SIZE + z * this.SIZE * this.SIZE;
  },

  // Convert 1D index to 3D coord
  toCoord(index) {
    const x = index % this.SIZE;
    const y = Math.floor(index / this.SIZE) % this.SIZE;
    const z = Math.floor(index / (this.SIZE * this.SIZE));
    return [x, y, z];
  },

  // Get cell at coordinate
  get(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.cells.get(key) || { type: this.TYPES.EMPTY };
  },

  // Set cell at coordinate
  set(x, y, z, data) {
    const key = `${x},${y},${z}`;
    this.cells.set(key, {
      coord: [x, y, z],
      index: this.toIndex(x, y, z),
      ...data
    });
    return this.get(x, y, z);
  },

  // Query cells in a region
  query(x1, y1, z1, x2, y2, z2) {
    const results = [];
    for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) {
        for (let z = z1; z <= z2; z++) {
          const cell = this.get(x, y, z);
          if (cell.type !== this.TYPES.EMPTY) {
            results.push(cell);
          }
        }
      }
    }
    return results;
  },

  // Find nearest occupied cell
  nearest(x, y, z, maxDist = 10) {
    let closest = null;
    let minDist = Infinity;

    for (const [key, cell] of this.cells) {
      const [cx, cy, cz] = cell.coord;
      const dist = Math.sqrt((x-cx)**2 + (y-cy)**2 + (z-cz)**2);
      if (dist < minDist && dist <= maxDist) {
        minDist = dist;
        closest = cell;
      }
    }
    return closest;
  },

  // Get neighbors of a cell
  neighbors(x, y, z) {
    const dirs = [
      [1,0,0], [-1,0,0],
      [0,1,0], [0,-1,0],
      [0,0,1], [0,0,-1]
    ];
    return dirs
      .map(([dx, dy, dz]) => this.get(x+dx, y+dy, z+dz))
      .filter(c => c.type !== this.TYPES.EMPTY);
  },

  // Path finding (A*)
  findPath(start, end) {
    const [sx, sy, sz] = start;
    const [ex, ey, ez] = end;

    const h = (x, y, z) => Math.abs(x-ex) + Math.abs(y-ey) + Math.abs(z-ez);
    const key = (x, y, z) => `${x},${y},${z}`;

    const open = new Map([[key(sx, sy, sz), { x: sx, y: sy, z: sz, g: 0, f: h(sx, sy, sz), parent: null }]]);
    const closed = new Set();

    while (open.size > 0) {
      // Get node with lowest f
      let current = null;
      let minF = Infinity;
      for (const node of open.values()) {
        if (node.f < minF) {
          minF = node.f;
          current = node;
        }
      }

      if (current.x === ex && current.y === ey && current.z === ez) {
        // Reconstruct path
        const path = [];
        let n = current;
        while (n) {
          path.unshift([n.x, n.y, n.z]);
          n = n.parent;
        }
        return path;
      }

      open.delete(key(current.x, current.y, current.z));
      closed.add(key(current.x, current.y, current.z));

      // Check neighbors
      const dirs = [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]];
      for (const [dx, dy, dz] of dirs) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const nz = current.z + dz;
        const nKey = key(nx, ny, nz);

        if (closed.has(nKey)) continue;
        if (nx < 0 || ny < 0 || nz < 0 || nx >= this.SIZE || ny >= this.SIZE || nz >= this.SIZE) continue;

        const cell = this.get(nx, ny, nz);
        if (cell.type === this.TYPES.LOCKED) continue;

        const g = current.g + 1;
        const f = g + h(nx, ny, nz);

        if (!open.has(nKey) || g < open.get(nKey).g) {
          open.set(nKey, { x: nx, y: ny, z: nz, g, f, parent: current });
        }
      }
    }

    return null; // No path found
  },

  // Generate procedural content
  generate(seed = 42) {
    const rng = this.seededRandom(seed);

    // Generate clusters
    for (let cluster = 0; cluster < 10; cluster++) {
      const cx = Math.floor(rng() * 100);
      const cy = Math.floor(rng() * 50);
      const cz = Math.floor(rng() * 100);

      for (let i = 0; i < 20; i++) {
        const x = cx + Math.floor(rng() * 10 - 5);
        const y = cy + Math.floor(rng() * 5 - 2);
        const z = cz + Math.floor(rng() * 10 - 5);

        if (x >= 0 && y >= 0 && z >= 0) {
          this.set(x, y, z, {
            type: Math.floor(rng() * 5) + 1,
            generated: true
          });
        }
      }
    }
  },

  // Seeded random number generator
  seededRandom(seed) {
    return function() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  },

  // Export to JSON
  toJSON() {
    return {
      size: this.SIZE,
      cells: Array.from(this.cells.entries())
    };
  },

  // Import from JSON
  fromJSON(data) {
    this.cells = new Map(data.cells);
  },

  // Stats
  stats() {
    const types = {};
    for (const cell of this.cells.values()) {
      types[cell.type] = (types[cell.type] || 0) + 1;
    }
    return {
      total: this.TOTAL,
      occupied: this.cells.size,
      density: (this.cells.size / this.TOTAL * 100).toFixed(10) + '%',
      byType: types
    };
  }
};

// Initialize from KONOMI.MAP if available
if (typeof KONOMI !== 'undefined' && KONOMI.MAP) {
  Object.entries(KONOMI.MAP).forEach(([path, [x, y, z]]) => {
    GRID.set(x, y, z, {
      type: GRID.TYPES.CONTENT,
      path,
      url: `/${path}/`
    });
  });
}

if (typeof module !== 'undefined') module.exports = GRID;
