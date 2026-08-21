import * as THREE from 'https://esm.sh/three@0.181.1';
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
import { OBJLoader } from 'https://esm.sh/three@0.181.1/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://esm.sh/three@0.181.1/examples/jsm/loaders/MTLLoader.js';

const SOURCE='./src/main7.js';
const ASSET_ZIP='https://opengameart.org/sites/default/files/Pool-table.zip';

async function bootGame(){
  let source=await fetch(SOURCE,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`main7 ${r.status}`);return r.text()});
  source=source.replace(
    "import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js';",
    "import * as THREE from 'https://esm.sh/three@0.181.1';"
  );
  source=source.replace(
    "const table={w:2.84,h:1.42,y:.78,rail:.115},ballR=.05715,pocketR=.098,balls=[],rails=[];",
    "const table={w:2.84,h:1.42,y:.78,rail:.115},ballR=.05715,pocketR=.098,balls=[],rails=[];window.__billiardsRuntime={scene,THREE,table,statusEl};"
  );
  source=source.replace(
    "const wood=0x4b2412,wood2=0x2f160c,metal=0x8a785c,felt=0x0a6246;",
    "const proceduralTable=new THREE.Group();scene.add(proceduralTable);window.__billiardsRuntime.tableVisual=proceduralTable;const wood=0x4b2412,wood2=0x2f160c,metal=0x8a785c,felt=0x0a6246;"
  );
  const swaps=[
    ['scene.add(apron);','proceduralTable.add(apron);'],
    ['scene.add(slate);','proceduralTable.add(slate);'],
    ['scene.add(cloth);','proceduralTable.add(cloth);'],
    ['scene.add(leg);','proceduralTable.add(leg);'],
    ['scene.add(foot);','proceduralTable.add(foot);'],
    ['scene.add(m);const cap=','proceduralTable.add(m);const cap='],
    ['scene.add(cap);const b=','proceduralTable.add(cap);const b='],
    ['scene.add(cup);','proceduralTable.add(cup);'],
    ['scene.add(ring);','proceduralTable.add(ring);'],
    ['scene.add(d)}','proceduralTable.add(d)}']
  ];
  for(const [a,b] of swaps)source=source.replaceAll(a,b);
  source=source.replaceAll('sleepSpeedLimit:.02,sleepTimeLimit:.7','sleepSpeedLimit:.055,sleepTimeLimit:.28');
  source=source.replace(
    "function cueBall(){return balls.find(b=>b.n===0&&!b.pocketed&&!b.falling)}function allStopped(){return balls.every(b=>b.pocketed||b.falling||b.body.velocity.length()<.045)}",
    "function cueBall(){return balls.find(b=>b.n===0&&!b.pocketed&&!b.falling)}function allStopped(){return balls.every(b=>b.pocketed||b.falling||Math.hypot(b.body.velocity.x,b.body.velocity.z)<.055)}"
  );
  source=source.replace(
    "let last=performance.now(),acc=0,wasMoving=false;const fixed=1/120;",
    `function applyRollingResistance(b,dt){\n  const v=b.body.velocity;const s=Math.hypot(v.x,v.z);\n  if(s<.055){v.x=0;v.z=0;if(Math.abs(v.y)<.03)v.y=0;const w=b.body.angularVelocity;if(w.length()<1.15)w.setZero();return;}\n  const decel=s>1.6?.15:s>.8?.20:s>.35?.28:s>.14?.42:.62;\n  const next=Math.max(0,s-decel*dt),k=next/s;v.x*=k;v.z*=k;\n  const spinKeep=Math.max(0,1-(s<.22?1.8:.5)*dt);b.body.angularVelocity.x*=spinKeep;b.body.angularVelocity.z*=spinKeep;\n  if(next<.055){v.x=0;v.z=0;}if(Math.abs(v.y)<.025)v.y=0;\n}\nlet last=performance.now(),acc=0,wasMoving=false;const fixed=1/120;`
  );
  source=source.replace(
    "const v=b.body.velocity,s=Math.hypot(v.x,v.z);if(s<.01){v.x=v.z=0}else{const rr=Math.max(0,1-.23*fixed);v.x*=rr;v.z*=rr}if(Math.abs(v.y)<.025)v.y=0",
    "applyRollingResistance(b,fixed)"
  );
  const blob=new Blob([source],{type:'text/javascript'});
  const url=URL.createObjectURL(blob);
  try{await import(url)}finally{URL.revokeObjectURL(url)}
}

function basename(path){return path.split('/').pop().toLowerCase()}

async function loadRealTable(){
  const rt=window.__billiardsRuntime;if(!rt)return;
  try{
    rt.statusEl.textContent='実物モデルのビリヤード台を読み込み中…';
    const res=await fetch(ASSET_ZIP,{mode:'cors'});if(!res.ok)throw new Error(`asset ${res.status}`);
    const zip=await JSZip.loadAsync(await res.arrayBuffer());
    const entries=Object.values(zip.files).filter(f=>!f.dir);
    const objEntry=entries.find(f=>/\.obj$/i.test(f.name));if(!objEntry)throw new Error('OBJ not found');
    const mtlEntry=entries.find(f=>/\.mtl$/i.test(f.name));
    const blobUrls=new Map();
    for(const entry of entries){
      if(/\.(png|jpe?g|bmp|gif)$/i.test(entry.name)){
        const data=await entry.async('blob');blobUrls.set(basename(entry.name),URL.createObjectURL(data));
      }
    }
    let materials=null;
    if(mtlEntry){
      let mtl=await mtlEntry.async('text');
      for(const [name,url] of blobUrls)mtl=mtl.replaceAll(name,url);
      materials=new MTLLoader().parse(mtl,'');materials.preload();
    }
    const loader=new OBJLoader();if(materials)loader.setMaterials(materials);
    const model=loader.parse(await objEntry.async('text'));
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(!materials)o.material=new THREE.MeshStandardMaterial({color:0x4b2918,roughness:.42})}});
    model.updateMatrixWorld(true);
    let box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
    const dims=[size.x,size.y,size.z];const minAxis=dims.indexOf(Math.min(...dims));
    if(minAxis===2){model.rotation.x=-Math.PI/2;model.updateMatrixWorld(true)}
    box=new THREE.Box3().setFromObject(model);size=box.getSize(new THREE.Vector3());
    if(size.z>size.x){model.rotation.y+=Math.PI/2;model.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(model);size=box.getSize(new THREE.Vector3())}
    const targetLength=rt.table.w+rt.table.rail*2.4;model.scale.multiplyScalar(targetLength/Math.max(size.x,size.z));model.updateMatrixWorld(true);
    box=new THREE.Box3().setFromObject(model);const center=box.getCenter(new THREE.Vector3());model.position.x-=center.x;model.position.z-=center.z;model.position.y+=rt.table.y+.245-box.max.y;model.updateMatrixWorld(true);
    rt.scene.add(model);rt.tableVisual.visible=false;rt.realTable=model;
    rt.statusEl.textContent='実物モデル台を使用中 — 盤面を自由に見てから構えます';
    window.addEventListener('beforeunload',()=>{for(const url of blobUrls.values())URL.revokeObjectURL(url)},{once:true});
  }catch(err){
    console.warn('CC0 pool-table asset load failed; using built-in fallback.',err);
    rt.tableVisual.visible=true;rt.statusEl.textContent='台モデルを読み込めなかったため内蔵台を使用中';
  }
}

await bootGame();
await loadRealTable();
