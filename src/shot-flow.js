const $=s=>document.querySelector(s);
const body=document.body;
const phaseSteps=[...document.querySelectorAll('.phase-step')];
const statusEl=$('#status'),stanceBtn=$('#stanceBtn'),toPullBtn=$('#toPullBtn'),backToViewBtn=$('#backToViewBtn'),cancelPullBtn=$('#cancelPullBtn');
const pullPanel=$('#pullPanel'),pullPowerText=$('#pullPowerText'),powerControl=$('#powerControl'),shootBtn=$('#shootBtn'),shotFlash=$('#shotFlash'),canvas=$('#game');
const ballInHandBtn=$('#ballInHandBtn'),modeBtn=$('#modeBtn'),playerBtn=$('#playerBtn'),resetBtn=$('#resetBtn');
const CANCEL_MARGIN=6;
let phase='view',pulling=false,pullPointer=null,pullPower=0,pullStart=null,lastPull=null,pullCancelled=false;

function cameraBrowse(){window.billiardsCamera?.browse?.()}
function cameraStance(){window.billiardsCamera?.stance?.()}
function setPhase(next){
  phase=next;body.dataset.phase=next;
  phaseSteps.forEach(el=>el.classList.toggle('active',el.dataset.step===next));
  if(next==='view')statusEl.textContent='盤面を自由に見て、打ちたい方向を決めます';
  if(next==='aim')statusEl.textContent='左右スワイプで狙いを決めます。引っ張りは強さだけです';
  if(next==='pull')statusEl.textContent='方向は固定中。下へ引くほど強く、上へ戻すとキャンセル';
  if(next==='shot')statusEl.textContent='SHOT';
}

stanceBtn?.addEventListener('click',()=>{cameraStance();setPhase('aim')});
backToViewBtn?.addEventListener('click',()=>{cameraBrowse();setPhase('view')});
if(toPullBtn)toPullBtn.style.display='none';
if(pullPanel){pullPanel.style.pointerEvents='none';pullPanel.style.opacity='0';}
cancelPullBtn?.addEventListener('click',()=>setPhase('aim'));

const sling=document.createElement('div');
sling.id='slingGuide';
sling.innerHTML='<div class="sling-line"></div><div class="sling-origin"></div><div class="sling-cancel-line"></div><div class="sling-handle"></div><div class="sling-power">0%</div>';
Object.assign(sling.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'35',display:'none'});
const line=sling.querySelector('.sling-line'),origin=sling.querySelector('.sling-origin'),cancelLine=sling.querySelector('.sling-cancel-line'),handle=sling.querySelector('.sling-handle'),badge=sling.querySelector('.sling-power');
Object.assign(line.style,{position:'absolute',width:'8px',borderRadius:'999px',background:'rgba(255,255,255,.72)',transformOrigin:'50% 0',boxShadow:'0 0 18px rgba(255,255,255,.25)'});
Object.assign(cancelLine.style,{position:'absolute',left:'0',right:'0',height:'2px',background:'rgba(255,110,110,.5)',boxShadow:'0 0 12px rgba(255,70,70,.25)'});
for(const el of [origin,handle])Object.assign(el.style,{position:'absolute',width:'34px',height:'34px',borderRadius:'50%',border:'3px solid white',background:'rgba(5,15,12,.72)',transform:'translate(-50%,-50%)',boxShadow:'0 4px 18px rgba(0,0,0,.35)'});
Object.assign(handle.style,{width:'48px',height:'48px',background:'rgba(18,124,92,.82)'});
Object.assign(badge.style,{position:'absolute',minWidth:'68px',padding:'8px 10px',borderRadius:'999px',background:'rgba(0,0,0,.72)',color:'#fff',font:'700 15px system-ui',textAlign:'center',transform:'translate(-50%,-160%)'});
document.body.appendChild(sling);

function maxPullDistance(){return Math.min(300,Math.max(165,Math.min(innerWidth,innerHeight)*.46))}
function showPull(x,y){sling.style.display='block';origin.style.left=x+'px';origin.style.top=y+'px';handle.style.left=x+'px';handle.style.top=y+'px';badge.style.left=x+'px';badge.style.top=y+'px';line.style.left=(x-4)+'px';line.style.top=y+'px';line.style.height='0px';cancelLine.style.top=(y-CANCEL_MARGIN)+'px'}
function hidePull(){sling.style.display='none'}
function setCancelVisual(active){pullCancelled=active;handle.style.background=active?'rgba(180,45,45,.86)':'rgba(18,124,92,.82)';line.style.background=active?'rgba(255,110,110,.78)':'rgba(255,255,255,.72)';badge.style.background=active?'rgba(145,25,25,.9)':'rgba(0,0,0,.72)';badge.textContent=active?'CANCEL':Math.round(pullPower)+'%'}
function renderPull(x,y){const rawDy=y-pullStart.y;setCancelVisual(rawDy<-CANCEL_MARGIN);const powerDy=Math.max(0,rawDy),max=maxPullDistance(),clamped=Math.min(powerDy,max),hx=pullStart.x,hy=pullStart.y+clamped;handle.style.left=hx+'px';handle.style.top=hy+'px';badge.style.left=hx+'px';badge.style.top=hy+'px';line.style.height=clamped+'px';pullPower=Math.min(100,powerDy/max*100);if(!pullCancelled)badge.textContent=Math.round(pullPower)+'%';pullPowerText.textContent=Math.round(pullPower)+'%';powerControl.value=String(Math.max(1,Math.round(pullPower)));powerControl.dispatchEvent(new Event('input',{bubbles:true}));lastPull={dy:rawDy,d:Math.abs(rawDy)}}

canvas?.addEventListener('pointerdown',e=>{if(phase!=='aim'||!ballInHandBtn.classList.contains('hidden'))return;pulling=true;pullCancelled=false;pullPointer=e.pointerId;pullStart={x:e.clientX,y:e.clientY};lastPull=null;pullPower=0;canvas.setPointerCapture(e.pointerId);showPull(e.clientX,e.clientY);setPhase('pull');e.preventDefault()},{capture:true});
canvas?.addEventListener('pointermove',e=>{if(!pulling||e.pointerId!==pullPointer)return;renderPull(e.clientX,e.clientY);e.preventDefault()},{capture:true});
function finishSlingshot(e){if(!pulling||e.pointerId!==pullPointer)return;pulling=false;pullPointer=null;hidePull();if(pullCancelled||!lastPull||lastPull.dy<-CANCEL_MARGIN||lastPull.d<18||pullPower<4){pullPower=0;pullCancelled=false;lastPull=null;setPhase('aim');statusEl.textContent='ショットをキャンセルしました';return}const p=Math.max(4,Math.round(pullPower));powerControl.value=String(p);powerControl.dispatchEvent(new Event('input',{bubbles:true}));setPhase('shot');shotFlash.classList.add('show');setTimeout(()=>shotFlash.classList.remove('show'),260);shootBtn.click();if(navigator.vibrate)navigator.vibrate(18);setTimeout(()=>{cameraBrowse();setPhase('view');pullPower=0;pullCancelled=false;lastPull=null},420)}
canvas?.addEventListener('pointerup',finishSlingshot,{capture:true});
canvas?.addEventListener('pointercancel',e=>{if(e.pointerId!==pullPointer)return;pulling=false;pullPointer=null;pullCancelled=false;hidePull();setPhase('aim')},{capture:true});
const observer=new MutationObserver(()=>{const active=!ballInHandBtn.classList.contains('hidden');if(active){pulling=false;pullCancelled=false;hidePull();cameraBrowse();setPhase('view');statusEl.textContent='ボールインハンド：盤上をタップして手球を置き、「手球位置を確定」'}});observer.observe(ballInHandBtn,{attributes:true,attributeFilter:['class']});
for(const btn of [modeBtn,playerBtn,resetBtn])btn?.addEventListener('click',()=>setTimeout(()=>{pulling=false;pullCancelled=false;hidePull();cameraBrowse();setPhase('view')},0));
cameraBrowse();setPhase('view');
