/*! K:acad03:1:86:k0:g1t2 !*/
/**
 * KONOMI Academy Gate
 * Checks if user has completed basics before allowing site access
 */
const GATE = {
  key: 'konomi_academy',

  // Check if basics level is complete
  hasBasics() {
    try {
      const data = localStorage.getItem(this.key);
      if (!data) return false;
      const p = JSON.parse(data);
      const basics = p.completed?.basics || [];
      // Need all 3 basic challenges
      return basics.length >= 3;
    } catch { return false; }
  },

  // Check if a specific feature is unlocked
  hasFeature(feature) {
    try {
      const data = localStorage.getItem(this.key);
      if (!data) return false;
      const p = JSON.parse(data);
      return p.unlocked?.includes('all') || p.unlocked?.includes(feature);
    } catch { return false; }
  },

  // Get user level
  getLevel() {
    try {
      const data = localStorage.getItem(this.key);
      if (!data) return 0;
      const p = JSON.parse(data);
      let lvl = 0;
      if (p.completed?.basics?.length >= 3) lvl = 1;
      if (p.completed?.types?.length >= 3) lvl = 2;
      if (p.completed?.lists?.length >= 4) lvl = 3;
      if (p.completed?.hof?.length >= 4) lvl = 4;
      if (p.completed?.typeclasses?.length >= 3) lvl = 5;
      if (p.completed?.monads?.length >= 3) lvl = 6;
      if (p.completed?.master?.length >= 2) lvl = 7;
      return lvl;
    } catch { return 0; }
  },

  // Redirect to academy if no basics
  check(redirect = true) {
    if (!this.hasBasics()) {
      if (redirect) {
        const base = window.location.pathname.includes('/Haskell/') ? '/Haskell/' : '/';
        window.location.href = base + 'academy/';
      }
      return false;
    }
    return true;
  },

  // Show locked overlay for features
  lockFeature(elementId, feature, message) {
    if (!this.hasFeature(feature)) {
      const el = document.getElementById(elementId);
      if (el) {
        el.innerHTML = `<div class="locked-feature">
          <p>${message || 'Complete more challenges to unlock'}</p>
          <a href="${window.location.pathname.includes('/Haskell/') ? '/Haskell/' : '/'}academy/">Go to Academy</a>
        </div>`;
      }
      return true;
    }
    return false;
  }
};

if (typeof module !== 'undefined') module.exports = GATE;
