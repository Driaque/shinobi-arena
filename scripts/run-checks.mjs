import {spawnSync} from 'node:child_process';
// Never let hosted build credentials select a production store in a test process.
const env={...process.env,DATABASE_URL:'',ARENA_DB_FILE:'',RENDER:''};
const browser=process.argv[2]==='--browser';
const suites=['discord','fighter-art','global-pixi','practice-pixi','visual-lab','character-league','browser','training','online','inventory','dora','strategy-arena','aerial','shield-scale','experience','startup-history','tactical-experience','tournaments'];
const groups={
 graphics:['fighter-art','global-pixi','practice-pixi','visual-lab'],
 combat:['browser','training','shield-scale'],
 network:['discord','online','inventory'],
 arena:['character-league','strategy-arena'],
 experience:['dora','aerial','experience','startup-history','tactical-experience','tournaments'],
};
// Keep the default full run, and prove CI's groups contain every suite exactly
// once before choosing a group. Sharding must never silently drop a gate.
const grouped=Object.values(groups).flat();
if(grouped.length!==suites.length||new Set(grouped).size!==suites.length||suites.some(s=>!grouped.includes(s)))throw Error('Browser groups must cover every suite exactly once');
const group=process.env.BROWSER_GROUP;
if(browser&&group&&!Object.hasOwn(groups,group))throw Error('Unknown BROWSER_GROUP: '+group);
const selected=group?suites.filter(s=>groups[group]?.includes(s)):suites;
const commands=browser?selected.map(name=>[`scripts/${name}-smoke.mjs`]):[['--test',...process.argv.slice(2)]];
for(const args of commands){const started=performance.now();if(browser)console.log('Browser suite starting: '+args[0]);const result=spawnSync(process.execPath,args,{env,stdio:'inherit',...(browser?{timeout:180000}:{})});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);if(browser)console.log('Browser suite completed: '+args[0]+' · '+Math.round((performance.now()-started)/1000)+'s');}
