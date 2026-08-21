import * as THREE from 'https://esm.sh/three@0.181.1';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
import { GLTFLoader } from 'https://esm.sh/three@0.181.1/examples/jsm/loaders/GLTFLoader.js';

const $=s=>document.querySelector(s);
const canvas=$('#game'),statusEl=$('#status'),power=$('#powerControl'),powerText=$('#powerText');
const resetBtn=$('#resetBtn'),soundBtn=$('#soundBtn'),musicBtn=$('#musicBtn'),modeBtn=$('#modeBtn'),shootBtn=$('#shootBtn');
const guideBtn=$('#guideBtn'),ballInHandBtn=$('#ballInHandBtn'),aimPad=$('#aimPad'),aimLeftBtn=$('#aimLeftBtn'),aimRightBtn=$('#aimRightBtn'),angleText=$('#angleText');
const spinPad=$('#spinPad'),spinDot=$('#spinDot'),spinText=$('#spinText');
const matchHud=$('#matchHud'),p1Card=$('#p1Card'),p2Card=$('#p2Card'),p1Group=$('#p1Group'),p2Group=$('#p2Group'),gameLabel=$('#gameLabel');
const axisButtons=[...document.querySelectorAll('[data-axis]')];

const TABLE_LENGTH=2.7432;
const TABLE_WIDTH=1.3716;
const TABLE_Y=.78;
const BALL_R=.05715/2;
const POCKET_R=.076;
const MODEL_URL='https://cdn.jsdelivr.net/gh/elijah-atkins/Billiards@main/assets/pool-table/pool-table.glb';
const table={w:TABLE_LENGTH,h:TABLE_WIDTH,y:TABLE_Y,rail:.055};

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.86;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x050504);scene.fog=new THREE.FogExp2(0x080604,.042);
const camera=new THREE.PerspectiveCamera(43,1,.05,80);

const cam={target:new THREE.Vector3(0,TABLE_Y,0),yaw:.08,pitch:.72,distance:4.35,minDistance:2.05,maxDistance:8.2,mode:'browse',axis:'Y'};
function syncCamera(){const cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch),cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw);camera.position.set(cam.target.x+cam.distance*cp*sy,cam.target.y+cam.distance*sp,cam.target.z+cam.distance*cp*cy);camera.lookAt(cam.target)}
syncCamera();

scene.add(new THREE.HemisphereLight(0xa8b7c4,0x150c08,.18));
for(const x of [-.82,.82]){const s=new THREE.SpotLight(0xfff2dc,34,9,.66,.62,1.2);s.position.set(x,3.45,.12);s.target.position.set(x*.35,TABLE_Y,0);s.castShadow=true;s.shadow.mapSize.set(1024,1024);s.shadow.bias=-.00012;s.shadow.normalBias=.008;scene.add(s,s.target)}
const fill=new THREE.PointLight(0x7698ff,1.8,7);fill.position.set(2.7,2.3,2.2);scene.add(fill);

const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});world.broadphase=new CANNON.SAPBroadphase(world);world.allowSleep=true;world.solver.iterations=20;
const matBall=new CANNON.Material('ball'),matCloth=new CANNON.Material('cloth'),matRail=new CANNON.Material('rail');
world.addContactMaterial(new CANNON.ContactMaterial(matBall,matBall,{friction:.018,restitution:.94}));
world.addContactMaterial(new CANNON.ContactMaterial(matBall,matCloth,{friction:.18,restitution:.01}));
world.addContactMaterial(new CANNON.ContactMaterial(matBall,matRail,{friction:.055,restitution:.79}));
const clothBody=new CANNON.Body({mass:0,material:matCloth,shape:new CANNON.Box(new CANNON.Vec3(TABLE_LENGTH/2,.01,TABLE_WIDTH/2)),position:new CANNON.Vec3(0,TABLE_Y-.01,0)});world.addBody(clothBody);

const pocketCenters=[
  [-TABLE_LENGTH/2-.015,-TABLE_WIDTH/2-.015],[0,-TABLE_WIDTH/2-.048],[TABLE_LENGTH/2+.015,-TABLE_WIDTH/2-.015],
  [-TABLE_LENGTH/2-.015,TABLE_WIDTH/2+.015],[0,TABLE_WIDTH/2+.048],[TABLE_LENGTH/2+.015,TABLE_WIDTH/2+.015]
];

const railBodies=[];
function addRail(x,z,hx,hz){const body=new CANNON.Body({mass:0,material:matRail,shape:new CANNON.Box(new CANNON.Vec3(hx,.055,hz)),position:new CANNON.Vec3(x,TABLE_Y+.055,z)});world.addBody(body);railBodies.push(body)}
const cornerOpening=.105,middleOpening=.092,railHalf=.032;
const longSegment=(TABLE_LENGTH/2-cornerOpening-middleOpening)/2;
const longCenter=(cornerOpening+middleOpening+TABLE_LENGTH/2)/2;
for(const z of [-TABLE_WIDTH/2-railHalf,TABLE_WIDTH/2+railHalf]){addRail(-longCenter,z,longSegment/2,railHalf);addRail(longCenter,z,longSegment/2,railHalf)}
const shortLength=TABLE_WIDTH/2-cornerOpening;
for(const x of [-TABLE_LENGTH/2-railHalf,TABLE_LENGTH/2+railHalf])addRail(x,0,railHalf,shortLength);

function box(size,color,rough=.7){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:rough}));m.castShadow=m.receiveShadow=true;return m}
const roomFloor=box([10,.18,8],0x25150d,.84);roomFloor.position.y=-.12;scene.add(roomFloor);
const back=box([10,4,.18],0x14110f,.95);back.position.set(0,1.85,-4);scene.add(back);
const fallback=new THREE.Group();scene.add(fallback);
const fCloth=box([TABLE_LENGTH,.035,TABLE_WIDTH],0x0b6246,.95);fCloth.position.y=TABLE_Y-.0175;fallback.add(fCloth);
const fFrame=box([TABLE_LENGTH+.34,.2,TABLE_WIDTH+.34],0x4a2414,.42);fFrame.position.y=TABLE_Y-.13;fallback.add(fFrame);fallback.visible=true;

let realTable=null;
function tuneMaterial(mat){if(!mat)return;if(Array.isArray(mat)){mat.forEach(tuneMaterial);return}if('roughness'in mat)mat.roughness=Math.max(.3,Math.min(.78,mat.roughness??.5));if('metalness'in mat)mat.metalness=Math.min(.16,mat.metalness??0);mat.needsUpdate=true}
async function loadRealTable(){try{const gltf=await new GLTFLoader().loadAsync(MODEL_URL);const model=gltf.scene;model.position.set(-TABLE_LENGTH/2,TABLE_Y,TABLE_WIDTH/2);model.traverse(o=>{if(/cue/i.test(o.name||''))o.visible=false;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;tuneMaterial(o.material)}});scene.add(model);realTable=model;fallback.visible=false;statusEl.textContent='実モデル表示 — native座標 v1.0.0'}catch(err){console.warn('GLB load failed',err);statusEl.textContent='内蔵台で実行中 — 実モデル読込失敗'}}

const colors=[0xffffff,0xf5d90a,0x174fb9,0xd8241b,0x6a2aa8,0xee6b18,0x13834f,0x6f1919,0x111111,0xf5d90a,0x174fb9,0xd8241b,0x6a2aa8,0xee6b18,0x13834f,0x6f1919];
function ballTexture(n,c){const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');g.fillStyle='#'+new THREE.Color(c).getHexString();g.fillRect(0,0,256,256);if(n>8){g.fillStyle='#f7f4ea';g.fillRect(0,62,256,132)}if(n>0){g.beginPath();g.arc(128,128,52,0,Math.PI*2);g.fillStyle='#f7f4ea';g.fill();g.fillStyle='#111';g.font='700 68px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),128,132)}const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t}
const balls=[];
function makeShadow(){const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d');const grad=g.createRadialGradient(32,32,2,32,32,31);grad.addColorStop(0,'rgba(0,0,0,.34)');grad.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=grad;g.fillRect(0,0,64,64);const tex=new THREE.CanvasTexture(cv);const s=new THREE.Mesh(new THREE.PlaneGeometry(BALL_R*2.6,BALL_R*2.6),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));s.rotation.x=-Math.PI/2;s.position.y=TABLE_Y+.0006;scene.add(s);return s}
function addBall(n,x,z){const mesh=new THREE.Mesh(new THREE.SphereGeometry(BALL_R,32,24),new THREE.MeshPhysicalMaterial({map:ballTexture(n,colors[n]),roughness:.16,clearcoat:.38,clearcoatRoughness:.18}));mesh.castShadow=true;mesh.receiveShadow=false;scene.add(mesh);const body=new CANNON.Body({mass:.17,material:matBall,shape:new CANNON.Sphere(BALL_R),position:new CANNON.Vec3(x,TABLE_Y+BALL_R,z),linearDamping:.025,angularDamping:.035,allowSleep:true,sleepSpeedLimit:.045,sleepTimeLimit:.18});world.addBody(body);const b={n,mesh,body,shadow:makeShadow(),pocketed:false,falling:false,fallT:0,fallStart:null,fallPocket:null};balls.push(b);return b}
function clearBalls(){for(const b of balls){scene.remove(b.mesh,b.shadow);if(world.bodies.includes(b.body))world.removeBody(b.body)}balls.length=0}

let mode='practice',currentPlayer=0,groups=[null,null],shotPocketed=[],shotActive=false,scratch=false,gameOver=false,shotFirstObject=null,ballInHand=false,guideOn=true;
const groupOf=n=>n>=1&&n<=7?'solid':n>=9&&n<=15?'stripe':null,groupLabel=g=>g==='solid'?'SOLIDS 1–7':g==='stripe'?'STRIPES 9–15':'OPEN';
function updateHud(){const match=mode!=='practice';matchHud.classList.toggle('hidden',!match);p1Card.classList.toggle('active',currentPlayer===0);p2Card.classList.toggle('active',currentPlayer===1);p1Group.textContent=mode==='two9'?'LOWEST BALL':groupLabel(groups[0]);p2Group.textContent=mode==='two9'?'LOWEST BALL':groupLabel(groups[1]);gameLabel.textContent=mode==='two9'?'9 BALL':'8 BALL';modeBtn.textContent=mode==='practice'?'練習':mode==='two8'?'2P 8-BALL':'2P 9-BALL';ballInHandBtn.classList.toggle('hidden',!ballInHand);guideBtn.textContent=guideOn?'GUIDE ON':'GUIDE OFF';shootBtn.disabled=ballInHand||gameOver}
function resetMatch(){currentPlayer=0;groups=[null,null];shotPocketed=[];shotActive=false;scratch=false;gameOver=false;shotFirstObject=null;ballInHand=false;updateHud()}
function rack8(){addBall(0,-TABLE_LENGTH*.29,0);const order=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];let i=0,start=TABLE_LENGTH*.18,dx=BALL_R*1.76,dz=BALL_R*2.04;for(let row=0;row<5;row++)for(let j=0;j<=row;j++)addBall(order[i++],start+row*dx,(j-row/2)*dz)}
function rack9(){addBall(0,-TABLE_LENGTH*.29,0);const layout=[[1],[2,3],[4,9,5],[6,7],[8]],start=TABLE_LENGTH*.18,dx=BALL_R*1.78,dz=BALL_R*2.04;layout.forEach((row,i)=>row.forEach((n,j)=>addBall(n,start+i*dx,(j-(row.length-1)/2)*dz)))}
function rack(){clearBalls();mode==='two9'?rack9():rack8();resetMatch();aimAngle=0;statusEl.textContent=mode==='practice'?'盤面を自由に見てから構えます':`PLAYER 1 のブレイク — ${mode==='two9'?'9 BALL':'8 BALL'}`;cam.target.set(0,TABLE_Y,0);cam.distance=4.35;cam.pitch=.72;syncCamera();updateAim()}

const aimLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0xffffff,dashSize:.08,gapSize:.04,transparent:true,opacity:.72}));scene.add(aimLine);
const ghost=new THREE.Mesh(new THREE.RingGeometry(BALL_R*.95,BALL_R*1.05,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.42,side:THREE.DoubleSide}));ghost.rotation.x=-Math.PI/2;scene.add(ghost);
const cueMesh=new THREE.Mesh(new THREE.CylinderGeometry(.0105,.017,1.48,18),new THREE.MeshPhysicalMaterial({color:0xc49a60,roughness:.3,clearcoat:.3}));cueMesh.rotation.z=Math.PI/2;cueMesh.castShadow=true;cueMesh.visible=false;scene.add(cueMesh);
let aimAngle=0,spinX=0,spinY=0,cueAnim=0,aimDragging=false,aimStartX=0,aimStartAngle=0;
function cueBall(){return balls.find(b=>b.n===0&&!b.pocketed&&!b.falling)}
function allStopped(){return balls.every(b=>b.pocketed||b.falling||Math.hypot(b.body.velocity.x,b.body.velocity.z)<.045)}
function validCuePos(x,z){if(Math.abs(x)>TABLE_LENGTH/2-BALL_R-.012||Math.abs(z)>TABLE_WIDTH/2-BALL_R-.012)return false;for(const b of balls){if(b.n===0||b.pocketed||b.falling)continue;if(Math.hypot(b.body.position.x-x,b.body.position.z-z)<BALL_R*2.05)return false}return true}
function firstHitPrediction(){const cb=cueBall();if(!cb)return null;const ox=cb.body.position.x,oz=cb.body.position.z,dx=Math.cos(aimAngle),dz=Math.sin(aimAngle);let best=null;for(const b of balls){if(b.n===0||b.pocketed||b.falling)continue;const rx=b.body.position.x-ox,rz=b.body.position.z-oz,t=rx*dx+rz*dz;if(t<=0)continue;const p2=rx*rx+rz*rz-t*t,rr=(BALL_R*2.02)**2;if(p2>rr)continue;const hit=t-Math.sqrt(rr-p2);if(hit>0&&(!best||hit<best.hit))best={hit,b}}return best}
function normalizeAngle(){while(aimAngle>Math.PI)aimAngle-=Math.PI*2;while(aimAngle<-Math.PI)aimAngle+=Math.PI*2;angleText.textContent=(aimAngle*180/Math.PI).toFixed(1)+'°'}
function updateAim(){normalizeAngle();const cb=cueBall();const phase=document.body.dataset.phase;const aiming=phase==='aim'||phase==='pull';if(!cb||!allStopped()||gameOver||!aiming){aimLine.visible=cueMesh.visible=ghost.visible=false;return}const p=cb.mesh.position,dir=new THREE.Vector3(Math.cos(aimAngle),0,Math.sin(aimAngle)),pred=guideOn?firstHitPrediction():null,len=pred?pred.hit:2.5;aimLine.geometry.setFromPoints([new THREE.Vector3(p.x,TABLE_Y+BALL_R+.008,p.z),new THREE.Vector3(p.x+dir.x*len,TABLE_Y+BALL_R+.008,p.z+dir.z*len)]);aimLine.computeLineDistances();aimLine.visible=guideOn;ghost.visible=!!pred&&guideOn;if(pred)ghost.position.set(p.x+dir.x*pred.hit,TABLE_Y+.001,p.z+dir.z*pred.hit);const stroke=cueAnim>0?Math.sin(cueAnim*Math.PI)*.22:0;cueMesh.visible=true;cueMesh.position.set(p.x-dir.x*(.78+stroke),TABLE_Y+BALL_R+.018,p.z-dir.z*(.78+stroke));cueMesh.rotation.set(0,-aimAngle,Math.PI/2);if(cam.mode==='stance'){cam.target.set(p.x,TABLE_Y+BALL_R*.55,p.z);cam.yaw=Math.atan2(dir.x,dir.z)+Math.PI;syncCamera()}}

window.billiardsCamera={browse(){cam.mode='browse';cueMesh.visible=false;aimLine.visible=false;ghost.visible=false},stance(){cam.mode='stance';updateAim();const cb=cueBall();if(cb){cam.target.set(cb.body.position.x,TABLE_Y+BALL_R*.55,cb.body.position.z);cam.distance=2.3;cam.pitch=.34;syncCamera()}},axis(a){cam.axis=a;axisButtons.forEach(b=>b.classList.toggle('active',b.dataset.axis===a))}};
axisButtons.forEach(b=>b.addEventListener('click',()=>window.billiardsCamera.axis(b.dataset.axis)));
window.__billiardsRuntime={scene,THREE,table,ballR:BALL_R,statusEl,camera,audio:null,getCueBall:()=>cueBall(),setAimAngle:a=>{aimAngle=a;updateAim()},getAimAngle:()=>aimAngle,aimFromScreenPull:(dx,dy)=>{const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0);right.y=0;if(right.lengthSq()<1e-6)right.set(1,0,0);right.normalize();const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;if(forward.lengthSq()<1e-6)forward.set(0,0,-1);forward.normalize();const dir=right.multiplyScalar(-dx).add(forward.multiplyScalar(dy));if(dir.lengthSq()>1e-5){dir.normalize();aimAngle=Math.atan2(dir.z,dir.x);updateAim()}}};

if(aimPad){aimPad.addEventListener('pointerdown',e=>{if(gameOver||!allStopped()||ballInHand)return;aimDragging=true;aimStartX=e.clientX;aimStartAngle=aimAngle;aimPad.setPointerCapture(e.pointerId)});aimPad.addEventListener('pointermove',e=>{if(!aimDragging)return;aimAngle=aimStartAngle-(e.clientX-aimStartX)*.0042;updateAim()});aimPad.addEventListener('pointerup',()=>aimDragging=false);aimPad.addEventListener('pointercancel',()=>aimDragging=false)}
const fineStep=Math.PI/360;aimLeftBtn?.addEventListener('click',()=>{aimAngle+=fineStep;updateAim()});aimRightBtn?.addEventListener('click',()=>{aimAngle-=fineStep;updateAim()});

const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-TABLE_Y);
function pointOnTable(e){const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);const out=new THREE.Vector3();return ray.ray.intersectPlane(plane,out)?out:null}
canvas.addEventListener('pointerdown',e=>{if(!ballInHand||!allStopped())return;const p=pointOnTable(e),cb=balls.find(b=>b.n===0);if(!p||!cb||!validCuePos(p.x,p.z))return;cb.pocketed=false;cb.falling=false;cb.mesh.visible=true;cb.shadow.visible=true;if(!world.bodies.includes(cb.body))world.addBody(cb.body);cb.body.position.set(p.x,TABLE_Y+BALL_R,p.z);cb.body.velocity.setZero();cb.body.angularVelocity.setZero();statusEl.textContent='手球位置を選択中 — 「手球位置を確定」で決定';updateAim()});

function setSpin(e){const r=spinPad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=(e.clientX-cx)/(r.width*.38),y=(cy-e.clientY)/(r.height*.38);const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}spinX=x;spinY=y;spinDot.style.left=(50+x*38)+'%';spinDot.style.top=(50-y*38)+'%';spinText.textContent=Math.abs(x)<.12&&Math.abs(y)<.12?'CENTER':`${y>.15?'TOP ':y<-.15?'DRAW ':''}${x>.15?'RIGHT':x<-.15?'LEFT':''}`.trim()||'CENTER'}
let spinDragging=false;spinPad?.addEventListener('pointerdown',e=>{spinDragging=true;spinPad.setPointerCapture(e.pointerId);setSpin(e)});spinPad?.addEventListener('pointermove',e=>{if(spinDragging)setSpin(e)});spinPad?.addEventListener('pointerup',()=>spinDragging=false);power?.addEventListener('input',()=>powerText.textContent=power.value+'%');

const audio={ctx:null,on:true,last:0,ensure(){if(!this.ctx)this.ctx=new(window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume()},tone(f,d,v,t='sine'){if(!this.on)return;this.ensure();const n=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g).connect(this.ctx.destination);o.start(n);o.stop(n+d)},cue(p){this.tone(150+60*p,.04,.04+.05*p,'triangle')},clack(v){const n=performance.now();if(n-this.last<26)return;this.last=n;this.tone(450+Math.min(v,3)*100,.025,.018+Math.min(v,.12),'triangle')},pocket(){this.tone(92,.14,.06)}};window.__billiardsRuntime.audio=audio;
function shoot(){if(gameOver||!allStopped()||ballInHand)return;const cb=cueBall(),p=Number(power.value)/100;if(!cb||p<.02)return;const dir=new THREE.Vector3(Math.cos(aimAngle),0,Math.sin(aimAngle)),impulse=.20+p*1.45;shotPocketed=[];scratch=false;shotActive=true;shotFirstObject=null;cueAnim=.001;shootBtn.disabled=true;audio.ensure();setTimeout(()=>{cb.body.wakeUp();cb.body.applyImpulse(new CANNON.Vec3(dir.x*impulse,0,dir.z*impulse));const rollAxis=new CANNON.Vec3(-dir.z,0,dir.x),baseRoll=impulse/BALL_R*.19;cb.body.angularVelocity.set(rollAxis.x*(baseRoll+spinY*34),spinX*30,rollAxis.z*(baseRoll+spinY*34));audio.cue(p)},80);statusEl.textContent=mode==='practice'?'ショット':`PLAYER ${currentPlayer+1} ショット`;power.value=35;powerText.textContent='35%'}shootBtn?.addEventListener('click',shoot);
world.addEventListener('beginContact',ev=>{const a=balls.find(b=>b.body===ev.bodyA),b=balls.find(b=>b.body===ev.bodyB);if(a&&b){const rel=ev.bodyA.velocity.vsub(ev.bodyB.velocity).length();if(rel>.16)audio.clack(rel);if(shotActive&&!shotFirstObject){if(a.n===0&&b.n!==0)shotFirstObject=b.n;if(b.n===0&&a.n!==0)shotFirstObject=a.n}}});

function nearestPocket(x,z){let best=null,d=Infinity;for(const p of pocketCenters){const q=Math.hypot(x-p[0],z-p[1]);if(q<d){d=q;best=p}}return {p:best,d}}
function startPocketFall(b,px,pz){if(b.falling||b.pocketed)return;b.falling=true;b.fallT=0;b.fallStart=b.mesh.position.clone();b.fallPocket=new THREE.Vector3(px,TABLE_Y-.22,pz);b.shadow.visible=false;if(world.bodies.includes(b.body))world.removeBody(b.body);audio.pocket();if(shotActive){shotPocketed.push(b.n);if(b.n===0)scratch=true}}
function pocketOrConstrain(b){if(b.pocketed||b.falling)return;const p=b.body.position,v=b.body.velocity;const near=nearestPocket(p.x,p.z);if(near.d<POCKET_R){startPocketFall(b,near.p[0],near.p[1]);return}const maxX=TABLE_LENGTH/2-BALL_R-.003,maxZ=TABLE_WIDTH/2-BALL_R-.003;const outsideX=Math.abs(p.x)>maxX,outsideZ=Math.abs(p.z)>maxZ;if(!outsideX&&!outsideZ)return;const pocketLane=near.d<POCKET_R*1.45;if(pocketLane){if(Math.abs(p.x)>TABLE_LENGTH/2+.10||Math.abs(p.z)>TABLE_WIDTH/2+.12)startPocketFall(b,near.p[0],near.p[1]);return}if(outsideX){p.x=Math.sign(p.x||1)*maxX;v.x*=-.56}if(outsideZ){p.z=Math.sign(p.z||1)*maxZ;v.z*=-.56}}
function animatePocketFalls(dt){for(const b of balls){if(!b.falling)continue;b.fallT+=dt;const t=Math.min(1,b.fallT/.34),ease=t*t*(3-2*t);b.mesh.position.lerpVectors(b.fallStart,b.fallPocket,ease);b.mesh.rotation.x+=dt*8;b.mesh.rotation.z+=dt*5;if(t>=1){b.falling=false;b.pocketed=true;b.mesh.visible=false}}}
function restoreCue(){const b=balls.find(x=>x.n===0);if(!b)return;b.pocketed=false;b.falling=false;b.mesh.visible=true;b.shadow.visible=true;if(!world.bodies.includes(b.body))world.addBody(b.body);b.body.position.set(-TABLE_LENGTH*.29,TABLE_Y+BALL_R,0);b.body.velocity.setZero();b.body.angularVelocity.setZero();b.mesh.position.copy(b.body.position)}
function remainingFor(g){return balls.filter(b=>groupOf(b.n)===g&&!b.pocketed&&!b.falling).length}
function lowestNineAtShot(){const nums=balls.filter(b=>b.n>0&&b.n<=9&&(!b.pocketed||shotPocketed.includes(b.n))).map(b=>b.n);return nums.length?Math.min(...nums):9}
function respotNine(){const b=balls.find(x=>x.n===9);if(!b)return;b.pocketed=false;b.falling=false;b.mesh.visible=true;b.shadow.visible=true;if(!world.bodies.includes(b.body))world.addBody(b.body);b.body.position.set(TABLE_LENGTH*.18,TABLE_Y+BALL_R,0);b.body.velocity.setZero();b.body.angularVelocity.setZero()}
function resolve9(){const nine=shotPocketed.includes(9),required=lowestNineAtShot(),foul=scratch||!shotFirstObject||shotFirstObject!==required;if(nine){if(!foul){gameOver=true;statusEl.textContent=`PLAYER ${currentPlayer+1} WIN! 9番を沈めました`;updateHud();return}respotNine()}if(foul){if(scratch)restoreCue();currentPlayer=1-currentPlayer;ballInHand=true;statusEl.textContent=`FOUL — PLAYER ${currentPlayer+1} ボールインハンド`}else if(shotPocketed.some(n=>n>0))statusEl.textContent=`PLAYER ${currentPlayer+1} 続行`;else{currentPlayer=1-currentPlayer;statusEl.textContent=`PLAYER ${currentPlayer+1} の番`}updateHud()}
function resolve8(){const object=shotPocketed.filter(n=>n!==0&&n!==8),eight=shotPocketed.includes(8),g=groups[currentPlayer];let foul=scratch||!shotFirstObject;if(g&&shotFirstObject&&shotFirstObject!==8&&groupOf(shotFirstObject)!==g)foul=true;if(g&&remainingFor(g)>0&&shotFirstObject===8)foul=true;if(eight){const legal=g&&remainingFor(g)===0&&!foul;gameOver=true;statusEl.textContent=legal?`PLAYER ${currentPlayer+1} WIN!`:`PLAYER ${2-currentPlayer} WIN! 8番ファウル`;updateHud();return}if(!groups[currentPlayer]&&object.length&&!foul){const first=groupOf(object[0]);if(first){groups[currentPlayer]=first;groups[1-currentPlayer]=first==='solid'?'stripe':'solid'}}const own=groups[currentPlayer],scored=object.some(n=>!own||groupOf(n)===own);if(foul){if(scratch)restoreCue();currentPlayer=1-currentPlayer;ballInHand=true;statusEl.textContent=`FOUL — PLAYER ${currentPlayer+1} ボールインハンド`}else if(scored)statusEl.textContent=`PLAYER ${currentPlayer+1} 続行`;else{currentPlayer=1-currentPlayer;statusEl.textContent=`PLAYER ${currentPlayer+1} の番`}updateHud()}
function resolveShot(){if(!shotActive)return;shotActive=false;if(mode==='practice'){if(scratch){restoreCue();ballInHand=true;statusEl.textContent='スクラッチ — 手球を置いてください'}updateHud();return}mode==='two9'?resolve9():resolve8()}

resetBtn?.addEventListener('click',()=>{audio.ensure();rack()});soundBtn?.addEventListener('click',()=>{audio.on=!audio.on;soundBtn.textContent=audio.on?'SOUND ON':'SOUND OFF';if(audio.on)audio.ensure()});modeBtn?.addEventListener('click',()=>{mode=mode==='practice'?'two8':mode==='two8'?'two9':'practice';rack()});guideBtn?.addEventListener('click',()=>{guideOn=!guideOn;updateHud();updateAim()});ballInHandBtn?.addEventListener('click',()=>{if(ballInHand){ballInHand=false;statusEl.textContent=`PLAYER ${currentPlayer+1} 手球位置確定`;updateHud();updateAim()}});

const touches=new Map();let mouseDrag=null,lastPinch=0,lastMid=null;
function canCamera(){return document.body.dataset.phase==='view'&&!ballInHand}
canvas.addEventListener('pointerdown',e=>{if(!canCamera())return;canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY});if(e.pointerType==='mouse')mouseDrag={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointermove',e=>{if(!canCamera()||!touches.has(e.pointerId))return;const t=touches.get(e.pointerId);t.px=t.x;t.py=t.y;t.x=e.clientX;t.y=e.clientY;touches.set(e.pointerId,t);const arr=[...touches.values()];if(arr.length>=2){const a=arr[0],b=arr[1],dist=Math.hypot(a.x-b.x,a.y-b.y),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(lastPinch)cam.distance=Math.max(cam.minDistance,Math.min(cam.maxDistance,cam.distance-(dist-lastPinch)*.012));if(lastMid){const dx=mid.x-lastMid.x,dy=mid.y-lastMid.y;const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0);cam.target.addScaledVector(right,-dx*.004*cam.distance);cam.target.y+=dy*.003*cam.distance}lastPinch=dist;lastMid=mid;syncCamera();return}if(e.pointerType==='mouse'&&mouseDrag){const dx=e.clientX-mouseDrag.x,dy=e.clientY-mouseDrag.y;mouseDrag.x=e.clientX;mouseDrag.y=e.clientY;if(e.ctrlKey){const k=.004*cam.distance;if(cam.axis==='X')cam.target.x-=dx*k;if(cam.axis==='Y')cam.target.y+=dy*k;if(cam.axis==='Z')cam.target.z+=dx*k}else if(e.shiftKey){const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0);cam.target.addScaledVector(right,-dx*.004*cam.distance);cam.target.y+=dy*.003*cam.distance}else{cam.yaw-=dx*.006;cam.pitch=Math.max(.15,Math.min(1.42,cam.pitch+dy*.005))}syncCamera()}else if(arr.length===1&&e.pointerType!=='mouse'){cam.yaw-=(t.x-t.px)*.006;cam.pitch=Math.max(.15,Math.min(1.42,cam.pitch+(t.y-t.py)*.005));syncCamera()}});
function endPointer(e){touches.delete(e.pointerId);mouseDrag=null;if(touches.size<2){lastPinch=0;lastMid=null}}canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('wheel',e=>{if(!canCamera())return;e.preventDefault();cam.distance=Math.max(cam.minDistance,Math.min(cam.maxDistance,cam.distance*(1+Math.sign(e.deltaY)*.08)));syncCamera()},{passive:false});
addEventListener('keydown',e=>{if(['x','y','z','X','Y','Z'].includes(e.key))window.billiardsCamera.axis(e.key.toUpperCase())});

let last=performance.now(),acc=0,wasMoving=false;const fixed=1/120;
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.05,(now-last)/1000);last=now;acc+=dt;if(cueAnim>0){cueAnim+=dt*4.8;if(cueAnim>=1)cueAnim=0}while(acc>=fixed){world.step(fixed);for(const b of balls){if(b.pocketed||b.falling)continue;const v=b.body.velocity,s=Math.hypot(v.x,v.z);b.body.position.y=TABLE_Y+BALL_R;v.y=0;pocketOrConstrain(b);if(b.falling)continue;if(s<.045){v.x=0;v.z=0;b.body.angularVelocity.setZero();b.body.sleep()}else{const decel=s>1.4?.16:s>.7?.21:s>.3?.28:s>.12?.40:.58;const next=Math.max(0,s-decel*fixed),k=next/s;v.x*=k;v.z*=k}}acc-=fixed}for(const b of balls){if(!b.pocketed&&!b.falling){b.mesh.position.set(b.body.position.x,TABLE_Y+BALL_R,b.body.position.z);b.mesh.quaternion.copy(b.body.quaternion);b.shadow.position.x=b.body.position.x;b.shadow.position.z=b.body.position.z;b.shadow.visible=true}}animatePocketFalls(dt);const moving=!allStopped();if(wasMoving&&!moving)resolveShot();wasMoving=moving;if(!moving&&!shotActive)updateAim();else if(document.body.dataset.phase==='view')cueMesh.visible=false;renderer.render(scene,camera)}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();rack();loadRealTable();requestAnimationFrame(animate);
