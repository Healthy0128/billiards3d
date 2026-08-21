import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

const canvas = document.querySelector('#game');
const statusEl = document.querySelector('#status');
const powerFill = document.querySelector('#powerFill');
const resetBtn = document.querySelector('#resetBtn');
const cameraBtn = document.querySelector('#cameraBtn');
const soundBtn = document.querySelector('#soundBtn');

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050807);
scene.fog = new THREE.FogExp2(0x050807, 0.08);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 50);
const cameraViews = [
  {p:[0,3.65,3.95], t:[0,0,0]},
  {p:[0,5.25,0.06], t:[0,0,0]},
  {p:[3.55,2.35,0], t:[0,0,0]},
];
let cameraView = 0;
function applyCamera(){
  const v=cameraViews[cameraView]; camera.position.set(...v.p); camera.lookAt(...v.t);
}
applyCamera();

scene.add(new THREE.HemisphereLight(0xbfe7ff,0x17110c,0.55));
const key = new THREE.SpotLight(0xfff2d2,75,10,0.68,0.55,1.2); key.position.set(0,4.7,0); key.target.position.set(0,0,0); key.castShadow=true; key.shadow.mapSize.set(1024,1024); scene.add(key,key.target);
const rim = new THREE.PointLight(0x77aaff,8,7); rim.position.set(-3,2,2.6); scene.add(rim);

const world = new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.solver.iterations = 12;
world.solver.tolerance = 0.001;

const matBall = new CANNON.Material('ball');
const matCloth = new CANNON.Material('cloth');
const matRail = new CANNON.Material('rail');
world.addContactMaterial(new CANNON.ContactMaterial(matBall,matBall,{friction:0.025,restitution:0.94,contactEquationStiffness:1e8}));
world.addContactMaterial(new CANNON.ContactMaterial(matBall,matCloth,{friction:0.22,restitution:0.08}));
world.addContactMaterial(new CANNON.ContactMaterial(matBall,matRail,{friction:0.08,restitution:0.78}));

const table = {w:2.84,h:1.42, y:0.72, rail:0.105};
const ballR = 0.05715;
const pocketR = 0.095;
const balls=[];
const pockets=[
  [-table.w/2, -table.h/2], [0,-table.h/2-0.005], [table.w/2,-table.h/2],
  [-table.w/2, table.h/2], [0,table.h/2+0.005], [table.w/2,table.h/2]
];

function boxMesh(size,color,rough=.65,metal=.05){
  const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal}));m.castShadow=true;m.receiveShadow=true;return m;
}
const floor=boxMesh([8,.18,7],0x17130f,.92,0);floor.position.y=-0.1;scene.add(floor);
const floorBody=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(4,.09,3.5)),position:new CANNON.Vec3(0,-.1,0)});world.addBody(floorBody);

const base=boxMesh([table.w+0.42,.25,table.h+0.42],0x3b1d0b,.42,.08);base.position.y=table.y-.18;scene.add(base);
const cloth=boxMesh([table.w,.055,table.h],0x0d5b42,.9,0);cloth.position.y=table.y;scene.add(cloth);
const clothBody=new CANNON.Body({mass:0,material:matCloth,shape:new CANNON.Box(new CANNON.Vec3(table.w/2,.0275,table.h/2)),position:new CANNON.Vec3(0,table.y,0)});world.addBody(clothBody);

function addRail(x,z,sx,sz){
  const mesh=boxMesh([sx,.18,sz],0x47230d,.4,.06);mesh.position.set(x,table.y+.12,z);scene.add(mesh);
  const body=new CANNON.Body({mass:0,material:matRail,shape:new CANNON.Box(new CANNON.Vec3(sx/2,.09,sz/2)),position:new CANNON.Vec3(x,table.y+.12,z)});world.addBody(body);
}
const sideGap=.18;
addRail(-table.w/4-.04,-table.h/2-table.rail/2,table.w/2-sideGap,table.rail);
addRail(table.w/4+.04,-table.h/2-table.rail/2,table.w/2-sideGap,table.rail);
addRail(-table.w/4-.04, table.h/2+table.rail/2,table.w/2-sideGap,table.rail);
addRail(table.w/4+.04, table.h/2+table.rail/2,table.w/2-sideGap,table.rail);
addRail(-table.w/2-table.rail/2,-table.h/4-.03,table.rail,table.h/2-sideGap);
addRail(-table.w/2-table.rail/2, table.h/4+.03,table.rail,table.h/2-sideGap);
addRail( table.w/2+table.rail/2,-table.h/4-.03,table.rail,table.h/2-sideGap);
addRail( table.w/2+table.rail/2, table.h/4+.03,table.rail,table.h/2-sideGap);

for(const [x,z] of pockets){
  const ring=new THREE.Mesh(new THREE.CylinderGeometry(pocketR*1.12,pocketR*1.12,.025,28),new THREE.MeshStandardMaterial({color:0x050505,roughness:.7}));ring.position.set(x,table.y+.04,z);scene.add(ring);
}

const BALL_COLORS=[0xffffff,0xf5d90a,0x174fb9,0xd8241b,0x6a2aa8,0xee6b18,0x13834f,0x6f1919,0x111111,0xf5d90a,0x174fb9,0xd8241b,0x6a2aa8,0xee6b18,0x13834f,0x6f1919];
function ballTexture(n,color){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#'+new THREE.Color(color).getHexString();g.fillRect(0,0,256,256);
  if(n>8){g.fillStyle='#f7f4ea';g.fillRect(0,62,256,132)}
  if(n>0){g.beginPath();g.arc(128,128,52,0,Math.PI*2);g.fillStyle='#f7f4ea';g.fill();g.fillStyle='#111';g.font='700 68px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),128,132)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function addBall(n,x,z){
  const geo=new THREE.SphereGeometry(ballR,32,20);
  const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:ballTexture(n,BALL_COLORS[n]),roughness:.23,metalness:.02}));
  mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  const body=new CANNON.Body({mass:.17,material:matBall,shape:new CANNON.Sphere(ballR),position:new CANNON.Vec3(x,table.y+.055+ballR,z),linearDamping:.11,angularDamping:.17,allowSleep:true,sleepSpeedLimit:.025,sleepTimeLimit:.8});
  world.addBody(body);balls.push({n,mesh,body,pocketed:false});return balls.at(-1);
}

function clearBalls(){for(const b of balls){scene.remove(b.mesh);world.removeBody(b.body)}balls.length=0}
function rack(){
  clearBalls();
  addBall(0,-table.w*.29,0);
  const order=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];
  let idx=0; const startX=table.w*.18; const dx=ballR*1.76; const dz=ballR*2.04;
  for(let row=0;row<5;row++) for(let j=0;j<=row;j++){
    const x=startX+row*dx; const z=(j-row/2)*dz; addBall(order[idx++],x,z);
  }
  statusEl.textContent='ドラッグして狙い、離してショット';
}
rack();

const aimMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.72});
const aimGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
const aimLine=new THREE.Line(aimGeo,aimMat);aimLine.visible=false;scene.add(aimLine);
const cueMat=new THREE.MeshStandardMaterial({color:0xd7ad6d,roughness:.4});
const cueMesh=new THREE.Mesh(new THREE.CylinderGeometry(.011,.017,1.35,16),cueMat);cueMesh.visible=false;cueMesh.rotation.z=Math.PI/2;cueMesh.castShadow=true;scene.add(cueMesh);

let dragging=false,startPoint=null,currentPoint=null,power=0;
const raycaster=new THREE.Raycaster(); const pointer=new THREE.Vector2(); const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-(table.y+ballR+.06));
function pointerToTable(e){
  const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const out=new THREE.Vector3();return raycaster.ray.intersectPlane(plane,out)?out:null;
}
function cueBall(){return balls.find(b=>b.n===0&&!b.pocketed)}
function allStopped(){return balls.every(b=>b.pocketed||b.body.velocity.length()<.055)}
function updateAim(){
  const cb=cueBall(); if(!cb||!currentPoint){aimLine.visible=cueMesh.visible=false;return}
  const p=cb.mesh.position; const dir=new THREE.Vector3(p.x-currentPoint.x,0,p.z-currentPoint.z); if(dir.lengthSq()<1e-5)return;dir.normalize();
  const pts=[new THREE.Vector3(p.x,p.y+.01,p.z),new THREE.Vector3(p.x+dir.x*1.55,p.y+.01,p.z+dir.z*1.55)];aimLine.geometry.setFromPoints(pts);aimLine.visible=true;
  cueMesh.visible=true;cueMesh.position.set(p.x-dir.x*(.78+power*.45),p.y+.045,p.z-dir.z*(.78+power*.45));cueMesh.rotation.set(0,Math.atan2(dir.z,dir.x),Math.PI/2);
}
canvas.addEventListener('pointerdown',e=>{if(!allStopped())return;const p=pointerToTable(e);if(!p)return;dragging=true;canvas.setPointerCapture(e.pointerId);startPoint=p.clone();currentPoint=p.clone();power=0;updateAim();audio.ensure();});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const p=pointerToTable(e);if(!p)return;currentPoint=p;const cb=cueBall();if(!cb)return;power=Math.min(1,currentPoint.distanceTo(cb.mesh.position)/1.25);powerFill.style.width=`${Math.round(power*100)}%`;updateAim();});
canvas.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;const cb=cueBall();if(cb&&currentPoint&&power>.03){const dir=new THREE.Vector3(cb.mesh.position.x-currentPoint.x,0,cb.mesh.position.z-currentPoint.z).normalize();const impulse=1.0+power*3.8;cb.body.wakeUp();cb.body.applyImpulse(new CANNON.Vec3(dir.x*impulse,0,dir.z*impulse));audio.cue(power);statusEl.textContent='ボール停止後に次のショット';}power=0;powerFill.style.width='0%';aimLine.visible=cueMesh.visible=false;});

canvas.addEventListener('wheel',e=>{e.preventDefault();const d=Math.sign(e.deltaY)*.28;camera.position.multiplyScalar(1+d*.08);camera.position.clampLength(2.8,7.0);camera.lookAt(0,0,0);},{passive:false});

const audio={
  ctx:null,on:true,lastClack:0,
  ensure(){if(!this.on)return;if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();},
  tone(freq,dur,vol,type='sine'){if(!this.on)return;this.ensure();const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(this.ctx.destination);o.start(t);o.stop(t+dur)},
  cue(p){this.tone(115+70*p,.045,.05+.07*p,'triangle')},
  clack(v){const now=performance.now();if(now-this.lastClack<28)return;this.lastClack=now;this.tone(430+Math.min(v,3)*110,.028,.02+Math.min(v,.18),'triangle')},
  pocket(){this.tone(115,.09,.07,'sine');setTimeout(()=>this.tone(70,.13,.045,'sine'),45)}
};
world.addEventListener('beginContact',ev=>{const a=balls.find(b=>b.body===ev.bodyA),b=balls.find(b=>b.body===ev.bodyB);if(a&&b){const rel=ev.bodyA.velocity.vsub(ev.bodyB.velocity).length();if(rel>.18)audio.clack(rel)}});

resetBtn.addEventListener('click',()=>{audio.ensure();rack()});
cameraBtn.addEventListener('click',()=>{cameraView=(cameraView+1)%cameraViews.length;applyCamera()});
soundBtn.addEventListener('click',()=>{audio.on=!audio.on;soundBtn.textContent=audio.on?'SOUND ON':'SOUND OFF';if(audio.on)audio.ensure()});

function pocketCheck(){
  for(const b of balls){if(b.pocketed)continue;const p=b.body.position;for(const [x,z] of pockets){const d=Math.hypot(p.x-x,p.z-z);if(d<pocketR*.82){b.pocketed=true;audio.pocket();if(b.n===0){setTimeout(()=>{b.pocketed=false;b.body.position.set(-table.w*.29,table.y+.055+ballR,0);b.body.velocity.setZero();b.body.angularVelocity.setZero();b.mesh.visible=true;world.addBody(b.body);statusEl.textContent='手球を戻しました';},650)}b.mesh.visible=false;world.removeBody(b.body);break}}}
}

let last=performance.now(),acc=0;const fixed=1/120;
function animate(now){
  requestAnimationFrame(animate);const dt=Math.min(.05,(now-last)/1000);last=now;acc+=dt;
  while(acc>=fixed){world.step(fixed);for(const b of balls){if(b.pocketed)continue;const v=b.body.velocity;const speed=Math.hypot(v.x,v.z);if(speed<.012){v.x=0;v.z=0;} else {const rr=Math.max(0,1-.34*fixed);v.x*=rr;v.z*=rr;} if(Math.abs(v.y)<.03)v.y=0;}pocketCheck();acc-=fixed}
  for(const b of balls){if(b.pocketed)continue;b.mesh.position.copy(b.body.position);b.mesh.quaternion.copy(b.body.quaternion)}
  if(allStopped()&&!dragging)statusEl.textContent='ドラッグして狙い、離してショット';
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
