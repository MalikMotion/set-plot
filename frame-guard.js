(function(){ if(window.top===window.self) return; var ok=false;
  try{ ok=window.top.location.origin===location.origin; }catch(e){ ok=false; }
  if(ok) return; document.documentElement.style.display='none';
  try{ window.top.location.href=location.href; }catch(e){} })();
