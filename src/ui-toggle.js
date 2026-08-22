// v1.3.3 HUD visibility toggle
const style=document.createElement('style');
style.textContent=`
  #uiVisibilityToggle{
    position:fixed;
    right:max(12px,env(safe-area-inset-right));
    top:50%;
    transform:translateY(-50%);
    z-index:60;
    min-width:48px;
    padding:9px 10px;
    border-radius:999px;
    border:1px solid rgba(255,255,255,.2);
    background:rgba(4,12,10,.72);
    color:#fff;
    font:800 10px/1 system-ui,-apple-system,sans-serif;
    letter-spacing:.06em;
    backdrop-filter:blur(9px);
    -webkit-backdrop-filter:blur(9px);
    box-shadow:0 6px 20px rgba(0,0,0,.3);
    touch-action:manipulation;
  }
  body.ui-hidden .hud,
  body.ui-hidden #versionToggle,
  body.ui-hidden #versionPanel{
    opacity:0!important;
    visibility:hidden!important;
    pointer-events:none!important;
  }
  body.ui-hidden #uiVisibilityToggle{
    background:rgba(12,105,80,.9);
  }
  .hud,#versionToggle,#versionPanel{
    transition:opacity .16s ease,visibility .16s ease;
  }
`;
document.head.appendChild(style);

const btn=document.createElement('button');
btn.id='uiVisibilityToggle';
btn.type='button';
btn.setAttribute('aria-pressed','false');
btn.setAttribute('aria-label','UIを非表示');
btn.textContent='UI OFF';
document.body.appendChild(btn);

let hidden=false;
function render(){
  document.body.classList.toggle('ui-hidden',hidden);
  btn.setAttribute('aria-pressed',String(hidden));
  btn.setAttribute('aria-label',hidden?'UIを表示':'UIを非表示');
  btn.textContent=hidden?'UI ON':'UI OFF';
}
btn.addEventListener('click',e=>{
  e.stopPropagation();
  hidden=!hidden;
  render();
});
render();

window.__billiardsUiToggle={
  isHidden:()=>hidden,
  setHidden(value){hidden=!!value;render();}
};
