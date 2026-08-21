// Real-table compatibility layer for the current bootstrap8 runtime.
// The imported GLB itself is the source of truth for the visible playing surface.
let source=await fetch('./src/bootstrap8.js',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw new Error(`bootstrap8 ${r.status}`);
  return r.text();
});

// Keep real pool-ball dimensions, but expose the live ball collection so the
// final runtime can constrain it against the ACTUAL Felt mesh rather than
// another hand-tuned rectangle.
source=source.replace(
  'const calibration=calibrateBallVisualHeight(model,rt);',
  'const calibration={offset:0};rt.ballVisualOffsetY=0;'
);

source=source.replace(
  "  const blob=new Blob([source],{type:'text/javascript'});",
  `  source=source.replace(
    "const table={w:2.84,h:1.42,y:.78,rail:.115},ballR=.05715,pocketR=.098,balls=[],rails=[];window.__billiardsRuntime={scene,THREE,table,statusEl,camera,ballVisualOffsetY:0};",
    "const table={w:2.7432,h:1.3716,y:.78,rail:.09},ballR=.028575,pocketR=.065,balls=[],rails=[];window.__billiardsRuntime={scene,THREE,table,statusEl,camera,ballVisualOffsetY:0,balls,rails};"
  );
  source=source.replace("const gap=.20;","const gap=.05;");
  const blob=new Blob([source],{type:'text/javascript'});`
);

const blob=new Blob([source],{type:'text/javascript'});
const url=URL.createObjectURL(blob);
try{await import(url)}finally{URL.revokeObjectURL(url)}

const rt=window.__billiardsRuntime;

function hideEmbeddedCue(){
  const model=rt?.realTable;
  if(!model)return;
  model.traverse(o=>{
    const n=(o.name||'').toLowerCase();
    if(n.includes('cue'))o.visible=false;
  });
}

function findFelt(){
  let felt=null;
  rt?.realTable?.traverse(o=>{
    if(!felt && /felt/i.test(o.name||''))felt=o;
  });
  return felt;
}

function installRealSurfaceGuard(){
  if(!rt?.realTable||!rt?.balls?.length)return;
  const felt=findFelt();
  if(!felt)return;

  rt.realTable.updateMatrixWorld(true);
  const box=new rt.THREE.Box3().setFromObject(felt);
  const size=box.getSize(new rt.THREE.Vector3());
  const center=box.getCenter(new rt.THREE.Vector3());
  const r=rt.ballR||.028575;
  const surfaceY=box.max.y;

  // main7 uses table.y + .026 as the cloth top. Move that logical surface to
  // the actual GLB Felt top so physics and rendering share the same height.
  rt.table.y=surfaceY-.026;

  const minX=box.min.x+r*.96;
  const maxX=box.max.x-r*.96;
  const minZ=box.min.z+r*.96;
  const maxZ=box.max.z-r*.96;
  const pocketOpen=Math.max(.078,r*2.7);
  const pockets=[
    [box.min.x,box.min.z],[center.x,box.min.z],[box.max.x,box.min.z],
    [box.min.x,box.max.z],[center.x,box.max.z],[box.max.x,box.max.z]
  ];

  const nearPocket=(x,z)=>pockets.some(([px,pz])=>Math.hypot(x-px,z-pz)<pocketOpen);

  // Small contact shadows directly underneath the balls remove the false
  // "floating" impression from the angled room lights without moving physics.
  const shadowGeo=new rt.THREE.CircleGeometry(r*.84,24);
  const shadows=new Map();
  for(const b of rt.balls){
    const m=new rt.THREE.Mesh(
      shadowGeo,
      new rt.THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false})
    );
    m.rotation.x=-Math.PI/2;
    m.renderOrder=1;
    rt.scene.add(m);
    shadows.set(b,m);
  }

  const tick=()=>{
    hideEmbeddedCue();
    for(const b of rt.balls){
      const shadow=shadows.get(b);
      if(b.pocketed||b.falling){if(shadow)shadow.visible=false;continue;}
      const p=b.body.position;
      if(!nearPocket(p.x,p.z)){
        if(p.x<minX){p.x=minX;if(p.x===minX&&b.body.velocity.x<0)b.body.velocity.x*=-.55;}
        if(p.x>maxX){p.x=maxX;if(p.x===maxX&&b.body.velocity.x>0)b.body.velocity.x*=-.55;}
        if(p.z<minZ){p.z=minZ;if(p.z===minZ&&b.body.velocity.z<0)b.body.velocity.z*=-.55;}
        if(p.z>maxZ){p.z=maxZ;if(p.z===maxZ&&b.body.velocity.z>0)b.body.velocity.z*=-.55;}
      }
      // Force the sphere center to exactly one radius above the visible felt.
      p.y=surfaceY+r;
      b.body.velocity.y=0;
      if(shadow){
        shadow.visible=true;
        shadow.position.set(p.x,surfaceY+.001,p.z);
      }
    }
    requestAnimationFrame(tick);
  };
  tick();

  rt.statusEl.textContent=`実モデル基準 — Felt ${size.x.toFixed(2)}m × ${size.z.toFixed(2)}m / 実寸球`;
}

// bootstrap8 loads the GLB before returning, so the real model is normally
// available here. One RAF also covers slow mobile scene attachment timing.
hideEmbeddedCue();
if(rt?.realTable)installRealSurfaceGuard();
else requestAnimationFrame(()=>{hideEmbeddedCue();installRealSurfaceGuard();});
