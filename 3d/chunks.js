/*! K:chunk01:1:65:k0:c1h2 !*/
/**
 * KONOMI Chunk System - Lazy Loading for 1000³ Grid
 * Divides space into 10x10x10 chunks loaded on demand
 */
const CHUNKS = {
  SIZE: 10,           // Cells per chunk dimension
  GRID_SIZE: 1000,    // Total grid size
  CHUNKS_PER_DIM: 100, // 1000/10 = 100 chunks per dimension

  loaded: new Map(),   // Loaded chunk data
  loading: new Set(),  // Currently loading
  cache: new Map(),    // LRU cache
  cacheLimit: 1000,    // Max cached chunks

  // Get chunk key from cell coordinate
  chunkKey(x, y, z) {
    const cx = Math.floor(x / this.SIZE);
    const cy = Math.floor(y / this.SIZE);
    const cz = Math.floor(z / this.SIZE);
    return `${cx},${cy},${cz}`;
  },

  // Get local position within chunk
  localPos(x, y, z) {
    return [x % this.SIZE, y % this.SIZE, z % this.SIZE];
  },

  // Load a chunk (async)
  async load(cx, cy, cz) {
    const key = `${cx},${cy},${cz}`;

    if (this.loaded.has(key)) return this.loaded.get(key);
    if (this.loading.has(key)) {
      // Wait for existing load
      return new Promise(resolve => {
        const check = setInterval(() => {
          if (this.loaded.has(key)) {
            clearInterval(check);
            resolve(this.loaded.get(key));
          }
        }, 50);
      });
    }

    this.loading.add(key);

    // Simulate async load (would be fetch in production)
    const chunk = await this.generate(cx, cy, cz);

    this.loaded.set(key, chunk);
    this.loading.delete(key);
    this.updateCache(key);

    return chunk;
  },

  // Generate chunk data (procedural or from server)
  async generate(cx, cy, cz) {
    const chunk = {
      coord: [cx, cy, cz],
      cells: new Map(),
      generated: Date.now()
    };

    // Check if any KONOMI blocks fall in this chunk
    if (typeof KONOMI !== 'undefined' && KONOMI.MAP) {
      Object.entries(KONOMI.MAP).forEach(([path, [x, y, z]]) => {
        if (Math.floor(x / this.SIZE) === cx &&
            Math.floor(y / this.SIZE) === cy &&
            Math.floor(z / this.SIZE) === cz) {
          const local = this.localPos(x, y, z);
          chunk.cells.set(local.join(','), {
            type: 'content',
            path,
            url: `/${path}/`
          });
        }
      });
    }

    return chunk;
  },

  // Get cell from chunk (loads chunk if needed)
  async getCell(x, y, z) {
    const key = this.chunkKey(x, y, z);
    const [cx, cy, cz] = key.split(',').map(Number);

    const chunk = await this.load(cx, cy, cz);
    const local = this.localPos(x, y, z);

    return chunk.cells.get(local.join(',')) || null;
  },

  // Set cell in chunk
  async setCell(x, y, z, data) {
    const key = this.chunkKey(x, y, z);
    const [cx, cy, cz] = key.split(',').map(Number);

    const chunk = await this.load(cx, cy, cz);
    const local = this.localPos(x, y, z);

    chunk.cells.set(local.join(','), data);
    return data;
  },

  // Get all cells in view frustum
  async getVisible(camera, distance = 50) {
    const results = [];
    const center = camera.position;

    const minCX = Math.floor((center.x - distance) / this.SIZE);
    const maxCX = Math.ceil((center.x + distance) / this.SIZE);
    const minCY = Math.floor((center.y - distance) / this.SIZE);
    const maxCY = Math.ceil((center.y + distance) / this.SIZE);
    const minCZ = Math.floor((center.z - distance) / this.SIZE);
    const maxCZ = Math.ceil((center.z + distance) / this.SIZE);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        for (let cz = minCZ; cz <= maxCZ; cz++) {
          if (cx < 0 || cy < 0 || cz < 0) continue;
          if (cx >= this.CHUNKS_PER_DIM || cy >= this.CHUNKS_PER_DIM || cz >= this.CHUNKS_PER_DIM) continue;

          const chunk = await this.load(cx, cy, cz);
          chunk.cells.forEach((cell, localKey) => {
            const [lx, ly, lz] = localKey.split(',').map(Number);
            results.push({
              ...cell,
              x: cx * this.SIZE + lx,
              y: cy * this.SIZE + ly,
              z: cz * this.SIZE + lz
            });
          });
        }
      }
    }

    return results;
  },

  // LRU cache management
  updateCache(key) {
    // Move to front
    this.cache.delete(key);
    this.cache.set(key, Date.now());

    // Evict old entries
    while (this.cache.size > this.cacheLimit) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
      this.loaded.delete(oldest);
    }
  },

  // Unload distant chunks
  unloadDistant(centerX, centerY, centerZ, maxDist = 5) {
    const centerCX = Math.floor(centerX / this.SIZE);
    const centerCY = Math.floor(centerY / this.SIZE);
    const centerCZ = Math.floor(centerZ / this.SIZE);

    for (const [key, chunk] of this.loaded) {
      const [cx, cy, cz] = chunk.coord;
      const dist = Math.sqrt(
        (cx - centerCX) ** 2 +
        (cy - centerCY) ** 2 +
        (cz - centerCZ) ** 2
      );
      if (dist > maxDist) {
        this.loaded.delete(key);
        this.cache.delete(key);
      }
    }
  },

  // Stats
  stats() {
    let totalCells = 0;
    this.loaded.forEach(chunk => totalCells += chunk.cells.size);

    return {
      chunksLoaded: this.loaded.size,
      chunksLoading: this.loading.size,
      cacheSize: this.cache.size,
      totalCells,
      memoryEstimate: `${Math.round(totalCells * 100 / 1024)} KB`
    };
  }
};

if (typeof module !== 'undefined') module.exports = CHUNKS;
