export const STAGES=Object.freeze([
 {id:'skyglass',name:'Skyglass Terrace',description:'Open sky, ancient stone and floating lights.',sky:'#173548',ground:'#29454b',accent:'#8de1d3'},
 {id:'frost',name:'Frostbound Pass',description:'Snowy peaks, ice spires and a northern aurora.',sky:'#101d3c',ground:'#465e79',accent:'#a1e6ff'},
 {id:'forge',name:'Ember Forge',description:'A volcanic foundry above glowing molten channels.',sky:'#321c29',ground:'#473139',accent:'#ffa366'},
 {id:'grove',name:'Moonlit Grove',description:'An ancient woodland beneath a silver moon.',sky:'#101f2b',ground:'#263c38',accent:'#b5dfbe'},
 {id:'court',name:'Sunken Court',description:'A flooded courtyard framed by turquoise ruins.',sky:'#143c4d',ground:'#2d656c',accent:'#8ce9e6'},
]);
export const stageFor=id=>STAGES.find(s=>s.id===id)??STAGES[0];
export function resolveStage(id,random=Math.random){return id==='random'?STAGES[Math.min(STAGES.length-1,Math.max(0,Math.floor(random()*STAGES.length)))].id:stageFor(id).id;}
