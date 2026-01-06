/*! K:cube01:1:81:k0:c2u3 !*/
/**
 * KONOMI Cubic Block System
 * Self-referential 3D coordinate space
 * Each cube can call/reference any other
 */
const CUBE={
  // 3D space
  space:{},

  // Place cube at coordinate
  set(x,y,z,data){
    CUBE.space[x]=CUBE.space[x]||{};
    CUBE.space[x][y]=CUBE.space[x][y]||{};
    CUBE.space[x][y][z]={
      coord:[x,y,z],
      data,
      // Self-referential methods
      up:()=>CUBE.get(x,y+1,z),
      down:()=>CUBE.get(x,y-1,z),
      left:()=>CUBE.get(x-1,y,z),
      right:()=>CUBE.get(x+1,y,z),
      front:()=>CUBE.get(x,y,z+1),
      back:()=>CUBE.get(x,y,z-1),
      // Call this cube's function
      call:(fn,...args)=>data[fn]?.(...args),
      // Reference another cube
      ref:(dx,dy,dz)=>CUBE.get(x+dx,y+dy,z+dz),
      // Chain to next
      next:()=>CUBE.get(x,y,z+1)||CUBE.get(x,y+1,0)||CUBE.get(x+1,0,0)
    };
    return CUBE.space[x][y][z];
  },

  // Get cube
  get:(x,y,z)=>CUBE.space[x]?.[y]?.[z]||null,

  // Get by path
  path(p){
    if(typeof KONOMI!=='undefined'){
      const c=KONOMI.MAP[p];
      return c?CUBE.get(...c):null;
    }
    return null;
  },

  // Walk cubes in order
  *walk(){
    const coords=Object.keys(CUBE.space).sort((a,b)=>a-b);
    for(const x of coords){
      const ys=Object.keys(CUBE.space[x]).sort((a,b)=>a-b);
      for(const y of ys){
        const zs=Object.keys(CUBE.space[x][y]).sort((a,b)=>a-b);
        for(const z of zs)yield CUBE.space[x][y][z];
      }
    }
  },

  // Execute across all cubes
  map(fn){
    const results=[];
    for(const cube of CUBE.walk())results.push(fn(cube));
    return results;
  },

  // Find cube by predicate
  find(pred){
    for(const cube of CUBE.walk())if(pred(cube))return cube;
    return null;
  },

  // Initialize from KONOMI
  init(){
    if(typeof KONOMI==='undefined')return CUBE;
    Object.entries(KONOMI.MAP).forEach(([path,[x,y,z]])=>{
      CUBE.set(x,y,z,{
        path,
        url:KONOMI.url(path),
        load:async()=>fetch(KONOMI.url(path)+'index.html').then(r=>r.text()),
        run:async(fn)=>{
          const mod=await import(KONOMI.url(path)+'index.js').catch(()=>null);
          return mod?.[fn]?.();
        }
      });
    });
    return CUBE;
  },

  // Count cubes
  count:()=>[...CUBE.walk()].length
};

if(typeof module!=='undefined')module.exports=CUBE;
if(typeof window!=='undefined')window.CUBE=CUBE;
