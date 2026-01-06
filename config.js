/*! K:cfg001:1:103:k0:c1f2 !*/
/**
 * KONOMI Config
 * Set base path for GitHub Pages
 */
const CONFIG = {
  // Auto-detect base from current URL or default
  base: (typeof location !== 'undefined' && location.pathname.includes('/Haskell/'))
    ? '/Haskell/'
    : '/',

  // Build URL with base
  url: (path) => CONFIG.base + (path.startsWith('/') ? path.slice(1) : path),

  // Check if running on GitHub Pages
  isGitHubPages: typeof location !== 'undefined' && location.host.includes('github.io')
};

if (typeof window !== 'undefined') window.CONFIG = CONFIG;
if (typeof module !== 'undefined') module.exports = CONFIG;
