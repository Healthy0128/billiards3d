// Stability/visual alignment hotfix layer for the current bootstrap8 runtime.
// This keeps the working game intact while correcting real-table contact height
// and constraining ball centers to the playable cushion area.
let source=await fetch('./src/bootstrap8.js',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw new Error(`bootstrap8 ${r.status}`);
  return r.text();
});

// The previous ray-based calibration can hit a non-playing submesh of the GLB.
// Use a small, deterministic visual sink instead. Physics Y is left untouched.
source=source.replace(
  'const calibration=calibrateBallVisualHeight(model,rt);',
  'const calibration={offset:.016};rt.ballVisualOffsetY=.016;'
);

// The old emergency bounds were outside the wooden rails, so a fast ball could
// visibly ride onto the rail before being recovered. Keep ball CENTERS inside
// the cushion line, except when they are genuinely entering one of six pockets.
source=source.replace(
  'const limitX=table.w/2+table.rail*.72,limitZ=table.h/2+table.rail*.72;',
  'const limitX=table.w/2-ballR-.018,limitZ=table.h/2-ballR-.018;'
);
source=source.replace(
  'if(nearest&&best<.24){startPocketFall(b,nearest[0],nearest[1]);return true}',
  'if(nearest&&best<.145){startPocketFall(b,nearest[0],nearest[1]);return true}'
);

// Make the fallback reflection less springy when the safety boundary catches a
// tunnelling ball. Normal cushion collisions are still handled by Cannon.
source=source.replaceAll('v.x*=-.52','v.x*=-.38');
source=source.replaceAll('v.z*=-.52','v.z*=-.38');

const blob=new Blob([source],{type:'text/javascript'});
const url=URL.createObjectURL(blob);
try{await import(url)}finally{URL.revokeObjectURL(url)}
