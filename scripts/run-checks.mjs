import {spawnSync} from 'node:child_process';
// Never let hosted build credentials select a production store in a test process.
const env={...process.env,DATABASE_URL:'',ARENA_DB_FILE:'',RENDER:''};
const browser=process.argv[2]==='--browser';
const commands=browser?['browser','training','online','inventory','dora','strategy-arena'].map(name=>[`scripts/${name}-smoke.mjs`]):[['--test',...process.argv.slice(2)]];
for(const args of commands){const result=spawnSync(process.execPath,args,{env,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);}
