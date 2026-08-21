import * as THREE from 'https://esm.sh/three@0.181.1';

function waitForRuntime(){
  return new Promise(resolve=>{
    const check=()=>{
      const rt=window.__billiardsRuntime;
      if(rt?.scene&&rt?.getCueBall){resolve(rt);return;}
      setTimeout(check,25);
    };
    check();
  });
}

const rt=await waitForRuntime();

const cv=document.createElement('canvas');
cv.width=cv.height=128;
const g=cv.getContext('2d');
g.beginPath();
g.moveTo(64,106);
g.lineTo(34,48);
g.quadraticCurveTo(31,42,40,42);
g.lineTo(88,42);
g.quadraticCurveTo(97,42,94,48);
g.closePath();
g.fillStyle='rgba(255,210,70,.94)';
g.fill();
g.lineWidth=5;
g.strokeStyle='rgba(20,15,5,.74)';
g.stroke();

const tex=new THREE.CanvasTexture(cv);
tex.colorSpace=THREE.SRGBColorSpace;
const marker=new THREE.Sprite(new THREE.SpriteMaterial({
  map:tex,
  transparent:true,
  depthTest:false,
  depthWrite:false,
  opacity:.95
}));
marker.scale.set(.105,.105,1);
marker.renderOrder=999;
rt.scene.add(marker);

function updateMarker(){
  const cb=rt.getCueBall?.();
  if(cb&&!cb.pocketed&&!cb.falling&&cb.mesh?.visible!==false){
    const p=cb.mesh?.position||cb.body?.position;
    if(p){
      const r=rt.ballR||.028575;
      marker.position.set(p.x,p.y+r*3.5,p.z);
      marker.visible=true;
      return;
    }
  }
  marker.visible=false;
}

// v1.1+ uses the game's single RAF. Keep a fallback for old builds only.
if(typeof rt.onFrame==='function'){
  rt.onFrame(updateMarker);
  updateMarker();
}else{
  const tick=()=>{updateMarker();requestAnimationFrame(tick);};
  tick();
}

window.__billiardsCueMarker=marker;
