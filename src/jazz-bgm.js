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

async function playJazz(){
  wanted=true;
  audioState.musicOn=true;
  if(musicBtn)musicBtn.textContent='JAZZ ON';
  try{
    jazz.muted=false;
    await jazz.play();
  }catch(err){
    console.warn('Local jazz BGM could not start yet.',err);
  }
}

function stopJazz(){
  wanted=false;
  audioState.musicOn=false;
  jazz.pause();
  if(musicBtn)musicBtn.textContent='JAZZ OFF';
}

// Replace the synthesized timer-based jazz with a real local recording.
audioState.musicToggle=()=>{
  if(wanted||!jazz.paused)stopJazz();
  else playJazz();
};

// iOS/Safari: prepare the media element on the first explicit gesture.
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
    jazz.play().catch(()=>{});
  }
});

window.__billiardsJazz={audio:jazz,play:playJazz,stop:stopJazz};
