// Opt-in diagnostic. Measures render submission, excluding the display's scanout.
export function createTouchTiming(enabled){
  let sample=null;
  return {
    press(event,action){
      if(!enabled||event.pointerType!=='touch')return;
      sample={start:event.timeStamp,accepted:performance.now(),action};
    },
    consume(input,online,seq){
      if(!sample||sample.received||!input.pressedActions?.includes(sample.action))return;
      if(online&&seq==null)return;
      sample.received=performance.now();
      sample.seq=online?seq:null;
    },
    rendered(ack){
      if(!sample?.received||sample.seq!==null&&!(ack>=sample.seq))return;
      performance.measure('touch-to-render',{start:sample.start,end:performance.now(),
        detail:{action:sample.action,online:sample.seq!==null,dispatchMs:sample.accepted-sample.start,inputMs:sample.received-sample.accepted}});
      sample=null;
    },
    reset(){sample=null;},
  };
}
