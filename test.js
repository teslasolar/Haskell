#!/usr/bin/env node
/*! K:test02:1:101:k0:t2e3 !*/
/**
 * KONOMI:HASKELL Test Runner
 * Tests pages, links, JS functionality
 */
const fs=require('fs');
const path=require('path');

const TEST={
  pass:0,fail:0,

  // Test file exists
  file(p){
    const fp=path.join(__dirname,p);
    const ok=fs.existsSync(fp);
    this.log(ok,`FILE ${p}`);
    return ok;
  },

  // Test directory has index.html
  dir(p){
    return this.file(p+'/index.html');
  },

  // Test JS module loads
  mod(p,exports=[]){
    try{
      const m=require(path.join(__dirname,p));
      const ok=exports.every(e=>m[e]!==undefined);
      this.log(ok,`MOD ${p} [${exports.join(',')}]`);
      return ok;
    }catch(e){
      this.log(false,`MOD ${p} - ${e.message}`);
      return false;
    }
  },

  // Test function returns expected
  fn(name,fn,expected){
    try{
      const r=fn();
      const ok=expected?expected(r):r!==undefined;
      this.log(ok,`FN ${name}`);
      return ok;
    }catch(e){
      this.log(false,`FN ${name} - ${e.message}`);
      return false;
    }
  },

  // Log result
  log(ok,msg){
    ok?this.pass++:this.fail++;
    console.log(`${ok?'✓':'✗'} ${msg}`);
  },

  // Summary
  summary(){
    console.log(`\n${this.pass} passed, ${this.fail} failed`);
    return this.fail===0;
  }
};

console.log('KONOMI:HASKELL Test Suite\n');

// 1. Root files
console.log('-- ROOT FILES --');
TEST.file('index.html');
TEST.file('app.html');
TEST.file('README.md');
TEST.file('gen.js');
TEST.file('css/style.css');

// 2. Language layers
console.log('\n-- LANGUAGE LAYERS B[1][y][z] --');
['meta','legend','primitives','types','expressions','lists',
 'hof','typeclasses','monads','io','modules','advanced'].forEach(d=>TEST.dir(d));

// 3. Reference
console.log('\n-- REFERENCE B[2][y][z] --');
['quickstart','invariants','crosswalk'].forEach(d=>TEST.dir(d));

// 4. Core
console.log('\n-- CORE B[3][y][z] --');
['core','core/blocks','core/templates','core/compiler','core/chain'].forEach(d=>TEST.dir(d));

// 5. Services
console.log('\n-- SERVICES B[4][y][z] --');
['api','cli','mcp','runtime'].forEach(d=>TEST.dir(d));

// 6. ML/AI
console.log('\n-- ML/AI B[5-6][y][z] --');
['ml','ai','spec'].forEach(d=>TEST.dir(d));

// 7. JS Modules
console.log('\n-- JS MODULES --');
TEST.mod('./core/blocks/block.js',['MAP','get','init']);
TEST.mod('./core/chain/chain.js',['create','add','verify']);
TEST.mod('./core/chain/cube.js',['set','get','walk']);
TEST.mod('./core/chain/run.js',['reg','call','init']);
TEST.mod('./spec/header.js',['create','parse','str']);
TEST.mod('./ml/index.js',['linear','knn','kmeans']);
TEST.mod('./ai/index.js',['astar','minimax','genetic','nn']);

// 8. Functionality
console.log('\n-- FUNCTIONALITY --');
const KONOMI=require('./core/blocks/block.js');
TEST.fn('KONOMI.MAP.meta',()=>KONOMI.MAP.meta,r=>r&&r[0]===1);
TEST.fn('KONOMI.get(1,0,0)',()=>KONOMI.get(1,0,0),r=>r?.path==='meta');

const CHAIN=require('./core/chain/chain.js');
TEST.fn('CHAIN.create',()=>CHAIN.create([0,0,0],{test:1}),r=>r?.hash);

const ML=require('./ml/index.js');
TEST.fn('ML.linear.fit',()=>ML.linear.fit([[1,2],[2,4]]).predict(3),r=>r===6);

const AI=require('./ai/index.js');
TEST.fn('AI.astar.search',()=>AI.astar.search(0,3,n=>[n+1].filter(x=>x<=3),(a,b)=>Math.abs(a-b)),r=>Array.isArray(r));

const H=require('./spec/header.js');
TEST.fn('H.create',()=>H.create('test'),r=>r?.uid&&r?.h);

// Summary
console.log('\n-- SUMMARY --');
process.exit(TEST.summary()?0:1);
