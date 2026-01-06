/*! K:lead01:1:60:k0:l1b2 !*/
/**
 * KONOMI Leaderboard - Progress Sharing & Ranking
 * Uses localStorage + shareable codes (no backend required)
 */
const LEADERBOARD = {
  key: 'konomi_leaderboard',
  userKey: 'konomi_user',

  // Get or create user profile
  getUser() {
    let user = localStorage.getItem(this.userKey);
    if (user) return JSON.parse(user);

    // Create new user
    user = {
      id: this.generateId(),
      name: 'Haskeller_' + Math.floor(Math.random() * 9999),
      created: Date.now()
    };
    localStorage.setItem(this.userKey, JSON.stringify(user));
    return user;
  },

  // Set username
  setName(name) {
    const user = this.getUser();
    user.name = name.slice(0, 20);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    return user;
  },

  // Generate unique ID
  generateId() {
    return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  // Get current stats for sharing
  getShareableStats() {
    const user = this.getUser();
    const progress = PROGRESS.load();
    const stats = PROGRESS.stats();

    return {
      id: user.id,
      name: user.name,
      xp: stats.xp,
      level: stats.level,
      completed: stats.completed,
      total: stats.total,
      percent: stats.percent,
      unlocked: progress.unlocked,
      timestamp: Date.now()
    };
  },

  // Encode stats to shareable code
  encode(stats) {
    const data = JSON.stringify(stats);
    // Simple base64 encoding (would use better compression in production)
    return btoa(data).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  },

  // Decode shareable code
  decode(code) {
    try {
      // Restore padding
      let padded = code.replace(/-/g, '+').replace(/_/g, '/');
      while (padded.length % 4) padded += '=';
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  },

  // Generate shareable link
  getShareLink() {
    const stats = this.getShareableStats();
    const code = this.encode(stats);
    const base = window.location.origin + window.location.pathname;
    return `${base}?score=${code}`;
  },

  // Generate shareable text
  getShareText() {
    const stats = this.getShareableStats();
    return `I'm learning Haskell on KONOMI Academy!

Level: ${stats.level}
XP: ${stats.xp}
Progress: ${stats.percent}%
Challenges: ${stats.completed}/${stats.total}

Join me: ${this.getShareLink()}`;
  },

  // Copy share link to clipboard
  async copyShareLink() {
    const link = this.getShareLink();
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      return true;
    }
  },

  // Share via Web Share API
  async share() {
    const stats = this.getShareableStats();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KONOMI:HASKELL Progress',
          text: `I reached Level ${stats.level} with ${stats.xp} XP!`,
          url: this.getShareLink()
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },

  // Load leaderboard from URL param
  loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('score');
    if (code) {
      const stats = this.decode(code);
      if (stats) {
        this.addToBoard(stats);
        return stats;
      }
    }
    return null;
  },

  // Get local leaderboard
  getBoard() {
    const data = localStorage.getItem(this.key);
    return data ? JSON.parse(data) : [];
  },

  // Add entry to local leaderboard
  addToBoard(stats) {
    const board = this.getBoard();

    // Check if already exists
    const existing = board.findIndex(e => e.id === stats.id);
    if (existing >= 0) {
      // Update if better
      if (stats.xp > board[existing].xp) {
        board[existing] = stats;
      }
    } else {
      board.push(stats);
    }

    // Sort by XP
    board.sort((a, b) => b.xp - a.xp);

    // Keep top 100
    const trimmed = board.slice(0, 100);
    localStorage.setItem(this.key, JSON.stringify(trimmed));

    return trimmed;
  },

  // Save current progress to leaderboard
  saveToBoard() {
    const stats = this.getShareableStats();
    return this.addToBoard(stats);
  },

  // Get rank of current user
  getRank() {
    const board = this.getBoard();
    const user = this.getUser();
    const idx = board.findIndex(e => e.id === user.id);
    return idx >= 0 ? idx + 1 : board.length + 1;
  },

  // Generate achievement badges
  getBadges(stats) {
    const badges = [];

    if (stats.level >= 1) badges.push({ name: 'Beginner', icon: '🌱', desc: 'Completed basics' });
    if (stats.level >= 3) badges.push({ name: 'Apprentice', icon: '📚', desc: 'Learning lists and HOF' });
    if (stats.level >= 5) badges.push({ name: 'Journeyman', icon: '⚡', desc: 'Understanding monads' });
    if (stats.level >= 7) badges.push({ name: 'Master', icon: '🏆', desc: 'Completed all levels' });
    if (stats.xp >= 100) badges.push({ name: 'Century', icon: '💯', desc: '100+ XP earned' });
    if (stats.xp >= 500) badges.push({ name: 'Elite', icon: '⭐', desc: '500+ XP earned' });
    if (stats.percent === 100) badges.push({ name: 'Perfectionist', icon: '✨', desc: 'All challenges done' });

    return badges;
  },

  // Render leaderboard HTML
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const board = this.saveToBoard(); // Update and get
    const user = this.getUser();
    const stats = this.getShareableStats();
    const badges = this.getBadges(stats);
    const rank = this.getRank();

    container.innerHTML = `
      <div class="lb-header">
        <h3>LEADERBOARD</h3>
        <div class="lb-actions">
          <button onclick="LEADERBOARD.copyShareLink().then(()=>alert('Link copied!'))" class="lb-btn">📋 Copy Link</button>
          <button onclick="LEADERBOARD.share()" class="lb-btn">📤 Share</button>
        </div>
      </div>

      <div class="lb-profile">
        <div class="lb-rank">#${rank}</div>
        <div class="lb-user">
          <input type="text" value="${user.name}" onchange="LEADERBOARD.setName(this.value);LEADERBOARD.render('${containerId}')" class="lb-name-input">
          <div class="lb-stats">${stats.xp} XP • Level ${stats.level} • ${stats.percent}%</div>
        </div>
      </div>

      <div class="lb-badges">
        ${badges.map(b => `<span class="badge" title="${b.desc}">${b.icon} ${b.name}</span>`).join('')}
      </div>

      <div class="lb-list">
        ${board.slice(0, 10).map((entry, i) => `
          <div class="lb-entry ${entry.id === user.id ? 'lb-you' : ''}">
            <span class="lb-pos">${i + 1}</span>
            <span class="lb-name">${entry.name}</span>
            <span class="lb-xp">${entry.xp} XP</span>
            <span class="lb-lvl">Lv${entry.level}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
};

// CSS for leaderboard
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .lb-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
    .lb-header h3{color:var(--accent);margin:0}
    .lb-actions{display:flex;gap:0.5rem}
    .lb-btn{background:var(--border);color:var(--text);border:none;padding:0.4rem 0.8rem;cursor:pointer;border-radius:4px;font-size:0.8rem}
    .lb-btn:hover{background:var(--accent)}
    .lb-profile{display:flex;align-items:center;gap:1rem;background:var(--surface);padding:1rem;border-radius:8px;margin-bottom:1rem}
    .lb-rank{font-size:2rem;color:var(--green);font-weight:bold}
    .lb-name-input{background:transparent;border:none;border-bottom:1px solid var(--border);color:var(--text);font-size:1.1rem;padding:0.2rem;width:150px}
    .lb-stats{color:var(--muted);font-size:0.85rem;margin-top:0.3rem}
    .lb-badges{display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem}
    .badge{background:var(--surface);padding:0.3rem 0.6rem;border-radius:20px;font-size:0.8rem}
    .lb-list{display:flex;flex-direction:column;gap:0.3rem}
    .lb-entry{display:flex;align-items:center;padding:0.5rem;background:var(--surface);border-radius:4px}
    .lb-entry.lb-you{background:var(--green);color:var(--bg)}
    .lb-pos{width:30px;font-weight:bold}
    .lb-name{flex:1}
    .lb-xp{width:80px;text-align:right;color:var(--yellow)}
    .lb-lvl{width:50px;text-align:right;color:var(--accent)}
    .lb-you .lb-xp,.lb-you .lb-lvl{color:var(--bg)}
  `;
  document.head.appendChild(style);
}

// Auto-load from URL
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => LEADERBOARD.loadFromUrl());
}

if (typeof module !== 'undefined') module.exports = LEADERBOARD;
