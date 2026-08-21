const $=s=>document.querySelector(s);
const body=document.body;
const phaseSteps=[...document.querySelectorAll('.phase-step')];
const statusEl=$('#status'),stanceBtn=$('#stanceBtn'),toPullBtn=$('#toPullBtn'),backToViewBtn=$('#backToViewBtn'),cancelPullBtn=$('#cancelPullBtn');
const pullTrack=$('#pullTrack'),pullHandle=$('#pullHandle'),pullFill=$('#pullFill'),pullPowerText=$('#pullPowerText'),powerControl=$('#powerControl'),shootBtn=$('#shootBtn'),shotFlash=$('#shotFlash');
const ballInHandBtn=$('#ballInHandBtn'),modeBtn=$('#modeBtn'),resetBtn=$('#resetBtn');
let phase='view',pulling=false,pullPointer=null,pullPower=0;

function cameraBrowse(){window.billiardsCamera?.browse?.()}
function cameraStance(){window.billiardsCamera?.stance?.()}
function setPhase(next){phase=next;body.dataset.phase=next;phaseSteps.forEach(el=>el.classList.toggle('active',el.dataset.step===next));if(next==='view')statusEl.textContent='盤面を自由に見て、打ちたい方向を決めます';if(next==='aim')statusEl.textContent='構えました。照準と撞点を合わせます';if(next==='pull')statusEl.textContent='キューを下へ引き、離すと打ちます';if(next==='shot')statusEl.textContent='SHOT'}
stanceBtn?.addEventListener('click',()=>{cameraStance();setPhase('aim')});
backToViewBtn?.addEventListener('click',()=>{cameraBrowse();setPhase('view')});
toPullBtn?.addEventListener('click',()=>{pullPower=0;renderPull();setPhase('pull')});
cancelPullBtn?.addEventListener('click',()=>setPhase('aim'));
function renderPull(){const minY=30,maxY=Math.max(minY+1,pullTrack.clientHeight-30),y=minY+(maxY-minY)*(pullPower/100);pullHandle.style.top=`${y}px`;pullFill.style.top=`${minY}px`;pullFill.style.height=`${Math.max(0,y-minY)}px`;pullPowerText.textContent=`${Math.round(pullPower)}%`}
function updatePull(e){const r=pullTrack.getBoundingClientRect(),minY=30,maxY=Math.max(minY+1,r.height-30),y=Math.min(maxY,Math.max(minY,e.clientY-r.top));pullPower=(y-minY)/(maxY-minY)*100;renderPull()}
pullTrack?.addEventListener('pointerdown',e=>{if(phase!=='pull')return;pulling=true;pullPointer=e.pointerId;pullTrack.setPointerCapture(e.pointerId);updatePull(e)});
pullTrack?.addEventListener('pointermove',e=>{if(pulling&&e.pointerId===pullPointer)updatePull(e)});
function releaseShot(e){if(!pulling||(e&&e.pointerId!==pullPointer))return;pulling=false;pullPointer=null;const p=Math.max(4,Math.round(pullPower));powerControl.value=String(p);powerControl.dispatchEvent(new Event('input',{bubbles:true}));setPhase('shot');shotFlash.classList.add('show');setTimeout(()=>shotFlash.classList.remove('show'),260);shootBtn.click();if(navigator.vibrate)navigator.vibrate(18);setTimeout(()=>{cameraBrowse();setPhase('view');pullPower=0;renderPull()},420)}
pullTrack?.addEventListener('pointerup',releaseShot);pullTrack?.addEventListener('pointercancel',()=>{pulling=false;pullPointer=null});
const observer=new MutationObserver(()=>{const active=!ballInHandBtn.classList.contains('hidden');if(active){cameraBrowse();setPhase('view');statusEl.textContent='ボールインハンド：盤上をタップして手球を置き、「手球位置を確定」'}});observer.observe(ballInHandBtn,{attributes:true,attributeFilter:['class']});
for(const btn of [modeBtn,resetBtn])btn?.addEventListener('click',()=>setTimeout(()=>{cameraBrowse();setPhase('view')},0));
window.addEventListener('resize',renderPull);cameraBrowse();setPhase('view');renderPull();
