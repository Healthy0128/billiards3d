import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

const $=s=>document.querySelector(s);
const canvas=$('#game'), statusEl=$('#status'), powerFill=$('#powerFill'), powerText=$('#powerText');
const resetBtn=$('#resetBtn'), cameraBtn=$('#cameraBtn'), soundBtn=$('#soundBtn'), modeBtn=$('#modeBtn');
const matchHud=$('#matchHud'), p1Card=$('#p1Card'), p2Card=$('#p2Card'), p1Group=$('#p1Group'), p2Group=$('#p2Group');

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x050807); scene.fog=new THREE.FogExp2(0x050807,.08);
const camera=new THREE.PerspectiveCamera(42,1,.05,50);
const views=[{p:[0,3.65,3.95]},{p:[0,5.25,.06]},{p:[3.55,2.35,0]}]; let view=0;
function applyCamera(){camera.position.set(...views[view].p);camera.lookAt(0,0,0)} applyCamera();
scene.add(new THREE.HemisphereLight(0xbfe7ff,0x17110c,.55));
const key=new THREE.SpotLight(0xfff2d2,75,10,.68,.55,1.2); key.position.set(0,4.7,0); key.target.position.set(0,0,0); key.castShadow=true; key.shadow.mapSize.set(1024,1024); scene.add(key,key.target);
const rim=new THREE.PointLight(0x77aaff,8,7); rim.position.set(-3,2,2.6); scene.add(rim);

const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)}); world.broadphase=new CANNON.SAPBroadphase(world); world.allowSleep=true; world.solver.iterations=12;
const matBall=new CANNON.Material('ball'), matCloth=new CANNON.Material('cloth'), matRail=new CANNON.Material('rail');
world.addContactMaterial(new CANNON.ContactMaterial(matBall,matBall,{friction:.025,restitution:.94,contactEquationStiffness:1e8}));
world.addContactMaterial(new CANNON.ContactMaterial(matBall,matCloth,{friction:.22,restitution:.08}));
world.addContactMaterial(new CANNON.ContactMaterial(matBall,matRail,{friction:.08,restitution:.78}));

const table={w:2.84,h:1.42,y:.72,rail:.105}, ballR=.05715, pocketR=.095, balls=[];
const pockets=[[-table.w/2,-table.h/2],[0,-table.h/2-.005],[table.w/2,-table.h/2],[-table.w/2,table.h/2],[0,table.h/2+.005],[table.w/2,table.h/2]];
function box(size,color,rough=.65,metal=.05){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal}));m.castShadow=m.receiveShadow=true;return m}
const floor=box([8,.18,7],0x17130f,.92,0); floor.position.y=-.1; scene.add(floor);
world.addBody(new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(4,.09,3.5)),position:new CANNON.Vec3(0,-.1,0)}));
const base=box([table.w+.42,.25,table.h+.42],0x3b1d0b,.42,.08); base.position.y=table.y-.18; scene.add(base);
const cloth=box([table.w,.055,table.h],0x0d5b42,.9,0); cloth.position.y=table.y; scene.add(cloth);
world.addBody(new CANNON.Body({mass:0,material:matCloth,shape:new CANNON.Box(new CANNON.Vec3(table.w/2,.0275,table.h/2)),position:new CANNON.Vec3(0,table.y,0)}));
function rail(x,z,sx,sz){const m=box([sx,.18,sz],0x47230d,.4,.06);m.position.set(x,table.y+.12,z);scene.add(m);world.addBody(new CANNON.Body({mass:0,material:matRail,shape:new CANNON.Box(new CANNON.Vec3(sx/2,.09,sz/2)),position:new CANNON.Vec3(x,table.y+.12,z)}))}
const gap=.18;
rail(-table.w/4-.04,-table.h/2-table.rail/2,table.w/2-gap,table.rail);rail(table.w/4+.04,-table.h/2-table.rail/2,table.w/2-gap,table.rail);rail(-table.w/4-.04,table.h/2+table.rail/2,table.w/2-gap,table.rail);rail(table.w/4+.04,table.h/2+table.rail/2,table.w/2-gap,table.rail);
rail(-table.w/2-table.rail/2,-table.h/4-.03,table.rail,table.h/2-gap);rail(-table.w/2-table.rail/2,table.h/4+.03,table.rail,table.h/2-gap);rail(table.w/2+table.rail/2,-table.h/4-.03,table.rail,table.h/2-gap);rail(table.w/2+table.rail/2,table.h/4+.03,table.rail,table.h/2-gap);
for(const [x,z] of pockets){const r=new THREE.Mesh(new THREE.CylinderGeometry(pocketR*1.12,pocketR*1.12,.025,28),new THREE.MeshStandardMaterial({color:0x050505,roughness:.7}));r.position.set(x,table.y+.04,z);scene.add(r)}

const colors=[0xffffff,0xf5d90a,0x174fb9,0xd8241b,0x6a2aa8,0xee6b18,0x13834f,0x6f1919,0x111111,0xf5d90a,0x174fb9,0xd8241b,0x6a2aa8,0xee6b18,0x13834f,0x6f1919];
function texture(n,color){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#'+new THREE.Color(color).getHexString();g.fillRect(0,0,256,256);if(n>8){g.fillStyle='#f7f4ea';g.fillRect(0,62,256,132)}if(n>0){g.beginPath();g.arc(128,128,52,0,Math.PI*2);g.fillStyle='#f7f4ea';g.fill();g.fillStyle='#111';g.font='700 68px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),128,132)}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function addBall(n,x,z){const mesh=new THREE.Mesh(new THREE.SphereGeometry(ballR,32,20),new THREE.MeshStandardMaterial({map:texture(n,colors[n]),roughness:.23,metalness:.02}));mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);const body=new CANNON.Body({mass:.17,material:matBall,shape:new CANNON.Sphere(ballR),position:new CANNON.Vec3(x,table.y+.055+ballR,z),linearDamping:.11,angularDamping:.17,allowSleep:true,sleepSpeedLimit:.025,sleepTimeLimit:.8});world.addBody(body);balls.push({n,mesh,body,pocketed:false});return balls.at(-1)}
function clearBalls(){for(const b of balls){scene.remove(b.mesh);if(world.bodies.includes(b.body))world.removeBody(b.body)}balls.length=0}

let mode='practice', currentPlayer=0, groups=[null,null], shotPocketed=[], shotActive=false, scratch=false, gameOver=false, wasMoving=false;
const groupOf=n=>n>=1&&n<=7?'solid':n>=9&&n<=15?'stripe':null;
const groupLabel=g=>g==='solid'?'SOLIDS 1–7':g==='stripe'?'STRIPES 9–15':'OPEN';
function updateMatchHud(){matchHud.classList.toggle('hidden',mode!=='two');p1Card.classList.toggle('active',currentPlayer===0);p2Card.classList.toggle('active',currentPlayer===1);p1Group.textContent=groupLabel(groups[0]);p2Group.textContent=groupLabel(groups[1]);modeBtn.textContent=mode==='two'?'2P 8-BALL':'練習'}
function resetMatch(){currentPlayer=0;groups=[null,null];shotPocketed=[];shotActive=false;scratch=false;gameOver=false;wasMoving=false;updateMatchHud()}
function rack(){clearBalls();addBall(0,-table.w*.29,0);const order=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];let i=0;const startX=table.w*.18,dx=ballR*1.76,dz=ballR*2.04;for(let row=0;row<5;row++)for(let j=0;j<=row;j++)addBall(order[i++],startX+row*dx,(j-row/2)*dz);resetMatch();statusEl.textContent=mode==='two'?'PLAYER 1 のブレイク':'ドラッグで狙い、引いて、離してショット'}
rack();

const aimLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.72}));aimLine.visible=false;scene.add(aimLine);
const cueMesh=new THREE.Mesh(new THREE.CylinderGeometry(.011,.017,1.35,16),new THREE.MeshStandardMaterial({color:0xd7ad6d,roughness:.4}));cueMesh.visible=false;cueMesh.rotation.z=Math.PI/2;cueMesh.castShadow=true;scene.add(cueMesh);
let dragging=false,currentPoint=null,power=0;
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-(table.y+ballR+.06));
function pointOnTable(e){const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);const out=new THREE.Vector3();return ray.ray.intersectPlane(plane,out)?out:null}
function cueBall(){return balls.find(b=>b.n===0&&!b.pocketed)}
function allStopped(){return balls.every(b=>b.pocketed||b.body.velocity.length()<.055)}
function updateAim(){const cb=cueBall();if(!cb||!currentPoint){aimLine.visible=cueMesh.visible=false;return}const p=cb.mesh.position,dir=new THREE.Vector3(p.x-currentPoint.x,0,p.z-currentPoint.z);if(dir.lengthSq()<1e-5)return;dir.normalize();aimLine.geometry.setFromPoints([new THREE.Vector3(p.x,p.y+.01,p.z),new THREE.Vector3(p.x+dir.x*1.55,p.y+.01,p.z+dir.z*1.55)]);aimLine.visible=true;cueMesh.visible=true;cueMesh.position.set(p.x-dir.x*(.72+power*.52),p.y+.045,p.z-dir.z*(.72+power*.52));cueMesh.rotation.set(0,Math.atan2(dir.z,dir.x),Math.PI/2)}
function setPower(v){power=Math.max(0,Math.min(1,v));const pct=Math.round(power*100);powerFill.style.width=pct+'%';powerText.textContent=pct+'%'}
canvas.addEventListener('pointerdown',e=>{if(gameOver||!allStopped())return;const p=pointOnTable(e);if(!p)return;dragging=true;canvas.setPointerCapture(e.pointerId);currentPoint=p;setPower(0);updateAim();audio.ensure()});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const p=pointOnTable(e),cb=cueBall();if(!p||!cb)return;currentPoint=p;setPower(currentPoint.distanceTo(cb.mesh.position)/1.2);updateAim()});
canvas.addEventListener('pointerup',()=>{if(!dragging)return;dragging=false;const cb=cueBall();if(cb&&currentPoint&&power>.03){const dir=new THREE.Vector3(cb.mesh.position.x-currentPoint.x,0,cb.mesh.position.z-currentPoint.z).normalize();const impulse=.85+power*4.05;shotPocketed=[];scratch=false;shotActive=true;cb.body.wakeUp();cb.body.applyImpulse(new CANNON.Vec3(dir.x*impulse,0,dir.z*impulse));audio.cue(power);statusEl.textContent=mode==='two'?`PLAYER ${currentPlayer+1} ショット`:'ボール停止待ち'}setPower(0);aimLine.visible=cueMesh.visible=false});
canvas.addEventListener('wheel',e=>{e.preventDefault();camera.position.multiplyScalar(1+Math.sign(e.deltaY)*.022);camera.position.clampLength(2.8,7);camera.lookAt(0,0,0)},{passive:false});

const audio={ctx:null,on:true,lastClack:0,ensure(){if(!this.on)return;if(!this.ctx)this.ctx=new(window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume()},tone(f,d,v,type='sine'){if(!this.on)return;this.ensure();const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(this.ctx.destination);o.start(t);o.stop(t+d)},cue(p){this.tone(115+70*p,.045,.05+.07*p,'triangle')},clack(v){const now=performance.now();if(now-this.lastClack<28)return;this.lastClack=now;this.tone(430+Math.min(v,3)*110,.028,.02+Math.min(v,.18),'triangle')},pocket(){this.tone(115,.09,.07);setTimeout(()=>this.tone(70,.13,.045),45)}};
world.addEventListener('beginContact',ev=>{const a=balls.find(b=>b.body===ev.bodyA),b=balls.find(b=>b.body===ev.bodyB);if(a&&b){const rel=ev.bodyA.velocity.vsub(ev.bodyB.velocity).length();if(rel>.18)audio.clack(rel)}});

function restoreCue(){const b=balls.find(x=>x.n===0);if(!b||!b.pocketed)return;b.pocketed=false;b.body.position.set(-table.w*.29,table.y+.055+ballR,0);b.body.velocity.setZero();b.body.angularVelocity.setZero();b.mesh.visible=true;if(!world.bodies.includes(b.body))world.addBody(b.body)}
function pocketCheck(){for(const b of balls){if(b.pocketed)continue;const p=b.body.position;for(const [x,z] of pockets){if(Math.hypot(p.x-x,p.z-z)<pocketR*.82){b.pocketed=true;b.mesh.visible=false;if(world.bodies.includes(b.body))world.removeBody(b.body);audio.pocket();if(shotActive){shotPocketed.push(b.n);if(b.n===0)scratch=true}break}}}}
function remainingFor(g){return balls.filter(b=>groupOf(b.n)===g&&!b.pocketed).length}
function resolveShot(){if(!shotActive||mode!=='two')return;shotActive=false;const object=shotPocketed.filter(n=>n!==0&&n!==8), eight=shotPocketed.includes(8);
if(eight){const g=groups[currentPlayer];const legal=g&&remainingFor(g)===0&&!scratch;gameOver=true;statusEl.textContent=legal?`PLAYER ${currentPlayer+1} WIN! 8番を沈めました`:`PLAYER ${currentPlayer===0?2:1} WIN! 8番が早すぎました`;return}
if(!groups[currentPlayer]&&object.length){const g=groupOf(object[0]);groups[currentPlayer]=g;groups[1-currentPlayer]=g==='solid'?'stripe':'solid'}
const own=groups[currentPlayer];const scored=object.some(n=>!own||groupOf(n)===own);if(scratch){restoreCue();currentPlayer=1-currentPlayer;statusEl.textContent=`スクラッチ → PLAYER ${currentPlayer+1}`}else if(scored){statusEl.textContent=`PLAYER ${currentPlayer+1} 続行`}else{currentPlayer=1-currentPlayer;statusEl.textContent=`PLAYER ${currentPlayer+1} の番`}updateMatchHud()}

resetBtn.addEventListener('click',()=>{audio.ensure();rack()});
cameraBtn.addEventListener('click',()=>{view=(view+1)%views.length;applyCamera()});
soundBtn.addEventListener('click',()=>{audio.on=!audio.on;soundBtn.textContent=audio.on?'SOUND ON':'SOUND OFF';if(audio.on)audio.ensure()});
modeBtn.addEventListener('click',()=>{mode=mode==='practice'?'two':'practice';rack();updateMatchHud()});

let last=performance.now(),acc=0;const fixed=1/120;
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.05,(now-last)/1000);last=now;acc+=dt;while(acc>=fixed){world.step(fixed);for(const b of balls){if(b.pocketed)continue;const v=b.body.velocity,s=Math.hypot(v.x,v.z);if(s<.012){v.x=0;v.z=0}else{const rr=Math.max(0,1-.34*fixed);v.x*=rr;v.z*=rr}if(Math.abs(v.y)<.03)v.y=0}pocketCheck();acc-=fixed}for(const b of balls){if(!b.pocketed){b.mesh.position.copy(b.body.position);b.mesh.quaternion.copy(b.body.quaternion)}}const moving=!allStopped();if(wasMoving&&!moving){if(mode==='two')resolveShot();else if(scratch){restoreCue();scratch=false}}wasMoving=moving;renderer.render(scene,camera)}
requestAnimationFrame(animate);
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();updateMatchHud();
