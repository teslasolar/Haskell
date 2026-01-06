/*! K:chain01:1:80:k0:c1h2 !*/
/**
 * KONOMI Blockchain Layer
 * Each URL/block = blockchain block
 * Cubic addressing with hash chains
 */
const CHAIN={
  blocks:[],
  genesis:null,

  // Hash function
  hash:(d)=>{let h=0;const s=JSON.stringify(d);for(let i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;return Math.abs(h).toString(16).padStart(8,'0');},

  // Create genesis block B[0][0][0]
  genesis:()=>({
    idx:0,
    coord:[0,0,0],
    prev:'00000000',
    data:{path:'root',url:'/'},
    hash:null,
    ts:0
  }),

  // Create block from coordinate
  create(coord,data,prev){
    const b={
      idx:CHAIN.blocks.length,
      coord,
      prev:prev||CHAIN.blocks[CHAIN.blocks.length-1]?.hash||'00000000',
      data,
      ts:Date.now()
    };
    b.hash=CHAIN.hash(b);
    return b;
  },

  // Add block to chain
  add(coord,data){
    const b=CHAIN.create(coord,data);
    CHAIN.blocks.push(b);
    return b;
  },

  // Get block by coordinate
  get(x,y,z){
    return CHAIN.blocks.find(b=>b.coord[0]===x&&b.coord[1]===y&&b.coord[2]===z);
  },

  // Verify chain integrity
  verify(){
    for(let i=1;i<CHAIN.blocks.length;i++){
      const b=CHAIN.blocks[i];
      const p=CHAIN.blocks[i-1];
      if(b.prev!==p.hash)return{valid:false,idx:i};
      const h=CHAIN.hash({...b,hash:null});
      if(h!==b.hash)return{valid:false,idx:i,reason:'hash'};
    }
    return{valid:true,len:CHAIN.blocks.length};
  },

  // Initialize from KONOMI.MAP
  init(){
    if(typeof KONOMI==='undefined')return;
    // Genesis
    const g=CHAIN.create([0,0,0],{path:'root',url:KONOMI.url('root')});
    CHAIN.blocks.push(g);
    // Add all mapped blocks
    Object.entries(KONOMI.MAP).forEach(([path,[x,y,z]])=>{
      if(path!=='root')CHAIN.add([x,y,z],{path,url:KONOMI.url(path)});
    });
    return CHAIN;
  },

  // Export chain
  export:()=>JSON.stringify(CHAIN.blocks),

  // Import chain
  import(json){
    CHAIN.blocks=JSON.parse(json);
    return CHAIN.verify();
  }
};

if(typeof module!=='undefined')module.exports=CHAIN;
if(typeof window!=='undefined')window.CHAIN=CHAIN;
