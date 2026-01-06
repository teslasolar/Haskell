/*! K:auto01:1:61:k0:a2b3 !*/
/**
 * KONOMI Auto-Loader
 * Discovers and loads sub-indexes
 */
const AUTO={
// Scan for sub-indexes
scan:()=>{
  const subs=[];
  if(typeof window!=='undefined'&&window.KONOMI){
    Object.entries(KONOMI.MAP).forEach(([p,[x,y,z]])=>{
      if(p!=='root')subs.push({path:p,coord:[x,y,z],url:`/${p}/`});
    });
  }
  return subs;
},

// Load sub-index content via fetch
load:async(path)=>{
  try{
    const r=await fetch(`/${path}/index.html`);
    return r.ok?await r.text():null;
  }catch(e){return null;}
},

// Register new sub-index
register:(path,coord)=>{
  if(window.KONOMI){
    KONOMI.MAP[path]=coord;
    KONOMI.init(...coord,{path,coord,url:`/${path}/`,type:'block'});
  }
},

// Auto-discover from DOM links
discoverLinks:()=>{
  const links=document.querySelectorAll('a[href$="/"]');
  return Array.from(links).map(a=>a.getAttribute('href').replace(/^\//,'').replace(/\/$/,'')).filter(Boolean);
},

// Generate nav from blocks
nav:(filter)=>{
  const items=AUTO.scan().filter(b=>!filter||b.path.startsWith(filter));
  return items.map(b=>`<a href="${b.url}">${b.path}</a>`).join('');
},

// Init auto-loader on page
init:()=>{
  const el=document.getElementById('auto-nav');
  if(el)el.innerHTML=AUTO.nav();
  const map=document.getElementById('auto-map');
  if(map)map.textContent=AUTO.scan().map(b=>`B[${b.coord.join('][')}] ${b.path}`).join('\n');
}
};
if(typeof window!=='undefined'){window.AUTO=AUTO;document.addEventListener('DOMContentLoaded',AUTO.init);}
if(typeof module!=='undefined')module.exports=AUTO;
