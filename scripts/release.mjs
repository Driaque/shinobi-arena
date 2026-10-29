import {readFile} from 'node:fs/promises';
const {version}=JSON.parse(await readFile('package.json','utf8'));
const body=await readFile(`docs/releases/${version}.md`,'utf8');
if(!/^\d+\.\d+\.\d+$/.test(version)||!body.startsWith(`# Fabled Rivals v${version}\n`))throw new Error('Invalid release metadata');
const {GITHUB_REPOSITORY:repo,RELEASE_COMMIT:sha,GH_TOKEN:token}=process.env;
if(!repo||!/^\w[\w.-]*\/[\w.-]+$/.test(repo)||!/^([a-f0-9]{40})$/.test(sha??'')||!token)throw new Error('Release needs repository, verified commit and token');
const request=async(path,options={})=>fetch(`https://api.github.com/repos/${repo}/${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28',...options.headers}});
const branch=await request('branches/main');if(!branch.ok)throw new Error(`Cannot verify main: ${branch.status}`);
if((await branch.json()).commit.sha!==sha){console.log('A newer main commit exists; let its verified deployment release.');process.exit(0);}
const existing=await request(`releases/tags/v${version}`);
if(existing.ok){console.log(`Release v${version} is already published.`);process.exit(0);}
if(existing.status!==404)throw new Error(`Cannot inspect release: ${existing.status}`);
const checks=await request(`actions/runs?head_sha=${sha}&per_page=100`);if(!checks.ok)throw new Error(`Cannot verify release checks: ${checks.status}`);
const runs=(await checks.json()).workflow_runs;
for(const name of ['CI','Deploy Pages']){
 const allowedEvents=name==='Deploy Pages'?['push','workflow_dispatch','workflow_run']:['push','workflow_dispatch'];
 const run=runs.find(r=>r.name===name&&r.head_sha===sha&&allowedEvents.includes(r.event));
 if(!run||run.status!=='completed'||run.conclusion!=='success'){console.log(`Waiting for successful ${name}; its completion will trigger another release check.`);process.exit(0);}
}
const response=await request('releases',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tag_name:`v${version}`,target_commitish:sha,name:`Fabled Rivals v${version}`,body,draft:false,prerelease:false,make_latest:'true'})});
if(response.status!==201)throw new Error(`Release publication failed: ${response.status}`);
console.log(`Published ${(await response.json()).html_url}`);
