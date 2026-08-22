// Safe production runtime loader.
// Try the new 1P/2P core first. If module evaluation fails, fall back to the last stable core.
const statusEl=document.querySelector('#status');
const versionPanel=document.querySelector('#versionPanel');
try{
  await import('./main12.js?v=1.3.1');
  document.documentElement.dataset.runtime='main12';
}catch(err){
  console.error('main12 failed; falling back to main11',err);
  document.documentElement.dataset.runtime='main11-fallback';
  if(statusEl)statusEl.textContent='安定版コアで起動しました';
  if(versionPanel)versionPanel.textContent+=' · CORE FALLBACK';
  await import('./main11.js?v=1.3.1-fallback');
}
