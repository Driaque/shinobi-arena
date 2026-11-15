import {PROTOCOL_VERSION,RULES_VERSION} from './packages/network/protocol.js';

// Keep the match capability in memory for the lifetime of this page.
export function matchSocket(url,{Socket=WebSocket,token,onWaiting=()=>{}}={}){
 const events=new EventTarget(),page=globalThis.document,view=globalThis.window;
 let ws,retry,attempt,stopped=false,openingResume=false,match=null,deadline=0;
 function clearTimers(){clearTimeout(retry);clearTimeout(attempt);}
 function drop(){const old=ws;ws=null;if(old&&old.readyState!==Socket.CLOSED)old.close();}
 function close(){
  if(stopped)return;
  stopped=true;clearTimers();
  page?.removeEventListener?.('visibilitychange',visibility);
  view?.removeEventListener('pageshow',visibility);
  view?.removeEventListener('pagehide',interrupt);
  view?.removeEventListener('online',visibility);
  if(ws&&ws.readyState!==Socket.CLOSED)ws.close();
  else events.dispatchEvent(new Event('close'));
 }
 function expired(){
  events.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({
   type:'error',message:'Could not reconnect before the match expired. Return to the lobby to play again.'
  })}));
 }
 function schedule(){
  if(stopped||retry||ws||page?.hidden)return;
  if(Date.now()>=deadline){expired();return;}
  retry=setTimeout(()=>{retry=null;connect(true);},750);
 }
 function interrupt(){
  if(stopped||!match)return false;
  if(!deadline){deadline=Date.now()+match.reconnectMs;onWaiting();}
  clearTimers();retry=null;drop();schedule();return true;
 }
 function visibility(){
  if(page.hidden){if(ws)interrupt();return;}
  if(deadline&&!ws&&!stopped){clearTimeout(retry);retry=null;connect(true);}
 }
 function connect(resuming=false){
  if(resuming&&Date.now()>=deadline){expired();return;}
  openingResume=resuming;
  let current;
  try{current=ws=new Socket(url);}catch(error){if(!resuming)throw error;schedule();return;}
  if(resuming)attempt=setTimeout(interrupt,Math.min(5000,deadline-Date.now()));
  current.addEventListener('open',()=>{if(ws===current&&!resuming)events.dispatchEvent(new Event('open'));});
  current.addEventListener('message',event=>{
   if(ws!==current||stopped)return;
   let message;try{message=JSON.parse(event.data);}catch{return;}
   if(resuming&&message?.type==='hello'&&message.protocol===PROTOCOL_VERSION&&message.rules===RULES_VERSION){
    current.send(JSON.stringify({type:'resume',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,token,id:match.id,resumeKey:match.key}));
    return;
   }
   if(message?.type==='matched'){
    clearTimers();openingResume=false;deadline=0;
    match=message.resumeKey&&message.reconnectMs>0?{id:message.id,key:message.resumeKey,reconnectMs:message.reconnectMs}:null;
   }
   if(message?.phase==='matchOver')match=null;
   events.dispatchEvent(new MessageEvent('message',{data:event.data}));
   if(message?.type==='matched'&&page?.hidden)interrupt();
  });
  for(const type of ['close','error'])current.addEventListener(type,()=>{
   if(ws!==current)return;
   if(!stopped&&interrupt())return;
   events.dispatchEvent(new Event(type));
  });
 }
 connect();
 page?.addEventListener?.('visibilitychange',visibility);
 view?.addEventListener('pageshow',visibility);
 view?.addEventListener('pagehide',interrupt);
 view?.addEventListener('online',visibility);
 return {
  addEventListener:events.addEventListener.bind(events),close,interrupt,
  send(data){ws?.send(data);},
  get readyState(){return openingResume||deadline?Socket.CONNECTING??0:ws?.readyState??Socket.CLOSED;}
 };
}
