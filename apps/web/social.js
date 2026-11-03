const labels={bow:'Respectful bow',wave:'Hello!',ready:'Ready to fight',goodFight:'Good fight!',wellPlayed:'Well played!',rematch:'Another duel?'};
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function createSocialUI({getOnline}){
 const lounge=node('section');lounge.id='player-lounge';lounge.setAttribute('aria-label','Player lounge');
 const title=node('h3','Player lounge'),intro=node('p','Meet online players and guests. Duels are casual and use your selected loadout. Join again after changing your equipment.');
 const enter=node('button','Enter player lounge');enter.id='lounge-enter';enter.onclick=()=>getOnline().join({lounge:true});
 const roster=node('div');roster.id='lounge-roster';const invitations=node('div');invitations.id='duel-invitations';invitations.setAttribute('aria-live','polite');
 lounge.append(title,intro,enter,invitations,roster);document.querySelector('#online-lobby').append(lounge);
 const gestures=node('section');gestures.id='fight-gestures';gestures.hidden=true;gestures.setAttribute('aria-label','Fight gestures');gestures.append(node('h3','Send a gesture'));
 const feed=node('p');feed.id='gesture-feed';feed.setAttribute('role','status');
 for(const [id,label]of Object.entries(labels)){const b=node('button',label);b.dataset.gesture=id;b.onclick=()=>getOnline().social({type:'gesture',gesture:id});gestures.append(b);}gestures.append(feed);document.querySelector('#overlay-description').after(gestures);
 let self='',pending=null,lastPhase='',rosterKey='';
 function update(m){
  if(m.type==='presence'){
   self=m.self;const key=JSON.stringify([m.players,pending?.id,getOnline().phase]);if(key===rosterKey)return;rosterKey=key;enter.textContent='Refresh lounge loadout';roster.replaceChildren();
   roster.append(node('p',`${m.players.length} online · ${m.players.filter(p=>p.kind==='guest').length} guests`));
   for(const p of m.players){const row=node('article');row.className='lounge-player';const info=node('div');info.append(node('strong',p.name+(p.id===self?' (you)':'')),node('small',`${p.kind==='guest'?'Guest':'Player'} · ${p.character} · ${p.status}`));
    const details=node('details');details.append(node('summary','View profile'),node('p',p.stats?`${p.stats.tier} · ${p.stats.rating} rating · ${p.stats.wins} wins / ${p.stats.losses} losses / ${p.stats.draws} draws`:'Guest fighter · No rated results yet'));info.append(details);row.append(info);
    if(p.id!==self){const b=node('button','Challenge');b.disabled=p.status!=='available'||Boolean(pending)||getOnline().phase!=='lounge';b.onclick=()=>getOnline().social({type:'challenge',target:p.id});row.append(b);}roster.append(row);
   }
   if(m.players.length===1)roster.append(node('p','You are the first here. Other players appear when they connect to the lounge or queue.'));return;
  }
  if(m.type==='challenge'){
   pending=m;invitations.replaceChildren(node('p',`${m.from.name} challenges ${m.to.name} · expires in 30 seconds`));
   const action=(text,type,accept)=>{const b=node('button',text);b.onclick=()=>getOnline().social({type,id:m.id,accept});invitations.append(b);};
   if(m.to.id===self){action('Accept duel','challengeReply',true);action('Decline','challengeReply',false);}else action('Cancel challenge','challengeCancel');
  }
  if(m.type==='challengeClosed'){if(pending?.id===m.id){pending=null;invitations.replaceChildren(node('p',`Challenge ${m.reason}.`));}}
  if(m.type==='socialError')feed.textContent=m.message;
  if(m.type==='gesture')feed.textContent=`${m.name}: ${labels[m.gesture]??''}`;
 }
 function phase(value){if(value===lastPhase)return;lastPhase=value;document.querySelector('#online-cancel').textContent=value==='lounge'?'Leave player lounge':'Cancel search';gestures.hidden=!['countdown','roundOver','matchOver'].includes(value);if(value==='idle'){pending=null;roster.replaceChildren(node('p','Enter the lounge to see who is online.'));invitations.replaceChildren();enter.textContent='Enter player lounge';}if(value==='countdown'){pending=null;invitations.replaceChildren();feed.textContent='';}}
 phase('idle');return {update,phase};
}
