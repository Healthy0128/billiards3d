const $=s=>document.querySelector(s);
const body=document.body;
const phaseSteps=[...document.querySelectorAll('.phase-step')];
const statusEl=$('#status'),stanceBtn=$('#stanceBtn'),toPullBtn=$('#toPullBtn'),backToViewBtn=$('#backToViewBtn'),cancelPullBtn=$('#cancelPullBtn');
const pullPanel=$('#pullPanel'),pullTrack=$('#pullTrack'),pullPowerText=$('#pullPowerText'),powerControl=$('#powerControl'),shootBtn=$('#shootBtn'),shotFlash=$('#shotFlash'),canvas=$('#game');
const ballInHandBtn=$('#ballInHandBtn'),modeBtn=$('#modeBtn'),resetBtn=$('#resetBtn');
let phase='view',pulling=false,pullPointer=null,pullPower=0,pullStart=null,lastPull=null;

function cameraBrowse(){window.billiardsCamera?.browse?.()}
function cameraStance(){window.billiardsCamera?.stance?.()}
function setPhase(next){
  phase=next;body.dataset.phase=next;
  phaseSteps.forEach(el=>el.classList.toggle('active',el.dataset.step===next));
  if(next==='view')statusEl.textContent='盤面を自由に見て、打ちたい方向を決めます';
  if(next==='aim')statusEl.textContent='構えました。盤面を引っ張って、離すと打ちます';
  if(next==='pull')statusEl.textContent='引いた反対方向へ打ちます。距離がパワーです';
  if(next==='shot')statusEl.textContent='SHOT';
}

stanceBtn?.addEventListener('click',()=>{cameraStance();setPhase('aim')});
backToViewBtn?.addEventListener('click',()=>{cameraBrowse();setPhase('view')});
if(toPullBtn)toPullBtn.style.display='none';
if(pullPanel){pullPanel.style.pointerEvents='none';pullPanel.style.opacity='0';}
cancelPullBtn?.addEventListener('click',()=>setPhase('aim'));

const sling=document.createElement('div');
sling.id='slingGuide';
sling.innerHTML='<div class="sling-line"></div><div class="sling-origin"></div><div class="sling-handle"></div><div class="sling-power">0%</div>';
Object.assign(sling.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'35',display:'none'});
const line=sling.querySelector('.sling-line'),origin=sling.querySelector('.sling-origin'),handle=sling.querySelector('.sling-handle'),badge=sling.querySelector('.sling-power');
Object.assign(line.style,{position:'absolute',height:'8px',borderRadius:'999px',background:'rgba(255,255,255,.72)',transformOrigin:'0 50%',boxShadow:'0 0 18px rgba(255,255,255,.25)'});
for(const el of [origin,handle])Object.assign(el.style,{position:'absolute',width:'34px',height:'34px',borderRadius:'50%',border:'3px solid white',background:'rgba(5,15,12,.72)',transform:'translate(-50%,-50%)',boxShadow:'0 4px 18px rgba(0,0,0,.35)'});
Object.assign(handle.style,{width:'48px',height:'48px',background:'rgba(18,124,92,.82)'});
Object.assign(badge.style,{position:'absolute',minWidth:'58px',padding:'8px 10px',borderRadius:'999px',background:'rgba(0,0,0,.72)',color:'#fff',font:'700 15px system-ui',textAlign:'center',transform:'translate(-50%,-160%)'});
document.body.appendChild(sling);

function maxPullDistance(){return Math.min(280,Math.max(150,Math.min(innerWidth,innerHeight)*.42))}
function showPull(x,y){sling.style.display='block';origin.style.left=x+'px';origin.style.top=y+'px';handle.style.left=x+'px';handle.style.top=y+'px';badge.style.left=x+'px';badge.style.top=y+'px';line.style.left=x+'px';line.style.top=y+'px';line.style.width='0px'}
function hidePull(){sling.style.display='none'}
function renderPull(x,y){
  const dx=x-pullStart.x,dy=y-pullStart.y,d=Math.hypot(dx,dy),max=maxPullDistance();
  const capped=Math.min(d,max),angle=Math.atan2(dy,dx),scale=d?capped/d:0;
  const hx=pullStart.x+dx*scale,hy=pullStart.y+dy*scale;
  handle.style.left=hx+'px';handle.style.top=hy+'px';badge.style.left=hx+'px';badge.style.top=hy+'px';
  line.style.width=capped+'px';line.style.transform=`rotate(${angle}rad)`;
  pullPower=Math.min(100,capped/max*100);badge.textContent=Math.round(pullPower)+'%';pullPowerText.textContent=Math.round(pullPower)+'%';
  powerControl.value=String(Math.max(1,Math.round(pullPower)));powerControl.dispatchEvent(new Event('input',{bubbles:true}));
  window.__billiardsRuntime?.aimFromScreenPull?.(dx,dy);
  lastPull={dx,dy,d};
}

canvas?.addEventListener('pointerdown',e=>{
  if(phase!=='aim'||!ballInHandBtn.classList.contains('hidden'))return;
  pulling=true;pullPointer=e.pointerId;pullStart={x:e.clientX,y:e.clientY};lastPull=null;canvas.setPointerCapture(e.pointerId);showPull(e.clientX,e.clientY);setPhase('pull');e.preventDefault();
},{capture:true});
canvas?.addEventListener('pointermove',e=>{if(!pulling||e.pointerId!==pullPointer)return;renderPull(e.clientX,e.clientY);e.preventDefault()},{capture:true});

function finishSlingshot(e){
  if(!pulling||e.pointerId!==pullPointer)return;
  pulling=false;pullPointer=null;hidePull();
  if(!lastPull||lastPull.d<18||pullPower<4){pullPower=0;setPhase('aim');return;}
  const p=Math.max(4,Math.round(pullPower));powerControl.value=String(p);powerControl.dispatchEvent(new Event('input',{bubbles:true}));
  setPhase('shot');shotFlash.classList.add('show');setTimeout(()=>shotFlash.classList.remove('show'),260);shootBtn.click();if(navigator.vibrate)navigator.vibrate(18);
  setTimeout(()=>{cameraBrowse();setPhase('view');pullPower=0;lastPull=null},420);
}
canvas?.addEventListener('pointerup',finishSlingshot,{capture:true});
canvas?.addEventListener('pointercancel',e=>{if(e.pointerId!==pullPointer)return;pulling=false;pullPointer=null;hidePull();setPhase('aim')},{capture:true});

const observer=new MutationObserver(()=>{const active=!ballInHandBtn.classList.contains('hidden');if(active){pulling=false;hidePull();cameraBrowse();setPhase('view');statusEl.textContent='ボールインハンド：盤上をタップして手球を置き、「手球位置を確定」'}});observer.observe(ballInHandBtn,{attributes:true,attributeFilter:['class']});
for(const btn of [modeBtn,resetBtn])btn?.addEventListener('click',()=>setTimeout(()=>{pulling=false;hidePull();cameraBrowse();setPhase('view')},0));
cameraBrowse();setPhase('view');
