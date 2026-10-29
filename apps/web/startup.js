(()=>{
 const originNote=document.querySelector('#launch-origin-note');if(originNote)originNote.hidden=location.hostname!=='shinobi-arena-online.onrender.com';
 const splash=document.querySelector('#startup-splash'),status=document.querySelector('#startup-status'),detail=document.querySelector('#startup-detail'),game=document.querySelector('#game');
 if(!splash)return;let ready=document.documentElement.dataset.gameReady==='true',online=false,offline=false,done=false,trying=false,timer,start=performance.now(),attempts=0;
 const announce=(text,extra)=>{status.textContent=text;detail.textContent=extra;};
 function finish(){if(done||!ready||!online&&!offline)return;done=true;clearTimeout(timer);splash.hidden=true;document.body.dataset.startupState=offline?'offline':'ready';game.inert=Boolean(document.querySelector('#rotate')&&!document.querySelector('#rotate').hidden);document.querySelector('#play')?.focus({preventScroll:true});}
 document.addEventListener('arena:ready',()=>{ready=true;finish();},{once:true});
 document.querySelector('#startup-offline').onclick=()=>{offline=true;announce('Preparing offline play…','CPU, local matches and training do not need the online server.');finish();};
 document.querySelector('#startup-retry').onclick=()=>{if(!ready){location.reload();return;}start=performance.now();attempts=0;clearTimeout(timer);check();};
 const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&!new URLSearchParams(location.search).has('warmup');
 async function check(){
  if(done||trying)return;trying=true;attempts++;const controller=new AbortController(),deadline=setTimeout(()=>controller.abort(),8000);
  try{const config=await fetch('./online-config.json',{cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():{});let origin=location.origin;if(!config.sameOrigin){if(!config.url){offline=true;announce('Offline arena ready','Online play is not configured for this build.');finish();return;}const url=new URL(config.url);if(url.username||url.password||!['http:','https:','ws:','wss:'].includes(url.protocol))throw new Error('Invalid server configuration');url.protocol=url.protocol==='ws:'?'http:':url.protocol==='wss:'?'https:':url.protocol;origin=url.origin;}
   announce(attempts===1?'Waking the online arena…':'The battlefield is still warming up…','Free hosting can take a little time to wake. You can play offline while you wait.');
   const response=await fetch(origin+'/health',{cache:'no-store',signal:controller.signal});if(response.ok&&(await response.json()).ok===true){online=true;announce(ready?'Arena ready':'Loading game assets…','Preparing fighters, controls and sound.');finish();}
  }catch{announce('The battlefield is still warming up…','We will retry automatically. Offline play remains available.');}
  finally{clearTimeout(deadline);trying=false;if(!done&&!online){if(performance.now()-start<180000)timer=setTimeout(check,2500);else announce('The online server is taking longer than usual.','Try again, or enter offline play. No match has been joined.');}}
 }
 if(local){online=true;finish();}else check();
 setTimeout(()=>{if(!done&&!ready)announce('Game assets are taking longer to load.','Use Retry to reload the game files.');},20000);
})();
