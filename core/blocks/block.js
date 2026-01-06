/*! K:block01:3:85:k0:b2c3 !*/
/**
 * KONOMI 3D Block Array System
 * Directories as coordinate-addressable blocks
 * Self-referential addressing: B[x][y][z]
 */
const KONOMI = {
  // Block registry - 3D coordinate space
  B: {},

  // Directory to coordinate mapping
  MAP: {
    'root':        [0,0,0],
    'spec':        [0,0,1],
    'app':         [0,0,2],
    'meta':        [1,0,0],
    'legend':      [1,0,1],
    'primitives':  [1,1,0],
    'types':       [1,1,1],
    'expressions': [1,2,0],
    'lists':       [1,2,1],
    'hof':         [1,3,0],
    'typeclasses': [1,3,1],
    'monads':      [1,4,0],
    'io':          [1,4,1],
    'modules':     [1,5,0],
    'advanced':    [1,5,1],
    'quickstart':  [2,0,0],
    'invariants':  [2,0,1],
    'crosswalk':   [2,1,0],
    'core':        [3,0,0],
    'core/blocks': [3,0,1],
    'core/templates': [3,1,0],
    'core/compiler':  [3,1,1],
    'core/chain':  [3,2,0],
    'api':         [4,0,0],
    'cli':         [4,0,1],
    'mcp':         [4,1,0],
    'runtime':     [4,1,1],
    'ml':          [5,0,0],
    'ml/linear':   [5,0,1],
    'ml/knn':      [5,0,2],
    'ml/cluster':  [5,1,0],
    'ml/naive':    [5,1,1],
    'ai':          [6,0,0],
    'ai/search':   [6,0,1],
    'ai/minimax':  [6,0,2],
    'ai/genetic':  [6,1,0],
    'ai/nn':       [6,1,1],
    'ai/rl':       [6,1,2]
  },

  // Initialize block at coordinate
  init(x, y, z, data) {
    this.B[x] = this.B[x] || {};
    this.B[x][y] = this.B[x][y] || {};
    this.B[x][y][z] = data;
    return this.B[x][y][z];
  },

  // Get block by coordinate
  get(x, y, z) {
    return this.B[x]?.[y]?.[z] || null;
  },

  // Get by path
  path(p) {
    const c = this.MAP[p];
    return c ? this.get(...c) : null;
  },

  // Self-reference: block can address siblings
  ref(from, dx, dy, dz) {
    const [x,y,z] = this.MAP[from] || [0,0,0];
    return this.get(x+dx, y+dy, z+dz);
  },

  // Coordinate to path
  toPath(x, y, z) {
    for (const [p, c] of Object.entries(this.MAP)) {
      if (c[0]===x && c[1]===y && c[2]===z) return p;
    }
    return null;
  },

  // Export coordinate map
  exportMap() {
    return JSON.stringify(this.MAP, null, 2);
  }
};

// Initialize blocks from map
Object.entries(KONOMI.MAP).forEach(([path, [x,y,z]]) => {
  KONOMI.init(x, y, z, {
    path,
    coord: [x,y,z],
    url: path === 'root' ? '/' : `/${path}/`,
    type: path.includes('/') ? 'subblock' : 'block'
  });
});

// Render to page (browser only)
if (typeof document !== 'undefined' && document.getElementById('block-info')) {
  document.getElementById('block-info').textContent = `KONOMI.B[x][y][z] = Block
Total Blocks: ${Object.keys(KONOMI.MAP).length}
Dimensions: 7 x 6 x 3

Usage:
  KONOMI.get(1,0,0)     → meta block
  KONOMI.path('types')  → types block
  KONOMI.ref('meta',0,1,0) → primitives
  KONOMI.toPath(5,0,0)  → 'ml'`;
}

if (typeof document !== 'undefined' && document.getElementById('coord-map')) {
  document.getElementById('coord-map').textContent =
    Object.entries(KONOMI.MAP)
      .map(([p,[x,y,z]]) => `B[${x}][${y}][${z}] = ${p}`)
      .join('\n');
}

// Export for Node and browser
if (typeof module !== 'undefined') module.exports = KONOMI;
if (typeof window !== 'undefined') window.KONOMI = KONOMI;
