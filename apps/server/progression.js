// Cosmetic-only progression. Match facts come exclusively from the arena/store.
const DAY=86400000;
const day=at=>Math.floor(at/DAY);
const week=at=>Math.floor((day(at)+3)/7); // Monday, UTC
export const TITLES={newChallenger:'New Challenger',dailyRival:'Daily Rival',weeklyContender:'Weekly Contender',returningRival:'Returning Rival'};
const fresh=()=>({daily:{},weekly:{},total:0,loginDays:0,lastLogin:null,unlocks:[],title:null});
function rotate(p,at){if(p.daily.key!==day(at))p.daily={key:day(at),matches:0,wins:0,characters:[]};if(p.weekly.key!==week(at))p.weekly={key:week(at),matches:0};return p;}
function award(p,id){if(!p.unlocks.includes(id))p.unlocks.push(id);}
function view(p,at){rotate(p,at);return {...p,titles:TITLES,loginAvailable:p.lastLogin!==day(at)&&p.loginDays<7,dailyResetsAt:(day(at)+1)*DAY,weeklyResetsAt:(week(at)+1)*7*DAY-3*DAY,objectives:[{name:'First steps',progress:p.total,target:3,reward:'New Challenger',period:'Permanent'},{name:'Enter the arena',progress:p.daily.matches,target:3,reward:'Daily Rival',period:'Daily'},{name:'Earn a victory',progress:p.daily.wins,target:1,reward:'Daily Rival',period:'Daily'},{name:'Explore your roster',progress:p.daily.characters.length,target:2,reward:'Daily Rival',period:'Daily'},{name:'Keep the rivalry alive',progress:p.weekly.matches,target:10,reward:'Weekly Contender',period:'Weekly'}].map(o=>({...o,progress:Math.min(o.progress,o.target)}))};}
export async function createProgression({query,transaction,now}){
 await query('CREATE TABLE IF NOT EXISTS player_progression(player_id TEXT PRIMARY KEY,data TEXT NOT NULL)');
 const read=async(q,id)=>{const row=(await q('SELECT data FROM player_progression WHERE player_id=$1',[id]))[0];return rotate(row?JSON.parse(row.data):fresh(),now());};
 const write=(q,id,p)=>q('INSERT INTO player_progression(player_id,data) VALUES($1,$2) ON CONFLICT(player_id) DO UPDATE SET data=$2',[id,JSON.stringify(p)]);
 async function get(id){return view(await read(query,id),now());}
 async function login(id){return transaction(async q=>{const p=await read(q,id);if(p.lastLogin!==day(now())&&p.loginDays<7){p.lastLogin=day(now());p.loginDays++;if(p.loginDays===7)award(p,'returningRival');await write(q,id,p);}return view(p,now());});}
 async function equip(id,title){return transaction(async q=>{const p=await read(q,id);if(title!==null&&!p.unlocks.includes(title))return null;p.title=title;await write(q,id,p);return view(p,now());});}
 async function complete(q,r,pairKey){
  const ids=r.players.map(p=>p.playerId);
  const fighters=r.replay.frames?.at(-1)?.state?.fighters;
  if(r.tournament?.benchmark||r.reason!=='completed'||r.playedTicks<1200||!ids.every(Boolean)||ids[0]===ids[1]||!fighters?.every(f=>f.damageTaken>0))return;
  const at=now(),count=Number((await q('SELECT COUNT(*) AS n FROM matches WHERE pair_key=$1 AND created_at>=$2 AND created_at<$3',[pairKey,day(at)*DAY,(day(at)+1)*DAY]))[0].n);
  if(count>3)return;
  for(let i=0;i<2;i++){
   const p=await read(q,ids[i]);p.total++;p.daily.matches++;p.weekly.matches++;
   if(r.winner===i)p.daily.wins++;
   const character=r.players[i].character;if(!p.daily.characters.includes(character))p.daily.characters.push(character);
   if(p.total>=3)award(p,'newChallenger');
   if(p.daily.matches>=3&&p.daily.wins>=1&&p.daily.characters.length>=2)award(p,'dailyRival');
   if(p.weekly.matches>=10)award(p,'weeklyContender');
   await write(q,ids[i],p);
  }
 }
 return {get,login,equip,complete};
}
