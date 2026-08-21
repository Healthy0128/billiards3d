// v1.0.1 refinement layer over the clean main10 runtime.
// Keeps the clean architecture while adjusting only pocket geometry/animation.
let source=await fetch('./src/main10.js',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw new Error(`main10 ${r.status}`);
  return r.text();
});

source=source.replace("statusEl.textContent='実モデル表示 — native座標 v1.0.0'","statusEl.textContent='実モデル表示 — native座標 v1.0.1'");

// Move capture centers slightly toward the visible pocket mouths in the GLB.
source=source.replace(
`const pocketCenters=[
  [-TABLE_LENGTH/2-.015,-TABLE_WIDTH/2-.015],[0,-TABLE_WIDTH/2-.048],[TABLE_LENGTH/2+.015,-TABLE_WIDTH/2-.015],
  [-TABLE_LENGTH/2-.015,TABLE_WIDTH/2+.015],[0,TABLE_WIDTH/2+.048],[TABLE_LENGTH/2+.015,TABLE_WIDTH/2+.015]
];`,
`const pocketCenters=[
  [-TABLE_LENGTH/2-.006,-TABLE_WIDTH/2-.006],[0,-TABLE_WIDTH/2-.032],[TABLE_LENGTH/2+.006,-TABLE_WIDTH/2-.006],
  [-TABLE_LENGTH/2-.006,TABLE_WIDTH/2+.006],[0,TABLE_WIDTH/2+.032],[TABLE_LENGTH/2+.006,TABLE_WIDTH/2+.006]
];`
);

// A ball should reach the mouth first, then drop. This prevents the sphere from
// visually cutting through the felt while still travelling sideways.
source=source.replace(
"function animatePocketFalls(dt){for(const b of balls){if(!b.falling)continue;b.fallT+=dt;const t=Math.min(1,b.fallT/.34),ease=t*t*(3-2*t);b.mesh.position.lerpVectors(b.fallStart,b.fallPocket,ease);b.mesh.rotation.x+=dt*8;b.mesh.rotation.z+=dt*5;if(t>=1){b.falling=false;b.pocketed=true;b.mesh.visible=false}}}",
`function animatePocketFalls(dt){for(const b of balls){
  if(!b.falling)continue;
  b.fallT+=dt;
  const t=Math.min(1,b.fallT/.42);
  const mouthY=TABLE_Y+BALL_R;
  if(t<.46){
    const u=t/.46,e=u*u*(3-2*u);
    b.mesh.position.x=THREE.MathUtils.lerp(b.fallStart.x,b.fallPocket.x,e);
    b.mesh.position.z=THREE.MathUtils.lerp(b.fallStart.z,b.fallPocket.z,e);
    b.mesh.position.y=mouthY-BA LL_R*.04*e;
  }else{
    const u=(t-.46)/.54,e=u*u*(3-2*u);
    b.mesh.position.x=b.fallPocket.x;
    b.mesh.position.z=b.fallPocket.z;
    b.mesh.position.y=THREE.MathUtils.lerp(mouthY-BALL_R*.04,b.fallPocket.y,e);
  }
  b.mesh.rotation.x+=dt*8;b.mesh.rotation.z+=dt*5;
  if(t>=1){b.falling=false;b.pocketed=true;b.mesh.visible=false}
}}`.replace('BA LL_R','BALL_R')
);

const blob=new Blob([source],{type:'text/javascript'});
const url=URL.createObjectURL(blob);
try{await import(url)}finally{URL.revokeObjectURL(url)}
