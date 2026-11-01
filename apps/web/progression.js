import {arenaRequest,profileToken,ensureIdentity} from './arena-api.js';
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export async function showProgression(content,base,{refresh,isCurrent}){
 content.append(node('h3','Challenges & rewards'),node('p','Earn cosmetic titles through verified online play. No combat stats or equipment advantages. Arcade and training do not award progress yet.'));
 const token=profileToken(base);
 const button=(label,action)=>{const b=node('button',label);b.type='button';b.onclick=async()=>{b.disabled=true;try{await action();if(isCurrent())await refresh();}catch(e){if(isCurrent()){content.append(node('p',e.message));b.disabled=false;}}};return b;};
 if(!token){content.append(node('p','Create a guest profile to save progress, or use My profile to sign in with Discord.'),button('Create player profile',()=>ensureIdentity(document.querySelector('#player-name').value||'Rival',base)));return;}
 const p=await arenaRequest('/api/progression',{base,token});if(!isCurrent())return;
 content.append(node('p',`Equipped title: ${p.titles[p.title]??'None'}`));
 content.append(node('h4','Welcome back'),node('p',`${p.loginDays}/7 login days. Missing a day keeps your progress. Complete seven days to unlock Returning Rival.`));
 if(p.loginAvailable)content.append(button('Claim today’s login',()=>arenaRequest('/api/progression/login',{base,token,method:'POST'})));
 else content.append(node('p',p.loginDays>=7?'Login track complete.':'Today’s login claimed.'));
 content.append(node('p',`Daily reset: ${new Date(p.dailyResetsAt).toLocaleString()} · Weekly reset: ${new Date(p.weeklyResetsAt).toLocaleString()}`));
 content.append(node('p','Finish matches lasting at least 20 seconds, with both players dealing damage. First three matches against each opponent per UTC day count. Forfeits, practice, self-matches and character benchmarks do not count. Complete all three daily objectives for Daily Rival.'));
 for(const o of p.objectives){const row=node('article');row.className='hub-row';const copy=node('div');copy.append(node('strong',`${o.period} · ${o.name}`),node('p',`${o.progress}/${o.target} · ${o.reward}`));const meter=node('progress');meter.max=o.target;meter.value=o.progress;meter.setAttribute('aria-label',`${o.name}: ${o.progress} of ${o.target}`);copy.append(meter);row.append(copy);content.append(row);}
 content.append(node('h4','Your titles'));
 if(!p.unlocks.length)content.append(node('p','Complete First steps to earn your first title.'));
 for(const id of p.unlocks){const b=button(p.title===id?`${p.titles[id]} · Equipped`:`Equip ${p.titles[id]}`,()=>arenaRequest('/api/progression/title',{base,token,method:'POST',body:{title:id}}));b.disabled=p.title===id;content.append(b);}
 if(p.title)content.append(button('Remove title',()=>arenaRequest('/api/progression/title',{base,token,method:'POST',body:{title:null}})));
 content.append(button('Refresh progress',async()=>{}));
}
