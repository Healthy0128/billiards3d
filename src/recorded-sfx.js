const SHOT_URL='./assets/audio/sfx/pool-shots-cc0.mp3';
const RACK_URL='./assets/audio/sfx/racking-pool-balls-cc0.wav';

function waitForRuntime(){
  return new Promise(resolve=>{
    const check=()=>{
      const rt=window.__billiardsRuntime;
      if(rt?.audio){resolve(rt);return;}
      setTimeout(check,25);
    };
    check();
  });
}

const rt=await waitForRuntime();
const audio=rt.audio;

const shotTemplate=new Audio(SHOT_URL);
shotTemplate.preload='auto';
shotTemplate.playsInline=true;
const rackTemplate=new Audio(RACK_URL);
rackTemplate.preload='auto';
rackTemplate.playsInline=true;

let unlocked=false;
let lastClack=0;

function unlockMedia(){
  if(unlocked)return;
  unlocked=true;
  for(const template of [shotTemplate,rackTemplate]){
    const previousMuted=template.muted;
    template.muted=true;
    const promise=template.play();
    if(promise?.then){
      promise.then(()=>{
        template.pause();
        template.currentTime=0;
        template.muted=previousMuted;
      }).catch(()=>{template.muted=previousMuted;});
    }
  }
}

for(const type of ['pointerdown','touchstart','keydown']){
  window.addEventListener(type,unlockMedia,{capture:true,passive:true,once:true});
}

function playOneShot(template,{volume=.5,rate=1,start=.02,duration=.58}={}){
  if(!audio.on)return;
  unlockMedia();
  const node=template.cloneNode(true);
  node.preload='auto';
  node.volume=Math.max(0,Math.min(1,volume));
  node.playbackRate=Math.max(.7,Math.min(1.35,rate));
  const launch=()=>{
    try{node.currentTime=start}catch{}
    const p=node.play();
    p?.catch?.(()=>{});
    window.setTimeout(()=>{
      node.pause();
      try{node.currentTime=0}catch{}
    },Math.max(120,duration*1000));
  };
  if(node.readyState>=1)launch();
  else node.addEventListener('loadedmetadata',launch,{once:true});
}

function playRack(){
  if(!audio.on)return;
  unlockMedia();
  const node=rackTemplate.cloneNode(true);
  node.volume=.42;
  node.playbackRate=.98;
  node.play().catch(()=>{});
  window.setTimeout(()=>node.pause(),1800);
}

// Replace synthesized billiard impacts with the bundled CC0 real recording.
audio.cue=p=>{
  const strength=Math.max(0,Math.min(1,p||0));
  playOneShot(shotTemplate,{volume:.30+strength*.28,rate:.94+strength*.08,start:.02,duration:.62});
};

audio.clack=v=>{
  const now=performance.now();
  if(now-lastClack<24)return;
  lastClack=now;
  const impact=Math.max(0,Math.min(1,(v||0)/2.8));
  playOneShot(shotTemplate,{volume:.16+impact*.34,rate:.90+impact*.16,start:.02,duration:.48});
};

audio.pocket=()=>{
  // Keep the source physically real, but lower/slower it to emphasize the pocket drop.
  playOneShot(shotTemplate,{volume:.34,rate:.82,start:.02,duration:.78});
};

// Racking is a separate real recording.
document.querySelector('#resetBtn')?.addEventListener('click',playRack);
document.querySelector('#modeBtn')?.addEventListener('click',playRack);

// SOUND ON doubles as an audible verification of the real recording.
document.querySelector('#soundBtn')?.addEventListener('click',()=>{
  window.setTimeout(()=>{
    if(audio.on)playOneShot(shotTemplate,{volume:.24,rate:1,start:.02,duration:.45});
  },0);
});

window.__billiardsRecordedSfx={shotTemplate,rackTemplate,playOneShot,playRack};
