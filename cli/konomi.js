#!/usr/bin/env node
/**
 * KONOMI:HASKELL CLI
 * Command-line interface for Haskell compiler/runner
 * Usage: konomi <command> [args]
 */
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const CLI = {
  version: '1.0.0',

  commands: {
    // Run Haskell file
    run: async (args) => {
      const file = args[0];
      if (!file) return CLI.error('Usage: konomi run <file.hs>');
      if (!fs.existsSync(file)) return CLI.error(`File not found: ${file}`);

      const src = fs.readFileSync(file, 'utf8');
      return CLI.exec('runghc', [file]);
    },

    // Evaluate expression
    eval: async (args) => {
      const expr = args.join(' ');
      if (!expr) return CLI.error('Usage: konomi eval "<expr>"');
      return CLI.exec('ghci', ['-e', expr]);
    },

    // Compile to target
    compile: async (args) => {
      const file = args[0];
      const target = CLI.getFlag(args, '--target') || 'ast';

      if (!file) return CLI.error('Usage: konomi compile <file.hs> [--target ast|core|stg]');

      const flags = {
        ast: [],
        core: ['-ddump-simpl'],
        stg: ['-ddump-stg'],
        cmm: ['-ddump-cmm'],
        asm: ['-ddump-asm']
      };

      if (target === 'ast') {
        // Use built-in parser
        const src = fs.readFileSync(file, 'utf8');
        const ast = CLI.parse(src);
        console.log(JSON.stringify(ast, null, 2));
      } else {
        return CLI.exec('ghc', [...(flags[target] || []), file]);
      }
    },

    // Get type
    type: async (args) => {
      const expr = args.join(' ');
      if (!expr) return CLI.error('Usage: konomi type "<expr>"');
      return CLI.exec('ghci', ['-e', `:t ${expr}`]);
    },

    // Interactive REPL
    repl: async () => {
      console.log('KONOMI:HASKELL REPL v' + CLI.version);
      console.log('Type :q to quit, :h for help\n');

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'λ> '
      });

      rl.prompt();
      rl.on('line', async (line) => {
        const cmd = line.trim();
        if (cmd === ':q') process.exit(0);
        if (cmd === ':h') {
          console.log(':q quit  :t type  :l load  :r reload');
        } else if (cmd.startsWith(':t ')) {
          await CLI.commands.type([cmd.slice(3)]);
        } else if (cmd) {
          await CLI.commands.eval([cmd]);
        }
        rl.prompt();
      });
    },

    // Start API server
    serve: async (args) => {
      const port = CLI.getFlag(args, '--port') || 3000;
      console.log(`Starting KONOMI:HASKELL API server on port ${port}`);

      const http = require('http');
      const server = http.createServer(async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (req.method === 'POST') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              if (req.url === '/api/run') {
                const tmp = `/tmp/konomi_${Date.now()}.hs`;
                fs.writeFileSync(tmp, data.src);
                const out = execSync(`runghc ${tmp} 2>&1`).toString();
                fs.unlinkSync(tmp);
                res.end(JSON.stringify({ output: out }));
              } else if (req.url === '/api/eval') {
                const out = execSync(`ghci -e '${data.expr}' 2>&1`).toString();
                res.end(JSON.stringify({ value: out.trim() }));
              } else if (req.url === '/api/compile') {
                const ast = CLI.parse(data.src);
                res.end(JSON.stringify({ result: ast }));
              } else {
                res.end(JSON.stringify({ error: 'Unknown endpoint' }));
              }
            } catch (e) {
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        } else {
          res.end(JSON.stringify({ api: 'KONOMI:HASKELL', version: CLI.version }));
        }
      });

      server.listen(port);
    },

    // Block lookup
    block: async (args) => {
      const [x, y, z] = args.map(Number);
      const MAP = {
        '0,0,0': 'root', '1,0,0': 'meta', '1,0,1': 'legend',
        '1,1,0': 'primitives', '1,1,1': 'types',
        '1,2,0': 'expressions', '1,2,1': 'lists',
        '1,3,0': 'hof', '1,3,1': 'typeclasses',
        '1,4,0': 'monads', '1,4,1': 'io',
        '1,5,0': 'modules', '1,5,1': 'advanced'
      };
      const key = `${x},${y},${z}`;
      console.log(MAP[key] || 'Block not found');
    },

    // Help
    help: () => {
      console.log(`
KONOMI:HASKELL CLI v${CLI.version}

Commands:
  run <file.hs>           Execute Haskell file
  eval "<expr>"           Evaluate expression
  compile <file> [--target]  Compile to target
  type "<expr>"           Get type
  repl                    Interactive REPL
  serve [--port N]        Start API server
  block <x> <y> <z>       Get block by coordinate
  help                    Show this help
`);
    }
  },

  // Simple Haskell parser
  parse(src) {
    const ast = { type: 'Module', decls: [] };
    const lines = src.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;

      if (trimmed.startsWith('module ')) {
        ast.name = trimmed.match(/module\s+(\w+)/)?.[1];
      } else if (trimmed.startsWith('import ')) {
        ast.decls.push({ type: 'Import', module: trimmed.match(/import\s+(\S+)/)?.[1] });
      } else if (trimmed.includes(' :: ')) {
        const [name, sig] = trimmed.split(' :: ');
        ast.decls.push({ type: 'TypeSig', name: name.trim(), sig: sig.trim() });
      } else if (trimmed.includes(' = ')) {
        const [lhs, rhs] = trimmed.split(' = ');
        const name = lhs.split(/\s+/)[0];
        ast.decls.push({ type: 'FnDef', name, body: rhs.trim() });
      }
    }
    return ast;
  },

  // Execute command
  exec(cmd, args) {
    return new Promise((resolve) => {
      const proc = spawn(cmd, args, { stdio: 'inherit' });
      proc.on('close', resolve);
    });
  },

  // Get flag value
  getFlag(args, flag) {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : null;
  },

  error(msg) {
    console.error('Error:', msg);
    process.exit(1);
  }
};

// Main
const [,, cmd, ...args] = process.argv;
const handler = CLI.commands[cmd || 'help'];
if (handler) handler(args);
else CLI.commands.help();
