// v1.3.2: keep STEP 1 camera on a stable elevation.
// One-finger / normal mouse drag rotates only around the table vertically (yaw).
// Pinch, two-finger pan, Shift-drag and Ctrl-drag keep their existing behavior.

const canvas=document.querySelector('#game');
if(canvas){
  const activePointers=new Map();
  const syntheticEvents=new WeakSet();

  canvas.addEventListener('pointerdown',e=>{
    if(document.body.dataset.phase!=='view')return;
    activePointers.set(e.pointerId,{y:e.clientY});
  },{capture:true});

  const end=e=>activePointers.delete(e.pointerId);
  canvas.addEventListener('pointerup',end,{capture:true});
  canvas.addEventListener('pointercancel',end,{capture:true});

  canvas.addEventListener('pointermove',e=>{
    if(syntheticEvents.has(e))return;
    if(document.body.dataset.phase!=='view')return;
    if(!activePointers.has(e.pointerId))return;
    if(activePointers.size!==1)return; // preserve two-finger pan / pinch
    if(e.shiftKey||e.ctrlKey)return; // preserve desktop pan / axis controls

    const state=activePointers.get(e.pointerId);
    e.stopImmediatePropagation();
    e.preventDefault();

    const clone=new PointerEvent('pointermove',{
      bubbles:true,
      cancelable:true,
      composed:true,
      pointerId:e.pointerId,
      pointerType:e.pointerType,
      isPrimary:e.isPrimary,
      clientX:e.clientX,
      clientY:state.y,
      screenX:e.screenX,
      screenY:e.screenY,
      button:e.button,
      buttons:e.buttons,
      pressure:e.pressure,
      width:e.width,
      height:e.height,
      tiltX:e.tiltX,
      tiltY:e.tiltY,
      twist:e.twist,
      ctrlKey:e.ctrlKey,
      shiftKey:e.shiftKey,
      altKey:e.altKey,
      metaKey:e.metaKey
    });
    syntheticEvents.add(clone);
    canvas.dispatchEvent(clone);
  },{capture:true,passive:false});
}
