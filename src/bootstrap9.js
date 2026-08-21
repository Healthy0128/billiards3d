// Real-dimension compatibility layer for the current bootstrap8 runtime.
// The imported GLB was authored for a 2.7432m x 1.3716m pool table and
// standard 57.15mm-diameter balls. Keep physics and visuals on those dimensions.
let source=await fetch('./src/bootstrap8.js',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw new Error(`bootstrap8 ${r.status}`);
  return r.text();
});

// Do not visually sink balls independently of their physics bodies. Once the
// correct radius is used, the physical sphere can sit directly on the felt.
source=source.replace(
  'const calibration=calibrateBallVisualHeight(model,rt);',
  'const calibration={offset:0};rt.ballVisualOffsetY=0;'
);

// Keep ball centers inside the playable cushion area except at a real pocket.
source=source.replace(
  'const limitX=table.w/2+table.rail*.72,limitZ=table.h/2+table.rail*.72;',
  'const limitX=table.w/2-ballR-.012,limitZ=table.h/2-ballR-.012;'
);
source=source.replace(
  'if(nearest&&best<.24){startPocketFall(b,nearest[0],nearest[1]);return true}',
  'if(nearest&&best<Math.max(pocketR*1.18,.075)){startPocketFall(b,nearest[0],nearest[1]);return true}'
);
source=source.replaceAll('v.x*=-.52','v.x*=-.38');
source=source.replaceAll('v.z*=-.52','v.z*=-.38');

// Inject final changes into the already-patched main7 source immediately before
// bootstrap8 turns it into a module. This avoids breaking bootstrap8's exact
// match against the original main7 constants.
source=source.replace(
  "  const blob=new Blob([source],{type:'text/javascript'});",
  `  source=source.replace(
    "const table={w:2.84,h:1.42,y:.78,rail:.115},ballR=.05715,pocketR=.098,balls=[],rails=[];window.__billiardsRuntime={scene,THREE,table,statusEl,camera,ballVisualOffsetY:0};",
    "const table={w:2.7432,h:1.3716,y:.78,rail:.09},ballR=.028575,pocketR=.065,balls=[],rails=[];window.__billiardsRuntime={scene,THREE,table,statusEl,camera,ballVisualOffsetY:0};"
  );
  source=source.replace("const gap=.20;","const gap=.05;");
  source=source.replace(
    "const gltf=await new GLTFLoader().loadAsync(REAL_TABLE_URL);const model=gltf.scene;const info=alignRealTable(model,rt);",
    "const gltf=await new GLTFLoader().loadAsync(REAL_TABLE_URL);const model=gltf.scene;const modelCue=model.getObjectByName('Cue');if(modelCue)modelCue.visible=false;const info=alignRealTable(model,rt);"
  );
  const blob=new Blob([source],{type:'text/javascript'});`
);

const blob=new Blob([source],{type:'text/javascript'});
const url=URL.createObjectURL(blob);
try{await import(url)}finally{URL.revokeObjectURL(url)}

const rt=window.__billiardsRuntime;
if(rt?.realTable)rt.statusEl.textContent='実モデル表示 — 実寸57.15mm球・透明物理壁';
