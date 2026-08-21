import { GLTFLoader } from 'https://esm.sh/three@0.181.1/examples/jsm/loaders/GLTFLoader.js';

const SOURCE='./src/main7.js';
const REAL_TABLE_URL='https://cdn.jsdelivr.net/gh/elijah-atkins/Billiards@main/assets/pool-table/pool-table.glb';

async function bootGame(){
  let source=await fetch(SOURCE,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`main7 ${r.status}`);return r.text()});
  source=source.replace("import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js';","import * as THREE from 'https://esm.sh/three@0.181.1';");
  source=source.replace("const table={w:2.84,h:1.42,y:.78,rail:.115},ballR=.05715,pocketR=.098,balls=[],rails=[];","const table={w:2.84,h:1.42,y:.78,rail:.115},ballR=.05715,pocketR=.098,balls=[],rails=[];window.__billiardsRuntime={scene,THREE,table,statusEl,camera};");
  source=source.replace("const wood=0x4b2412,wood2=0x2f160c,metal=0x8a785c,felt=0x0a6246;","const proceduralTable=new THREE.Group();scene.add(proceduralTable);window.__billiardsRuntime.tableVisual=proceduralTable;const wood=0x4b2412,wood2=0x2f160c,metal=0x8a785c,felt=0x0a6246;");
  const swaps=[['scene.add(apron);','proceduralTable.add(apron);'],['scene.add(slate);','proceduralTable.add(slate);'],['scene.add(cloth);','proceduralTable.add(cloth);'],['scene.add(leg);','proceduralTable.add(leg);'],['scene.add(foot);','proceduralTable.add(foot);'],['scene.add(m);const cap=','proceduralTable.add(m);const cap='],['scene.add(cap);const b=','proceduralTable.add(cap);const b='],['scene.add(cup);','proceduralTable.add(cup);'],['scene.add(ring);','proceduralTable.add(ring);'],['scene.add(d)}','proceduralTable.add(d)}']];
  for(const [a,b] of swaps)source=source.replaceAll(a,b);

  source=source.replaceAll('table.y+.055+ballR','table.y+.027+ballR');
  source=source.replace('impulse=.72+p*4.35','impulse=.20+p*1.35');
  source=source.replaceAll('sleepSpeedLimit:.02,sleepTimeLimit:.7','sleepSpeedLimit:.055,sleepTimeLimit:.18');
  source=source.replace("function cueBall(){return balls.find(b=>b.n===0&&!b.pocketed&&!b.falling)}function allStopped(){return balls.every(b=>b.pocketed||b.falling||b.body.velocity.length()<.045)}","function cueBall(){return balls.find(b=>b.n===0&&!b.pocketed&&!b.falling)}function allStopped(){return balls.every(b=>b.pocketed||b.falling||Math.hypot(b.body.velocity.x,b.body.velocity.z)<.055)}");
  source=source.replace(
    "let aimAngle=0,spinX=0,spinY=0,cueAnim=0,aimDragging=false,aimStartX=0,aimStartAngle=0;",
    `let aimAngle=0,spinX=0,spinY=0,cueAnim=0,aimDragging=false,aimStartX=0,aimStartAngle=0;\nwindow.__billiardsRuntime.aimFromScreenPull=(dx,dy)=>{\n  const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0);right.y=0;if(right.lengthSq()<1e-6)right.set(1,0,0);right.normalize();\n  const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;if(forward.lengthSq()<1e-6)forward.set(0,0,-1);forward.normalize();\n  const dir=right.multiplyScalar(-dx).add(forward.multiplyScalar(dy));\n  if(dir.lengthSq()>1e-5){dir.normalize();aimAngle=Math.atan2(dir.z,dir.x);updateAim();}\n};\nwindow.__billiardsRuntime.setAimAngle=a=>{aimAngle=a;updateAim()};\nwindow.__billiardsRuntime.getAimAngle=()=>aimAngle;`
  );
  source=source.replace("let last=performance.now(),acc=0,wasMoving=false;const fixed=1/120;",`function applyRollingResistance(b,dt){\n  const v=b.body.velocity;const s=Math.hypot(v.x,v.z);const w=b.body.angularVelocity;\n  const restY=table.y+0.027+ballR;\n  if(Math.abs(b.body.position.y-restY)<0.12){b.body.position.y=restY;v.y=0;}\n  if(s<0.055){v.x=0;v.z=0;v.y=0;w.setZero();b.body.position.y=restY;b.body.sleep();return;}\n  const decel=s>1.6?0.15:s>0.8?0.20:s>0.35?0.28:s>0.14?0.42:0.68;\n  const next=Math.max(0,s-decel*dt),k=next/s;v.x*=k;v.z*=k;\n  const spinDrag=s<0.12?5.5:s<0.22?2.8:0.7;const spinKeep=Math.max(0,1-spinDrag*dt);\n  w.x*=spinKeep;w.y*=spinKeep;w.z*=spinKeep;\n  if(next<0.055){v.x=0;v.z=0;v.y=0;w.setZero();b.body.position.y=restY;b.body.sleep();}\n}\nlet last=performance.now(),acc=0,wasMoving=false;const fixed=1/120;`);
  source=source.replace("const v=b.body.velocity,s=Math.hypot(v.x,v.z);if(s<.01){v.x=v.z=0}else{const rr=Math.max(0,1-.23*fixed);v.x*=rr;v.z*=rr}if(Math.abs(v.y)<.025)v.y=0","applyRollingResistance(b,fixed)");
  const blob=new Blob([source],{type:'text/javascript'});const url=URL.createObjectURL(blob);try{await import(url)}finally{URL.revokeObjectURL(url)}
  const rt=window.__billiardsRuntime;if(rt){rt.tableVisual.visible=true;rt.statusEl.textContent='実モデルのビリヤード台を読み込み中…';}
}

async function loadRealTable(){
  const rt=window.__billiardsRuntime;if(!rt)return;
  try{
    const gltf=await new GLTFLoader().loadAsync(REAL_TABLE_URL);
    const model=gltf.scene;
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    model.updateMatrixWorld(true);
    let box=new rt.THREE.Box3().setFromObject(model),size=box.getSize(new rt.THREE.Vector3());
    if(size.z>size.x){model.rotation.y+=Math.PI/2;model.updateMatrixWorld(true);box=new rt.THREE.Box3().setFromObject(model);size=box.getSize(new rt.THREE.Vector3());}
    const targetLength=rt.table.w+rt.table.rail*2.45;
    const horizontalLength=Math.max(size.x,size.z);
    if(horizontalLength>0)model.scale.multiplyScalar(targetLength/horizontalLength);
    model.updateMatrixWorld(true);
    box=new rt.THREE.Box3().setFromObject(model);
    const center=box.getCenter(new rt.THREE.Vector3());
    model.position.x-=center.x;model.position.z-=center.z;
    model.position.y+=rt.table.y+0.25-box.max.y;
    model.updateMatrixWorld(true);
    rt.scene.add(model);rt.realTable=model;rt.tableVisual.visible=false;
    rt.statusEl.textContent='実モデル台を使用中 — 盤面を自由に見てから構えます';
  }catch(err){
    console.warn('Real GLB pool-table load failed; using built-in fallback.',err);
    rt.tableVisual.visible=true;
    rt.statusEl.textContent='盤面を自由に見てから構えます';
  }
}

await bootGame();
await loadRealTable();
