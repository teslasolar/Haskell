/*! K:idx001:1:60:k0:t1m2 !*/
/**
 * KONOMI Index Template (Minified)
 * Auto-generates sub-index HTML
 */
const IDX={
v:'1.0',
// Minified template - expands with params
tpl:(p)=>`<!-- K:${p.uid||'auto'}:1:${p.seq||1}:k0:${p.h||'0000'} -->
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${p.title||'INDEX'}|KONOMI</title><link rel="stylesheet" href="${p.css||'../css/style.css'}"></head><body><div class="container"><a class="back" href="${p.back||'../'}">&larr;Back</a><section><h2>${p.h2||p.title||'INDEX'}</h2><pre>${p.content||''}</pre></section>${p.extra||''}<footer>K:${p.uid||'auto'}|B[${(p.coord||[0,0,0]).join('][')}]</footer></div></body></html>`,

// Even more minified (single line)
mini:(p)=>`<!-- K:${p.u}:1:${p.s}:k0:${p.h} --><!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${p.t}</title><link rel="stylesheet" href="${p.c}"></head><body><div class="container"><a class="back" href="${p.b}">&larr;</a><section><h2>${p.t}</h2><pre>${p.x}</pre></section></div></body></html>`,

// Generate for path
gen:(path,content,coord)=>{
  const uid=path.replace(/\//g,'').slice(0,6)||'idx';
  return IDX.tpl({
    uid,
    title:path.split('/').pop().toUpperCase(),
    content,
    coord,
    seq:Date.now()%1000,
    h:IDX.hash(content)
  });
},

// Simple hash
hash:(s)=>{let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;return Math.abs(h).toString(16).slice(0,4);},

// Discover subdirs (Node)
discover:(dir)=>{
  if(typeof require==='undefined')return[];
  const fs=require('fs'),path=require('path');
  return fs.readdirSync(dir).filter(f=>fs.statSync(path.join(dir,f)).isDirectory());
}
};
if(typeof module!=='undefined')module.exports=IDX;
if(typeof window!=='undefined')window.IDX=IDX;
