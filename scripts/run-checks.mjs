import {spawnSync} from 'node:child_process';
// Never let hosted build credentials select a production store in a test process.
const env={...process.env,DATABASE_URL:'',ARENA_DB_FILE:'',RENDER:''};
const browser=process.argv[2]==='--browser';
const commands=browser?['practice-pixi','visual-lab','character-league','browser','training','online','inventory','dora','strategy-arena','aerial','shield-scale','experience','startup-history','tactical-experience','tournaments'].map(name=>[`scripts/${name}-smoke.mjs`]):[['--test',...process.argv.slice(2)]];
for(const args of commands){const started=performance.now();if(browser)console.log('Browser suite starting: '+args[0]);const result=spawnSync(process.execPath,args,{env,stdio:'inherit',...(browser?{timeout:180000}:{})});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);if(browser)console.log('Browser suite completed: '+args[0]+' · '+Math.round((performance.now()-started)/1000)+'s');}
