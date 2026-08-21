const $=s=>document.querySelector(s);
const body=document.body;
const phaseSteps=[...document.querySelectorAll('.phase-step')];
const statusEl=$('#status');
const cameraBtn=$('#cameraBtn');
const stanceBtn=$('#stanceBtn');
const nextViewBtn=$('#nextViewBtn');
const prevViewBtn=$('#prevViewBtn');
const toPullBtn=$('#toPullBtn');
const backToViewBtn=$('#backToViewBtn');
const cancelPullBtn=$('#cancelPullBtn');
const pullTrack=$('#pullTrack');
const pullHandle=$('#pullHandle');
const pullFill=$('#pullFill');
const pullPowerText=$('#pullPowerText');
const powerControl=$('#powerControl');
const shootBtn=$('#shootBtn');
const shotFlash=$('#shotFlash');
const ballInHandBtn=$('#ballInHandBtn');

let phase='view';
let cameraState=0; // main6 starts in follow-camera state. 0=follow, 1/2/3=browse presets.
let pulling=false;
let pullPointer=null;
let pullPower=0;

function setPhase(next){
  phase=next;
  body.dataset.phase=next;
  phaseSteps.forEach(el=>el.classList.toggle('active',el.dataset.step===next));
  if(next==='view') statusEl.textContent='盤面を見て、打ちたい方向を決めます';
  if(next==='aim') statusEl.textContent='構えました。照準と撞点を合わせます';
  if(next==='pull') statusEl.textContent='キューを下へ引き、離すと打ちます';
  if(next==='shot') statusEl.textContent='SHOT';
}

function clickCamera(){
  cameraBtn?.click();
  cameraState=(cameraState+1)%4;
}

function ensureBrowseCamera(){
  if(cameraState===0) clickCamera();
}

function ensureStanceCamera(){
  let guard=0;
  while(cameraState!==0&&guard++<4) clickCamera();
}

function nextView(){
  if(phase!=='view')return;
  ensureBrowseCamera();
  clickCamera();
  if(cameraState===0) clickCamera();
}

function prevView(){
  if(phase!=='view')return;
  ensureBrowseCamera();
  // Main camera button only cycles forward; three forward clicks equals one step back.
  for(let i=0;i<3;i++) clickCamera();
  if(cameraState===0) clickCamera();
}

nextViewBtn?.addEventListener('click',nextView);
prevViewBtn?.addEventListener('click',prevView);
stanceBtn?.addEventListener('click',()=>{
  ensureStanceCamera();
  setPhase('aim');
});
backToViewBtn?.addEventListener('click',()=>{
  ensureBrowseCamera();
  setPhase('view');
});
toPullBtn?.addEventListener('click',()=>{
  pullPower=0;
  renderPull();
  setPhase('pull');
});
cancelPullBtn?.addEventListener('click',()=>setPhase('aim'));

function renderPull(){
  const minY=30;
  const maxY=Math.max(minY+1,pullTrack.clientHeight-30);
  const y=minY+(maxY-minY)*(pullPower/100);
  pullHandle.style.top=`${y}px`;
  pullFill.style.top=`${minY}px`;
  pullFill.style.height=`${Math.max(0,y-minY)}px`;
  pullPowerText.textContent=`${Math.round(pullPower)}%`;
}

function updatePullFromPointer(e){
  const r=pullTrack.getBoundingClientRect();
  const minY=30;
  const maxY=Math.max(minY+1,r.height-30);
  const y=Math.min(maxY,Math.max(minY,e.clientY-r.top));
  pullPower=(y-minY)/(maxY-minY)*100;
  renderPull();
}

pullTrack?.addEventListener('pointerdown',e=>{
  if(phase!=='pull')return;
  pulling=true;
  pullPointer=e.pointerId;
  pullTrack.setPointerCapture(e.pointerId);
  updatePullFromPointer(e);
});
pullTrack?.addEventListener('pointermove',e=>{
  if(!pulling||e.pointerId!==pullPointer)return;
  updatePullFromPointer(e);
});
function releaseShot(e){
  if(!pulling)return;
  if(e&&e.pointerId!==pullPointer)return;
  pulling=false;
  pullPointer=null;
  const p=Math.max(4,Math.round(pullPower));
  powerControl.value=String(p);
  powerControl.dispatchEvent(new Event('input',{bubbles:true}));
  setPhase('shot');
  shotFlash.classList.add('show');
  setTimeout(()=>shotFlash.classList.remove('show'),260);
  shootBtn.click();
  if(navigator.vibrate) navigator.vibrate(18);
  setTimeout(()=>{
    ensureBrowseCamera();
    setPhase('view');
    pullPower=0;
    renderPull();
  },420);
}
pullTrack?.addEventListener('pointerup',releaseShot);
pullTrack?.addEventListener('pointercancel',()=>{
  pulling=false;
  pullPointer=null;
});

// In VIEW phase the canvas is for looking, not aiming. A horizontal swipe cycles browse cameras.
let canvasStart=null;
const canvas=$('#game');
canvas?.addEventListener('pointerdown',e=>{
  if(phase!=='view'||!ballInHandBtn.classList.contains('hidden'))return;
  canvasStart={x:e.clientX,y:e.clientY};
},{capture:true});
canvas?.addEventListener('pointerup',e=>{
  if(phase!=='view'||!canvasStart||!ballInHandBtn.classList.contains('hidden'))return;
  const dx=e.clientX-canvasStart.x,dy=e.clientY-canvasStart.y;
  canvasStart=null;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.25){
    dx>0?prevView():nextView();
  }
},{capture:true});

// Keep ball-in-hand usable regardless of the shot-flow phase.
const observer=new MutationObserver(()=>{
  const active=!ballInHandBtn.classList.contains('hidden');
  if(active){
    ensureBrowseCamera();
    setPhase('view');
    statusEl.textContent='ボールインハンド：盤上をタップして手球を置き、「手球位置を確定」';
  }
});
observer.observe(ballInHandBtn,{attributes:true,attributeFilter:['class']});

window.addEventListener('resize',renderPull);
ensureBrowseCamera();
setPhase('view');
renderPull();
