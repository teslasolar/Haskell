#!/usr/bin/env node
/*! K:coreread:1:15:k0:a2b3 !*/
/**
 * CORE README - Executable Entry
 * Run: node core/README.md [cmd]
 */

const CMDS = {
  help: () => console.log(`
CORE System B[3][y][z]
  blocks     3D coordinate system
  templates  Atomic template engine
  compiler   Haskell compiler
  info       System info
`),

  blocks: () => {
    const B = require('./blocks/block.js');
    console.log('Block Coordinates:');
    Object.entries(B.MAP).slice(0,10).forEach(([p,[x,y,z]]) => {
      console.log(`  B[${x}][${y}][${z}] = ${p}`);
    });
    console.log('  ...');
  },

  templates: () => {
    console.log('Atomic Templates:');
    console.log('  T.atom({as,text,href,action,coord,css,children})');
    console.log('  T.render(name, params, target)');
    console.log('  Templates: nav, code, block, layer, grid');
  },

  compiler: () => {
    const H = require('./compiler/haskell.js');
    const src = 'double x = x * 2';
    console.log('Haskell Compiler:');
    console.log('  Input:', src);
    console.log('  Tokens:', H.lex(src).map(t => t.val).join(' '));
  },

  info: () => {
    const H = require('../spec/header.js');
    console.log('KONOMI:HASKELL Core');
    console.log('  Logical Time:', H.time);
    console.log('  Header:', H.str(H.create('test')));
  }
};

const [,, cmd = 'help'] = process.argv;
(CMDS[cmd] || CMDS.help)();
