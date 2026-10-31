import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Never log the hook or response body: either can contain credentials.
export async function deployRender({repo,sha,token,hook,request=fetch}) {
 if(repo!=='Driaque/shinobi-arena'||!/^[a-f0-9]{40}$/.test(sha??''))throw Error('Invalid deployment repository or commit');
 if(!token)throw Error('GitHub verification token is missing');
 let url;try{url=new URL(hook);}catch{throw Error('Configure the RENDER_DEPLOY_HOOK_URL repository secret');}
 if(url.protocol!=='https:'||url.host!=='api.render.com'||url.pathname!=='/deploy/srv-dbgvadou01pc73b5hrig'||!url.searchParams.get('key')||url.username||url.password||url.hash)throw Error('Deploy hook must belong to the existing Fabled Rivals service');
 const headers={Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`};
 const get=async path=>{let response;try{response=await request(`https://api.github.com/repos/${repo}/${path}`,{headers,signal:AbortSignal.timeout(20000)});}catch{throw Error('GitHub deployment verification could not connect');}if(!response.ok)throw Error(`GitHub deployment verification failed (${response.status})`);return response.json();};
 if((await get('branches/main')).commit.sha!==sha)return {skipped:true};
 const runs=(await get(`actions/runs?head_sha=${sha}&per_page=100`)).workflow_runs;
 const ci=runs.filter(r=>r.name==='CI'&&r.head_sha===sha&&r.head_branch==='main'&&['push','workflow_dispatch'].includes(r.event)).sort((a,b)=>b.id-a.id)[0];
 if(!ci||ci.status!=='completed'||ci.conclusion!=='success')throw Error('Successful main-branch CI is required');
 // Pin the hook to the verified commit; a later main update cannot change it.
 url.searchParams.set('ref',sha);
 url.searchParams.delete('imgURL');
 let response;try{response=await request(url.href,{method:'POST',signal:AbortSignal.timeout(20000)});}catch{throw Error('Render request failed; inspect deployment history before retrying');}
 if(![200,202].includes(response.status))throw Error(`Render rejected deployment (${response.status})`);
 return {accepted:true,queued:response.status===202};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const result=await deployRender({repo:process.env.GITHUB_REPOSITORY,sha:process.env.RELEASE_COMMIT,token:process.env.GH_TOKEN,hook:process.env.RENDER_DEPLOY_HOOK_URL});
  if(result.skipped){console.log('Newer main exists; its CI will deploy.');process.exit(0);}
  console.log(result.queued?'Render deployment queued. Waiting for the live version.':'Render accepted deployment. Waiting for the live version.');
  const {version}=JSON.parse(await readFile('package.json','utf8'));
  const until=Date.now()+10*60*1000;
  while(Date.now()<until){
   try{const response=await fetch('https://shinobi-arena-online.onrender.com/health',{cache:'no-store',signal:AbortSignal.timeout(15000)});const health=await response.json();if(response.ok&&health.ok&&health.storageHealthy&&health.version===version&&health.commit===process.env.RELEASE_COMMIT){console.log(`Verified Render live: v${version}`);process.exit(0);}}catch{}
   await new Promise(resolve=>setTimeout(resolve,10000));
  }
  throw Error('Deployment accepted but live version verification timed out; inspect Render before retrying');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
