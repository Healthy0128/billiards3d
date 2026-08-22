// v1.3.3 gameplay assist: target marker, auto aim, right-hand cue-eye camera, top view, cushion guide.
function waitForRuntime(){return new Promise(resolve=>{const check=()=>{const rt=window.__billiardsRuntime;if(rt?.scene&&rt?.getBalls&&rt?.onFrame){resolve(rt);return}setTimeout(check,25)};check()})}
const rt=await waitForRuntime();
const {THREE,scene,camera,table}=rt,ballR=rt.ballR||.028575;
const NORMAL_FOV=43,STANCE_FOV=55;

function groupOf(n){return n>=1&&n<=7?'solid':n>=9&&n<=15?'stripe':null}
function distanceToCue(b,c){return Math.hypot(b.body.position.x-c.body.position.x,b.body.position.z-c.body.position.z)}
function nearestOf(list,cue){return list.length?[...list].sort((a,b)=>distanceToCue(a,cue)-distanceToCue(b,cue))[0]:null}
function currentGame(){if(rt.getGameType)return rt.getGameType();const m=rt.getMode?.()||'practice';return m==='two9'?'9ball':m==='two8'?'8ball':'practice'}
function chooseTarget(){
  const cue=rt.getCueBall?.();if(!cue)return null;
  const live=rt.getBalls().filter(b=>b.n!==0&&!b.pocketed&&!b.falling&&b.mesh?.visible!==false);if(!live.length)return null;
  const game=currentGame();
  if(game==='9ball')return live.filter(b=>b.n>=1&&b.n<=9).sort((a,b)=>a.n-b.n)[0]||null;
  if(game==='8ball'){
    const player=rt.getCurrentPlayer?.()||0,groups=rt.getGroups?.()||[null,null],group=groups[player];
    if(group){const legal=live.filter(b=>groupOf(b.n)===group);if(legal.length)return nearestOf(legal,cue);return live.find(b=>b.n===8)||null}
    return nearestOf(live.filter(b=>b.n!==8),cue)||live.find(b=>b.n===8)||null;
  }
  return nearestOf(live,cue);
}

function makeTargetTexture(){const cv=document.createElement('canvas');cv.width=cv.height=160;const g=cv.getContext('2d');g.beginPath();g.moveTo(80,138);g.lineTo(43,67);g.quadraticCurveTo(39,58,51,58);g.lineTo(109,58);g.quadraticCurveTo(121,58,117,67);g.closePath();g.fillStyle='rgba(60,220,255,.97)';g.fill();g.lineWidth=7;g.strokeStyle='rgba(3,24,30,.9)';g.stroke();g.font='900 28px system-ui,-apple-system,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#071318';g.fillText('NEXT',80,84);return new THREE.CanvasTexture(cv)}
const targetMarker=new THREE.Sprite(new THREE.SpriteMaterial({map:makeTargetTexture(),transparent:true,depthTest:false,depthWrite:false,opacity:.97}));targetMarker.scale.set(.16,.16,1);targetMarker.renderOrder=1000;targetMarker.visible=false;scene.add(targetMarker);

function autoAimToTarget(){const cue=rt.getCueBall?.(),target=chooseTarget();if(!cue||!target||rt.isGameOver?.())return false;const dx=target.body.position.x-cue.body.position.x,dz=target.body.position.z-cue.body.position.z;if(Math.hypot(dx,dz)<.0001)return false;rt.setAimAngle?.(Math.atan2(dz,dx));return true}

let lockedAimAngle=null;
const stanceBtn=document.querySelector('#stanceBtn');
stanceBtn?.addEventListener('click',()=>{autoAimToTarget();lockedAimAngle=rt.getAimAngle?.()??0});

const fineAim=document.querySelector('#fineAim'),topBtn=document.createElement('button');
topBtn.id='topViewBtn';topBtn.type='button';topBtn.textContent='TOP VIEW';topBtn.setAttribute('aria-pressed','false');Object.assign(topBtn.style,{minWidth:'78px',padding:'7px 9px',borderRadius:'10px',font:'800 10px system-ui,-apple-system,sans-serif',letterSpacing:'.04em',whiteSpace:'nowrap'});fineAim?.appendChild(topBtn);
let topActive=false;const aimPhase=()=>['aim','pull'].includes(document.body.dataset.phase);
function updateTopButton(){topBtn.style.display=aimPhase()?'inline-flex':'none';topBtn.style.alignItems='center';topBtn.style.justifyContent='center';topBtn.setAttribute('aria-pressed',String(topActive));topBtn.textContent=topActive?'NORMAL':'TOP VIEW'}
function setTop(active){topActive=!!active&&aimPhase();if(!topActive&&aimPhase())lockedAimAngle=rt.getAimAngle?.()??lockedAimAngle??0;updateTopButton()}
topBtn.addEventListener('click',()=>setTop(!topActive));
new MutationObserver(()=>{if(!aimPhase()){topActive=false;lockedAimAngle=null}updateTopButton()}).observe(document.body,{attributes:true,attributeFilter:['data-phase']});updateTopButton();

function setFov(value){if(Math.abs(camera.fov-value)<.01)return;camera.fov=value;camera.updateProjectionMatrix()}
function forceTopCamera(){if(!topActive||!aimPhase())return;setFov(NORMAL_FOV);const portrait=innerHeight>innerWidth;camera.up.set(portrait?1:0,0,portrait?0:-1);camera.position.set(0,table.y+(portrait?4.15:3.35),.0001);camera.lookAt(0,table.y,0)}
function forceCueEyeCamera(){
  if(topActive||!aimPhase())return;
  const cue=rt.getCueBall?.();if(!cue)return;
  if(lockedAimAngle==null)lockedAimAngle=rt.getAimAngle?.()??0;
  const a=lockedAimAngle,dx=Math.cos(a),dz=Math.sin(a),p=cue.body.position;
  const rightX=-dz,rightZ=dx;
  setFov(STANCE_FOV);
  camera.up.set(0,1,0);
  // Right-handed player view: camera sits near the cue-holding hand, slightly right of the shaft.
  camera.position.set(
    p.x-dx*.62+rightX*.14,
    table.y+ballR+.22,
    p.z-dz*.62+rightZ*.14
  );
  // Keep the sight line through the cue ball, while showing more table around it.
  camera.lookAt(p.x+dx*.24,table.y+ballR*.74,p.z+dz*.24);
}

const coreGuide=scene.children.find(o=>o.isLine&&o.material?.isLineDashedMaterial)||null;
const bounceGuide=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0x8fe8ff,dashSize:.065,gapSize:.035,transparent:true,opacity:.88}));bounceGuide.visible=false;bounceGuide.renderOrder=998;scene.add(bounceGuide);
function rayBallHit(ox,oz,dx,dz){let best=Infinity;for(const b of rt.getBalls()){if(b.pocketed||b.falling||b.n===0)continue;const rx=b.body.position.x-ox,rz=b.body.position.z-oz,t=rx*dx+rz*dz;if(t<=.004)continue;const p2=rx*rx+rz*rz-t*t,rr=(ballR*2.02)**2;if(p2>rr)continue;const hit=t-Math.sqrt(Math.max(0,rr-p2));if(hit>.004&&hit<best)best=hit}return best}
function rayWallHit(ox,oz,dx,dz){const maxX=table.w/2-ballR-.003,maxZ=table.h/2-ballR-.003;let tx=Infinity,tz=Infinity;if(dx>.00001)tx=(maxX-ox)/dx;else if(dx<-.00001)tx=(-maxX-ox)/dx;if(dz>.00001)tz=(maxZ-oz)/dz;else if(dz<-.00001)tz=(-maxZ-oz)/dz;if(tx<=.002)tx=Infinity;if(tz<=.002)tz=Infinity;const t=Math.min(tx,tz);return Number.isFinite(t)?{t,hitX:Math.abs(tx-t)<.002,hitZ:Math.abs(tz-t)<.002}:null}
function isPocketMouth(x,z){const hx=table.w/2,hz=table.h/2;return(Math.abs(x)>hx-.115&&Math.abs(z)>hz-.115)||(Math.abs(x)<.105&&Math.abs(z)>hz-.11)}
function updateCushionGuide(){bounceGuide.visible=false;if(!coreGuide||!coreGuide.visible||!aimPhase())return;const cue=rt.getCueBall?.();if(!cue)return;const ox=cue.body.position.x,oz=cue.body.position.z,a=rt.getAimAngle?.()||0,dx=Math.cos(a),dz=Math.sin(a),wall=rayWallHit(ox,oz,dx,dz);if(!wall)return;const firstBall=rayBallHit(ox,oz,dx,dz);if(firstBall<wall.t)return;const y=table.y+ballR+.008,wx=ox+dx*wall.t,wz=oz+dz*wall.t;coreGuide.geometry.setFromPoints([new THREE.Vector3(ox,y,oz),new THREE.Vector3(wx,y,wz)]);coreGuide.computeLineDistances?.();if(isPocketMouth(wx,wz))return;let rdx=dx,rdz=dz;if(wall.hitX)rdx=-rdx;if(wall.hitZ)rdz=-rdz;const sx=wx+rdx*.004,sz=wz+rdz*.004,nextWall=rayWallHit(sx,sz,rdx,rdz),nextBall=rayBallHit(sx,sz,rdx,rdz);let len=2.8;if(nextWall)len=Math.min(len,nextWall.t);if(Number.isFinite(nextBall))len=Math.min(len,nextBall);if(len<.015)return;bounceGuide.geometry.setFromPoints([new THREE.Vector3(wx,y,wz),new THREE.Vector3(wx+rdx*len,y,wz+rdz*len)]);bounceGuide.computeLineDistances();bounceGuide.visible=true}

rt.onFrame(()=>{
  const target=chooseTarget();
  if(target&&!rt.isGameOver?.()){const p=target.mesh?.position||target.body?.position;if(p){targetMarker.position.set(p.x,p.y+ballR*4.2,p.z);targetMarker.visible=true}}else targetMarker.visible=false;
  updateCushionGuide();
  if(topActive)forceTopCamera();
  else if(aimPhase())forceCueEyeCamera();
  else setFov(NORMAL_FOV);
});
window.__billiardsGameplayAssist={targetMarker,bounceGuide,topButton:topBtn,chooseTarget,autoAimToTarget,isTopView:()=>topActive,setTopView:setTop};
