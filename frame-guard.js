(function(){ if(window.top===window.self) return; var ok=false;
  if(!/admin/.test(location.pathname) && /^[?]view=[A-Za-z0-9_-]{16,64}(&embed=1)?$/.test(location.search)) return;
  try{ ok=window.top.location.origin===location.origin; }catch(e){ ok=false; }
  if(ok) return; document.documentElement.style.display='none';
  try{ window.top.location.href=location.href; }catch(e){} })();
