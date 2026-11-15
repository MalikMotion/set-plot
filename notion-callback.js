/* Notion sends the person back here after they allow Set Plot. Hand the one-time code to the Set Plot tab that opened this
   window (same site only), then close. The code is useless without Set Plot's server, which swaps it for the Notion key. */
(function(){ var q=new URLSearchParams(location.search), m=document.getElementById('m');
  var msg={notion:{code:q.get('code')||'',state:q.get('state')||'',error:q.get('error')||''}};
  try{ history.replaceState(null,'',location.pathname); }catch(e){}
  try{ localStorage.setItem('setplot-notion-cb',JSON.stringify({code:msg.notion.code,state:msg.notion.state,error:msg.notion.error,at:Date.now()})); }catch(e){}   /* if Notion's pages cut the link to the opener, the Set Plot tab hears this instead */
  if(window.opener && !window.opener.closed){ try{ window.opener.postMessage(msg,location.origin); }catch(e){} m.textContent=msg.notion.error?'Notion wasn’t connected. You can close this window.':'Notion is connected. You can close this window.'; setTimeout(function(){ window.close(); },400); }
  else { m.textContent=msg.notion.error?'Notion wasn’t connected. You can close this window.':'Notion is connected. You can close this window and go back to Set Plot.'; setTimeout(function(){ window.close(); },600); } })();
