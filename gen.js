#!/usr/bin/env node
/*! K:gen001:1:62:k0:g3n4 !*/
/**
 * KONOMI Index Generator
 * Creates new sub-index with auto-registration
 * Usage: node gen.js <path> <x> <y> <z> [content]
 */
const fs=require('fs');
const path=require('path');

const IDX=require('./core/templates/idx.js');
const H=require('./spec/header.js');
const KONOMI=require('./core/blocks/block.js');

const GEN={
  // Create new sub-index
  create(subpath,x,y,z,content=''){
    const dir=path.join(__dirname,subpath);
    const coord=[+x,+y,+z];

    // Create directory
    if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});

    // Generate index HTML
    const html=IDX.gen(subpath,content||this.defaultContent(subpath,coord),coord);
    fs.writeFileSync(path.join(dir,'index.html'),html);

    // Update block.js MAP
    this.registerBlock(subpath,coord);

    console.log(`Created: ${subpath}/index.html`);
    console.log(`Coord:   B[${coord.join('][')}]`);
    return{path:subpath,coord,dir};
  },

  // Default content for new index
  defaultContent(p,c){
    return`<span class="cm">${p.toUpperCase()}</span>
B[${c.join('][')}]

<span class="cm">Add content here</span>`;
  },

  // Register in block.js
  registerBlock(subpath,coord){
    const blockFile=path.join(__dirname,'core/blocks/block.js');
    let src=fs.readFileSync(blockFile,'utf8');

    // Find MAP object and add entry
    const entry=`    '${subpath}': [${coord.join(',')}],`;
    const insertPoint=src.indexOf("'ai/rl':");
    if(insertPoint>0){
      const lineEnd=src.indexOf('\n',insertPoint);
      src=src.slice(0,lineEnd+1)+entry+'\n'+src.slice(lineEnd+1);

      // Bump header version
      src=src.replace(/K:block01:(\d+):(\d+)/,(m,v,s)=>`K:block01:${+v+1}:${+s+1}`);
      fs.writeFileSync(blockFile,src);
      console.log(`Registered in block.js`);
    }
  },

  // List all blocks
  list(){
    console.log('KONOMI Blocks:');
    Object.entries(KONOMI.MAP).forEach(([p,[x,y,z]])=>{
      console.log(`  B[${x}][${y}][${z}] = ${p}`);
    });
  },

  // Generate README for path
  readme(subpath){
    const tpl=`#!/usr/bin/env node
/*! K:${subpath.replace(/\//g,'')}rd:1:1:k0:0000 !*/
const CMDS={help:()=>console.log('${subpath} README')};
const[,,cmd='help']=process.argv;
(CMDS[cmd]||CMDS.help)();`;
    const fp=path.join(__dirname,subpath,'README.md');
    fs.writeFileSync(fp,tpl);
    console.log(`Created: ${subpath}/README.md`);
  }
};

// CLI
const[,,cmd,...args]=process.argv;
const cmds={
  help:()=>console.log(`
KONOMI Index Generator

  node gen.js new <path> <x> <y> <z>  Create sub-index
  node gen.js list                     List all blocks
  node gen.js readme <path>            Generate README

Example:
  node gen.js new utils 7 0 0
`),
  new:()=>args.length>=4?GEN.create(...args):cmds.help(),
  list:()=>GEN.list(),
  readme:()=>args[0]?GEN.readme(args[0]):cmds.help()
};

(cmds[cmd]||cmds.help)();
