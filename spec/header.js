/*! K:spec001:1:1:k0:0000 !*/
/**
 * KONOMI Header UDT System
 * Logical time tracking (Lamport-style)
 * No system clock dependency
 */
const H = {
  // Current logical time
  time: { seq: 1, src: 'k0' },

  // Generate UUID (content-based)
  uid: (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(16).slice(0, 6);
  },

  // Hash content
  hash: (s) => H.uid(s).slice(0, 4),

  // Increment logical time
  tick() {
    this.time.seq++;
    return { ...this.time };
  },

  // Merge with received time (Lamport)
  merge(recv) {
    this.time.seq = Math.max(this.time.seq, recv.seq) + 1;
    return { ...this.time };
  },

  // Create header
  create(content, parents = []) {
    const t = this.tick();
    return {
      uid: this.uid(content + t.seq),
      v: 1,
      t,
      p: parents,
      h: this.hash(content)
    };
  },

  // Parse header string
  parse(s) {
    const m = s.match(/K:(\w+):(\d+):(\d+):(\w+):(\w+)/);
    if (!m) return null;
    return {
      uid: m[1],
      v: +m[2],
      t: { seq: +m[3], src: m[4] },
      h: m[5]
    };
  },

  // Stringify header
  str(h) {
    return `K:${h.uid}:${h.v}:${h.t.seq}:${h.t.src}:${h.h}`;
  },

  // Calculate distance
  dist(h1, h2) {
    return Math.abs(h1.t.seq - h2.t.seq);
  },

  // Check compatibility
  compat(h1, h2, threshold = 10) {
    return this.dist(h1, h2) <= threshold;
  },

  // Version bump
  bump(h, content) {
    const t = this.tick();
    return {
      ...h,
      v: h.v + 1,
      t,
      p: [h.uid],
      h: this.hash(content)
    };
  }
};

if (typeof module !== 'undefined') module.exports = H;
if (typeof window !== 'undefined') window.H = H;
