/*! K:run001:1:82:k0:r1u2 !*/
/**
 * KONOMI Self-Running Orchestrator
 * Executes blocks by coordinate
 * Single entry point for all tools
 */
const RUN={
  // Tool registry
  tools:{},

  // Register tool at coordinate
  reg(coord,name,fn){
    const key=coord.join(',');
    RUN.tools[key]=RUN.tools[key]||{};
    RUN.tools[key][name]=fn;
  },

  // Call tool by coordinate
  call(x,y,z,name,...args){
    const key=`${x},${y},${z}`;
    return RUN.tools[key]?.[name]?.(...args);
  },

  // Call by path
  path(p,name,...args){
    if(typeof KONOMI!=='undefined'){
      const c=KONOMI.MAP[p];
      return c?RUN.call(...c,name,...args):null;
    }
  },

  // Execute sequence of coordinates
  async seq(steps){
    const results=[];
    for(const[coord,fn,args]of steps){
      results.push(await RUN.call(...coord,fn,...(args||[])));
    }
    return results;
  },

  // Parallel execution
  async par(steps){
    return Promise.all(steps.map(([coord,fn,args])=>
      RUN.call(...coord,fn,...(args||[]))
    ));
  },

  // Self-referential execution chain
  async chain(start,next){
    let coord=start;
    const results=[];
    while(coord){
      const r=await RUN.call(...coord,'exec');
      results.push({coord,result:r});
      coord=next(coord,r);
    }
    return results;
  },

  // Initialize standard tools
  init(){
    // Core tools
    RUN.reg([0,0,0],'info',()=>({name:'KONOMI',version:'1.0'}));
    RUN.reg([3,1,1],'compile',(src)=>HASKELL?.parse(src));
    RUN.reg([3,1,1],'run',(src)=>HASKELL?.run(src));
    RUN.reg([5,0,0],'ml',(cmd)=>ML?.[cmd]?.());
    RUN.reg([6,0,0],'ai',(cmd)=>AI?.[cmd]?.());

    // Block tools
    if(typeof KONOMI!=='undefined'){
      Object.entries(KONOMI.MAP).forEach(([path,[x,y,z]])=>{
        RUN.reg([x,y,z],'path',()=>path);
        RUN.reg([x,y,z],'url',()=>path==='root'?'/':`/${path}/`);
        RUN.reg([x,y,z],'load',async()=>{
          const url=path==='root'?'/':(`/${path}/`);
          return fetch(url+'index.html').then(r=>r.text());
        });
      });
    }
    return RUN;
  },

  // List all tools
  list(){
    const all=[];
    Object.entries(RUN.tools).forEach(([k,v])=>{
      Object.keys(v).forEach(fn=>all.push({coord:k.split(',').map(Number),fn}));
    });
    return all;
  }
};

if(typeof module!=='undefined')module.exports=RUN;
if(typeof window!=='undefined')window.RUN=RUN;
