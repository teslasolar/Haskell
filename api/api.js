/**
 * KONOMI:HASKELL API Server
 * Backend API for compiler/runner services
 * Can be run as: standalone | express middleware | serverless
 */
const API = {
  version: '1.0.0',

  // Route handlers
  routes: {
    // Execute Haskell source
    'POST /run': async (req) => {
      const { src, mode = 'ghci' } = req.body;
      return API.execute(src, mode);
    },

    // Compile to target
    'POST /compile': async (req) => {
      const { src, target = 'ast' } = req.body;
      return API.compile(src, target);
    },

    // Evaluate expression
    'POST /eval': async (req) => {
      const { expr } = req.body;
      return API.eval(expr);
    },

    // Get type
    'POST /type': async (req) => {
      const { expr } = req.body;
      return API.getType(expr);
    },

    // Block coordinate access
    'GET /block/:x/:y/:z': async (req) => {
      const { x, y, z } = req.params;
      return API.getBlock(+x, +y, +z);
    },

    // Template rendering
    'POST /template': async (req) => {
      const { name, params } = req.body;
      return API.renderTemplate(name, params);
    }
  },

  // Execute via GHC/GHCI
  async execute(src, mode) {
    // In browser: delegate to HASKELL.run
    if (typeof window !== 'undefined' && window.HASKELL) {
      return { output: await window.HASKELL.run(src), mode: 'local' };
    }

    // In Node: spawn ghc/ghci process
    if (typeof require !== 'undefined') {
      const { spawn } = require('child_process');
      return new Promise((resolve) => {
        const proc = spawn(mode === 'ghc' ? 'ghc' : 'ghci', ['-e', src]);
        let output = '';
        proc.stdout.on('data', d => output += d);
        proc.stderr.on('data', d => output += d);
        proc.on('close', code => resolve({ output, exitCode: code }));
      });
    }

    return { error: 'No runtime available' };
  },

  // Compile to various targets
  async compile(src, target) {
    const targets = {
      ast: () => window?.HASKELL?.parse(src) || { error: 'No parser' },
      tokens: () => window?.HASKELL?.lex(src) || { error: 'No lexer' },
      // These require GHC backend
      core: () => API.ghcCompile(src, '-ddump-simpl'),
      stg: () => API.ghcCompile(src, '-ddump-stg'),
      cmm: () => API.ghcCompile(src, '-ddump-cmm'),
      asm: () => API.ghcCompile(src, '-ddump-asm')
    };

    return targets[target]?.() || { error: `Unknown target: ${target}` };
  },

  // GHC compilation with flags
  async ghcCompile(src, flags) {
    if (typeof require === 'undefined') {
      return { error: 'GHC requires Node.js backend' };
    }
    const { execSync } = require('child_process');
    const fs = require('fs');
    const tmp = `/tmp/konomi_${Date.now()}.hs`;
    fs.writeFileSync(tmp, src);
    try {
      const out = execSync(`ghc ${flags} ${tmp} 2>&1`).toString();
      fs.unlinkSync(tmp);
      return { result: out };
    } catch (e) {
      return { error: e.message };
    }
  },

  // Evaluate expression
  async eval(expr) {
    if (window?.HASKELL) {
      const value = window.HASKELL.eval(expr);
      return { value, type: typeof value };
    }
    return { error: 'No evaluator' };
  },

  // Type inference
  async getType(expr) {
    if (typeof require !== 'undefined') {
      const { execSync } = require('child_process');
      try {
        const out = execSync(`ghci -e ":t ${expr}" 2>&1`).toString();
        return { type: out.trim() };
      } catch (e) {
        return { error: e.message };
      }
    }
    return { error: 'Requires GHC backend' };
  },

  // Block coordinate lookup
  getBlock(x, y, z) {
    if (window?.KONOMI) {
      return window.KONOMI.get(x, y, z) || { error: 'Block not found' };
    }
    return { error: 'KONOMI not loaded' };
  },

  // Template rendering
  renderTemplate(name, params) {
    if (window?.T?.templates[name]) {
      const spec = window.T.templates[name](params);
      const el = window.T.atom(spec);
      return { html: el.outerHTML };
    }
    return { error: `Template not found: ${name}` };
  },

  // Express middleware factory
  middleware() {
    return async (req, res, next) => {
      const key = `${req.method} ${req.path.replace(/\/\d+/g, '/:id')}`;
      const handler = API.routes[key];
      if (handler) {
        try {
          const result = await handler(req);
          res.json(result);
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      } else {
        next();
      }
    };
  }
};

// Export for various environments
if (typeof module !== 'undefined') module.exports = API;
if (typeof window !== 'undefined') window.API = API;
