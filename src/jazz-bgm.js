const JAZZ_URL='./assets/audio/bgm/jazz-improv-looped-cc0.mp3';

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
const audioState=rt.audio;
const musicBtn=document.querySelector('#musicBtn');

const jazz=new Audio(JAZZ_URL);
jazz.preload='auto';
jazz.loop=true;
jazz.playsInline=true;
jazz.volume=.14;

let wanted=false;

function syncButton(){
  if(musicBtn)musicBtn.textContent=wanted&&!jazz.paused?'JAZZ ON':'JAZZ OFF';
}

async function playJazz(){
  wanted=true;
  audioState.musicOn=true;
  try{
    jazz.muted=false;
    if(jazz.readyState===0)jazz.load();
    await jazz.play();
  }catch(err){
    console.warn('Local jazz BGM could not start yet.',err);
  }
  syncButton();
}

function stopJazz(){
  wanted=false;
  audioState.musicOn=false;
  jazz.pause();
  syncButton();
}

// Clean runtime hook.
audioState.musicToggle=()=>{
  if(wanted||!jazz.paused)stopJazz();
  else playJazz();
};

// IMPORTANT for iOS/Safari: call play() directly from the user's click gesture.
// Capture phase prevents any stale handler from consuming the same button press.
musicBtn?.addEventListener('click',e=>{
  e.preventDefault();
  e.stopImmediatePropagation();
  if(wanted||!jazz.paused)stopJazz();
  else void playJazz();
},{capture:true});

function unlock(){
  if(jazz.readyState===0)jazz.load();
}
for(const type of ['pointerdown','touchstart','keydown']){
  window.addEventListener(type,unlock,{capture:true,passive:true,once:true});
}

document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    jazz.pause();
  }else if(wanted){
    jazz.play().then(syncButton).catch(()=>syncButton());
  }
});

jazz.addEventListener('play',syncButton);
jazz.addEventListener('pause',syncButton);
window.__billiardsJazz={audio:jazz,play:playJazz,stop:stopJazz};
