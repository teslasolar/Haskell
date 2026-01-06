/*! K:acad02:1:88:k0:p1r2 !*/
/**
 * KONOMI Academy - Progress Tracking
 * localStorage-based progress with XP system
 */
const PROGRESS = {
  key: 'konomi_academy',

  // Load progress from localStorage
  load() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : this.fresh();
    } catch { return this.fresh(); }
  },

  // Fresh progress state
  fresh() {
    return {
      xp: 0,
      level: 0,
      completed: {},    // { levelId: [challengeIds] }
      unlocked: [],     // Unlocked site features
      started: Date.now(),
      lastActive: Date.now()
    };
  },

  // Save progress
  save(progress) {
    progress.lastActive = Date.now();
    localStorage.setItem(this.key, JSON.stringify(progress));
    return progress;
  },

  // Complete a challenge
  complete(levelId, challengeId, xp) {
    const p = this.load();
    if (!p.completed[levelId]) p.completed[levelId] = [];
    if (!p.completed[levelId].includes(challengeId)) {
      p.completed[levelId].push(challengeId);
      p.xp += xp;
    }
    return this.save(p);
  },

  // Check if level is complete
  isLevelComplete(levelId) {
    const p = this.load();
    const level = LEVELS[levelId];
    if (!level) return false;
    const done = p.completed[levelId] || [];
    return level.challenges.every(c => done.includes(c.id));
  },

  // Check if level is unlocked
  isLevelUnlocked(levelId) {
    const level = LEVELS[levelId];
    if (!level) return false;
    if (!level.requires || level.requires.length === 0) return true;
    return level.requires.every(req => this.isLevelComplete(req));
  },

  // Unlock features when level complete
  unlockFeatures(levelId) {
    const p = this.load();
    const level = LEVELS[levelId];
    if (level && level.unlocks) {
      level.unlocks.forEach(f => {
        if (!p.unlocked.includes(f)) p.unlocked.push(f);
      });
    }
    return this.save(p);
  },

  // Check if feature is unlocked
  hasFeature(feature) {
    const p = this.load();
    return p.unlocked.includes('all') || p.unlocked.includes(feature);
  },

  // Get current level number
  getCurrentLevel() {
    const p = this.load();
    let lvl = 0;
    Object.keys(LEVELS).forEach(id => {
      if (this.isLevelComplete(id)) lvl = Math.max(lvl, LEVELS[id].id + 1);
    });
    return lvl;
  },

  // Get XP for current level
  getLevelXP(levelId) {
    const p = this.load();
    const level = LEVELS[levelId];
    if (!level) return 0;
    const done = p.completed[levelId] || [];
    return level.challenges
      .filter(c => done.includes(c.id))
      .reduce((s, c) => s + c.xp, 0);
  },

  // Get stats
  stats() {
    const p = this.load();
    const totalChallenges = Object.values(LEVELS).reduce((s, l) => s + l.challenges.length, 0);
    const completedChallenges = Object.values(p.completed).reduce((s, arr) => s + arr.length, 0);
    return {
      xp: p.xp,
      level: this.getCurrentLevel(),
      completed: completedChallenges,
      total: totalChallenges,
      percent: Math.round((completedChallenges / totalChallenges) * 100),
      unlocked: p.unlocked
    };
  },

  // Reset progress
  reset() {
    localStorage.removeItem(this.key);
    return this.fresh();
  }
};

if (typeof module !== 'undefined') module.exports = PROGRESS;
