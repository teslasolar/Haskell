/**
 * KONOMI:HASKELL Compiler/Runner Interface
 * Frontend interface to backend Haskell services
 * Supports: API, CLI, MCP, AI service modes
 */
const HASKELL = {
  // Configuration
  config: {
    apiBase: '/api',
    mode: 'local',  // local | api | cli | mcp | ai
    timeout: 30000
  },

  // Lexer - tokenize Haskell source
  lex(src) {
    const tokens = [];
    const patterns = [
      ['KEYWORD', /^(module|where|import|data|type|newtype|class|instance|deriving|let|in|case|of|if|then|else|do|where)\b/],
      ['TYPE', /^[A-Z][a-zA-Z0-9_']*/],
      ['IDENT', /^[a-z_][a-zA-Z0-9_']*/],
      ['OP', /^(->|<-|=>|::|>=|<=|==|\/=|\+\+|>>=|>>|\.\.|[+\-*\/=<>:$.|\\@!#%^&])/],
      ['NUM', /^-?\d+(\.\d+)?/],
      ['STR', /^"([^"\\]|\\.)*"/],
      ['CHAR', /^'([^'\\]|\\.)'/],
      ['PAREN', /^[()\[\]{},;]/],
      ['COMMENT', /^--[^\n]*/],
      ['MCOMMENT', /^\{-[\s\S]*?-\}/],
      ['WS', /^\s+/]
    ];

    let rest = src;
    while (rest.length > 0) {
      let matched = false;
      for (const [type, regex] of patterns) {
        const m = rest.match(regex);
        if (m) {
          if (type !== 'WS' && type !== 'COMMENT' && type !== 'MCOMMENT') {
            tokens.push({ type, val: m[0] });
          }
          rest = rest.slice(m[0].length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push({ type: 'ERR', val: rest[0] });
        rest = rest.slice(1);
      }
    }
    return tokens;
  },

  // Parser - build AST
  parse(src) {
    const tokens = this.lex(src || this.getSrc());
    const ast = { type: 'Module', decls: [] };
    let i = 0;

    const peek = () => tokens[i];
    const next = () => tokens[i++];
    const expect = (type) => {
      if (peek()?.type !== type) throw new Error(`Expected ${type}`);
      return next();
    };

    while (i < tokens.length) {
      const t = peek();
      if (!t) break;

      if (t.type === 'KEYWORD' && t.val === 'module') {
        next();
        ast.name = expect('TYPE').val;
        if (peek()?.val === 'where') next();
      } else if (t.type === 'KEYWORD' && t.val === 'import') {
        next();
        ast.decls.push({ type: 'Import', module: expect('TYPE').val });
      } else if (t.type === 'KEYWORD' && t.val === 'data') {
        next();
        const name = expect('TYPE').val;
        const params = [];
        while (peek()?.type === 'IDENT') params.push(next().val);
        expect('OP'); // =
        ast.decls.push({ type: 'Data', name, params, constructors: [] });
      } else if (t.type === 'IDENT') {
        const name = next().val;
        if (peek()?.val === '::') {
          next();
          const sig = [];
          while (peek() && peek().val !== '=' && peek().type !== 'IDENT') {
            sig.push(next().val);
          }
          ast.decls.push({ type: 'TypeSig', name, sig: sig.join(' ') });
        } else if (peek()?.val === '=') {
          next();
          const body = [];
          while (peek() && peek().type !== 'IDENT' && peek().val !== ';') {
            body.push(next().val);
          }
          ast.decls.push({ type: 'FnDef', name, body: body.join(' ') });
        } else {
          next();
        }
      } else {
        next();
      }
    }

    this.setOut(JSON.stringify(ast, null, 2));
    return ast;
  },

  // Interpreter - evaluate expressions
  eval(expr) {
    const env = {
      '+': (a,b) => a + b,
      '-': (a,b) => a - b,
      '*': (a,b) => a * b,
      '/': (a,b) => Math.floor(a / b),
      'mod': (a,b) => a % b,
      'head': (xs) => xs[0],
      'tail': (xs) => xs.slice(1),
      'length': (xs) => xs.length,
      'sum': (xs) => xs.reduce((a,b) => a+b, 0),
      'product': (xs) => xs.reduce((a,b) => a*b, 1),
      'map': (f,xs) => xs.map(f),
      'filter': (f,xs) => xs.filter(f),
      'foldr': (f,z,xs) => xs.reduceRight((acc,x) => f(x,acc), z),
      'True': true,
      'False': false,
      'Nothing': null,
      'Just': (x) => ({ just: x })
    };

    // Simple expression evaluator
    try {
      // Convert Haskell-ish to JS-ish
      let js = expr
        .replace(/\[(\d+)\.\.(\d+)\]/g, (_, a, b) =>
          `[${Array.from({length:b-a+1},(_,i)=>+a+i).join(',')}]`)
        .replace(/(\w+)\s*\$\s*/g, '$1(')
        .replace(/\s*\.\s*/g, ')(');

      const result = new Function('env', `with(env){return ${js}}`)(env);
      return result;
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },

  // Run via backend
  async run(src) {
    src = src || this.getSrc();
    this.setOut('Running...');

    if (this.config.mode === 'local') {
      // Local parse + limited eval
      const ast = this.parse(src);
      const mainDef = ast.decls.find(d => d.name === 'main');
      if (mainDef) {
        this.setOut(`Parsed:\n${JSON.stringify(ast, null, 2)}\n\n[Local mode - use API/CLI/MCP for full execution]`);
      } else {
        this.setOut(JSON.stringify(ast, null, 2));
      }
      return ast;
    }

    // API mode
    try {
      const res = await fetch(`${this.config.apiBase}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src, mode: this.config.mode })
      });
      const data = await res.json();
      this.setOut(data.output || data.error);
      return data;
    } catch (e) {
      this.setOut(`API Error: ${e.message}`);
    }
  },

  // Compile to target
  async compile(src, target = 'ast') {
    src = src || this.getSrc();
    if (target === 'ast') return this.parse(src);

    try {
      const res = await fetch(`${this.config.apiBase}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src, target })
      });
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  // UI helpers
  getSrc() { return document.getElementById('src')?.value || ''; },
  setOut(s) { const el = document.getElementById('out'); if(el) el.textContent = s; },
  clear() { document.getElementById('src').value = ''; this.setOut(''); }
};

// Example code
document.getElementById('src').value = `-- KONOMI:HASKELL Example
module Main where

double :: Int -> Int
double n = n * 2

main = print (double 21)`;

window.HASKELL = HASKELL;
