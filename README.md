#!/usr/bin/env node
/*! K:readme01:1:10:k0:f1a2 !*/
/**
 * KONOMI:HASKELL Executable README
 * Run: node README.md OR ./README.md
 * Entry point for CLI/Pages/API modes
 */

const ENTRY = {
  mode: process.env.KONOMI_MODE || 'cli',

  // Route by mode
  run() {
    const routes = {
      cli: () => this.cli(),
      pages: () => this.pages(),
      api: () => this.api(),
      repl: () => this.repl()
    };
    (routes[this.mode] || routes.cli)();
  },

  // CLI entry
  cli() {
    const [,, cmd, ...args] = process.argv;
    const cmds = {
      help: () => console.log(this.help()),
      run: () => require('./cli/konomi').commands.run(args),
      eval: () => require('./cli/konomi').commands.eval(args),
      serve: () => require('./cli/konomi').commands.serve(args),
      blocks: () => this.listBlocks(),
      ml: () => require('./ml/index').demo(),
      ai: () => require('./ai/index').demo()
    };
    (cmds[cmd] || cmds.help)();
  },

  // Pages mode (static serve)
  pages() {
    const http = require('http');
    const fs = require('fs');
    const path = require('path');
    const port = process.env.PORT || 8080;

    http.createServer((req, res) => {
      let fp = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
      if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) {
        fp = path.join(fp, 'index.html');
      }
      const ext = path.extname(fp);
      const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };

      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
        res.end(data);
      });
    }).listen(port, () => console.log(`KONOMI:HASKELL Pages @ http://localhost:${port}`));
  },

  // API mode
  api() {
    require('./cli/konomi').commands.serve(['--port', process.env.PORT || 3000]);
  },

  // REPL mode
  repl() {
    require('./cli/konomi').commands.repl();
  },

  // List blocks
  listBlocks() {
    const B = require('./core/blocks/block');
    Object.entries(B.MAP).forEach(([p, [x,y,z]]) => {
      console.log(`B[${x}][${y}][${z}] = ${p}`);
    });
  },

  help: () => `
KONOMI:HASKELL v1.0
Usage: node README.md <cmd>

Commands:
  help     Show this help
  run      Run Haskell file
  eval     Evaluate expression
  serve    Start API server
  blocks   List block coordinates
  ml       ML algorithms demo
  ai       AI algorithms demo

Modes (KONOMI_MODE=<mode>):
  cli      Command line (default)
  pages    Static file server
  api      API server
  repl     Interactive REPL
`
};

if (require.main === module) ENTRY.run();
module.exports = ENTRY;
