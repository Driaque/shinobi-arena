import {pathToFileURL} from 'node:url';

export const permissions = {view:1024n, send:2048n, history:65536n, channels:16n, roles:268435456n, publicThreads:1n<<35n, privateThreads:1n<<36n, threadSend:1n<<38n};
export const botPermissions = Object.values(permissions).reduce((a,b)=>a|b,0n);
const noPosting = 2048n | (1n<<35n) | (1n<<36n) | (1n<<38n);
export const roles = ['Community Moderator','Playtester','Event Notifications','Update Notifications'];
export const sections = [
 {name:'START HERE', channels:[
  ['welcome', 'Welcome to Fabled Rivals! Read #rules, introduce yourself in #introductions, then find your next rival in #find-a-match. Community invite: https://discord.gg/XNsBFyPRAP',true],
  ['rules','Respect other players. No harassment, hate speech, threats, scams, spam, explicit content, or sharing private information. Play fairly, report exploits privately to the server owner, and keep feedback constructive. Follow Discord’s Terms and Community Guidelines. Contact a moderator privately for help.',true],
  ['introductions','Introduce yourself: arena name, favourite rival, desktop or mobile, and what you enjoy playing. Share only what you are comfortable making public.']
 ]},
 {name:'GAME NEWS', channels:[
  ['announcements','Official community announcements and important notices. Replies belong in #general-chat.',true],
  ['updates','Published game changes and release notes will appear here. This initial post does not announce a new release.',true],
  ['roadmap','Development priorities and progress will appear here. Story and co-op are planned directions, not promises of availability or release dates.',true],
  ['sneak-peeks','Work-in-progress art, stages and gameplay previews. Previews may change before release.',true]
 ]},
 {name:'COMMUNITY', channels:[
  ['general-chat','Meet the community and talk Fabled Rivals. Keep match requests in #find-a-match.'],
  ['find-a-match','Looking for a rival? Post mode, region, availability, and desktop/mobile. Share your game room link if available. Avoid posting private recovery codes.'],
  ['clips-and-highlights','Share your best fights, combos, close finishes, and community creations. Credit other creators.'],
  ['strategy-and-loadouts','Discuss fighter matchups, loadouts, tactics and counterplay. Include the game version when discussing balance.']
 ]},
 {name:'HELP SHAPE THE GAME', channels:[
  ['feedback-and-ideas','Start a thread for each suggestion: problem, proposed change, and who it helps. Search existing discussions first.'],
  ['bug-reports','Start a thread per bug: game version, device/browser, steps, expected result, actual result, and optional screenshot. Do not include tokens, recovery codes, or private logs. Send security exploits privately to the owner.'],
  ['balance-discussion','Discuss balance with examples: fighter/loadout, matchup, game version and what counterplay you tried. Keep criticism focused on the game.']
 ]},
 {name:'EVENTS', channels:[
  ['playtests','Playtest dates and participation instructions will appear here when scheduled. No playtest is scheduled by this setup.',true],
  ['tournaments','Community tournament announcements and rules will appear here when scheduled. No prizes or dates are promised by this setup.',true]
 ]},
 {name:'VOICE', channels:[['Community Lounge',null,false,2],['Duel Room',null,false,2],['Co-op Room',null,false,2]]},
 {name:'STAFF', private:true, channels:[['moderation','Private staff coordination. Do not post bot tokens or player recovery credentials.'],['development','Private development planning. Public updates should be posted in the news channels.']]}
];

export function overwrites(guildId,botId,moderatorId,{private:staff=false,readonly=false}={}) {
 return [
  {id:guildId,type:0,allow:'0',deny:String(staff?permissions.view:readonly?noPosting:0n)},
  {id:botId,type:1,allow:String(permissions.view|permissions.send|permissions.history),deny:'0'},
  {id:moderatorId,type:0,allow:String(permissions.view|permissions.send|permissions.history),deny:'0'}
 ];
}

export function createApi(token,{request=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms))}={}) {
 return async function api(method,path,body) {
  for(let attempt=0;attempt<6;attempt++) {
   const response=await request('https://discord.com/api/v10'+path,{method,headers:{Authorization:'Bot '+token,'Content-Type':'application/json','User-Agent':'FabledRivalsCommunitySetup (https://github.com/Driaque/shinobi-arena, 1.0)'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
   if(response.status===429){const data=await response.json();const seconds=Number(data.retry_after);if(!Number.isFinite(seconds)||seconds<0||seconds>60)throw Error('Discord rate limit exceeds this run; retry later.');await wait(Math.ceil(seconds*1000)+100);continue;}
   // Do not print response bodies: upstream errors can contain sensitive data.
   if(!response.ok)throw Error(`Discord ${method} ${path}: HTTP ${response.status}. Check bot membership and permissions.`);
   const data=response.status===204?null:await response.json();
   if(response.headers.get('x-ratelimit-remaining')==='0'){const seconds=Number(response.headers.get('x-ratelimit-reset-after'));if(Number.isFinite(seconds)&&seconds>0&&seconds<=60)await wait(Math.ceil(seconds*1000)+100);}
   return data;
  }
  throw Error('Discord rate limit retry budget exhausted.');
 };
}

function unique(items,predicate,label){const matches=items.filter(predicate);if(matches.length>1)throw Error('Ambiguous existing '+label+'; resolve duplicates before retrying.');return matches[0];}
function samePermissions(a,b){const normalize=xs=>JSON.stringify(xs.map(x=>[x.id,x.type,String(x.allow),String(x.deny)]).sort((x,y)=>x[0].localeCompare(y[0])));return normalize(a??[])===normalize(b);}

export async function setup(api,guildId,{log=console.log}={}) {
 if(!/^\d{17,20}$/.test(guildId??''))throw Error('Set DISCORD_GUILD_ID to the server ID.');
 const guild=await api('GET',`/guilds/${guildId}`);
 if(guild.name.replace(/\s/g,'').toLowerCase()!=='fabledrivals')throw Error('Target server is not named Fabled Rivals. No changes made.');
 const bot=await api('GET','/users/@me');
 if(!bot.bot)throw Error('A bot token is required.');
 const existingRoles=await api('GET',`/guilds/${guildId}/roles`);
 const member=await api('GET',`/guilds/${guildId}/members/${bot.id}`);
 const held=existingRoles.filter(r=>r.id===guildId||member.roles.includes(r.id));
 const granted=held.reduce((p,r)=>p|BigInt(r.permissions),0n);
 if(!(granted&8n)&&(granted&botPermissions)!==botPermissions)throw Error('Bot lacks the documented setup permissions. No changes made.');
 const top=Math.max(...held.map(r=>r.position));
 const foundRoles=Object.fromEntries(roles.map(name=>[name,unique(existingRoles,r=>r.name===name,'role '+name)]));
 if(Object.values(foundRoles).some(r=>r&&(r.managed||r.position>=top||BigInt(r.permissions)!==0n)))throw Error('An existing setup role is managed, above the bot, or has elevated permissions. No changes made.');
 const channels=await api('GET',`/guilds/${guildId}/channels`);
 // Abort on ambiguous names before making any changes.
 for(const section of sections){unique(channels,c=>c.name===section.name,'category '+section.name);for(const [name]of section.channels)unique(channels,c=>c.name===name,'channel '+name);}
 for(const name of roles){if(!foundRoles[name])foundRoles[name]=await api('POST',`/guilds/${guildId}/roles`,{name,permissions:'0',mentionable:false});log('Role ready: '+name);}
 const moderatorId=foundRoles['Community Moderator'].id;
 async function ensure(spec){
  const existing=unique(channels,c=>c.name===spec.name,'channel '+spec.name);
  if(existing){if(existing.type!==spec.type||(existing.parent_id??null)!==(spec.parent_id??null)||!samePermissions(existing.permission_overwrites,spec.permission_overwrites))throw Error('Existing channel '+spec.name+' differs from the plan. Left unchanged; resolve manually before retrying.');return existing;}
  const created=await api('POST',`/guilds/${guildId}/channels`,spec);channels.push(created);return created;
 }
 for(const section of sections){
  const category=await ensure({name:section.name,type:4,permission_overwrites:overwrites(guildId,bot.id,moderatorId,{private:section.private})});
  for(const [name,text,readonly,type=0]of section.channels){
   const channel=await ensure({name,type,parent_id:category.id,permission_overwrites:overwrites(guildId,bot.id,moderatorId,{private:section.private,readonly}),...(type===0?{topic:'Fabled Rivals community · '+name,rate_limit_per_user:readonly?0:5}:{})});
   if(text){
    const marker='[Fabled Rivals setup: '+name+']';
    const saved=channel.topic?.match(/setup-message:(\d+)/)?.[1];
    if(saved){const message=await api('GET',`/channels/${channel.id}/messages/${saved}`);if(message.author.id!==bot.id||!message.content.includes(marker))throw Error('Saved starter post differs in '+name+'; left unchanged.');}
    else {
     // Recover a post created just before an interrupted topic update.
     const messages=await api('GET',`/channels/${channel.id}/messages?limit=100`);
     const message=messages.find(m=>m.author.id===bot.id&&m.content.includes(marker))??await api('POST',`/channels/${channel.id}/messages`,{content:text+'\n\n'+marker,allowed_mentions:{parse:[]}});
     const updated=await api('PATCH',`/channels/${channel.id}`,{topic:'Fabled Rivals community · '+name+' · setup-message:'+message.id});Object.assign(channel,updated);
    }
   }
   log('Channel ready: '+name);
  }
 }
 log('Setup complete. Review permissions as a normal member. Assign staff and optional notification roles manually.');
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv.includes('--apply'))console.log(JSON.stringify({roles,sections,botPermissions:String(botPermissions)},null,2));
 else if(!process.env.DISCORD_BOT_TOKEN){console.error('Set DISCORD_BOT_TOKEN securely. Never put it in source or chat.');process.exitCode=1;}
 else try{await setup(createApi(process.env.DISCORD_BOT_TOKEN),process.env.DISCORD_GUILD_ID);}catch(error){console.error(error.message.replaceAll(process.env.DISCORD_BOT_TOKEN,'[redacted]'));process.exitCode=1;}
}
