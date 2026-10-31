import test from 'node:test';
import assert from 'node:assert/strict';
import {deployRender} from '../scripts/deploy-render.mjs';
const sha='a'.repeat(40),hook='https://api.render.com/deploy/srv-dbgvadou01pc73b5hrig?key=test-only';
function setup({main=sha,conclusion='success',event='push',status=200,fail=false}={}){
 const calls=[];
 const options={repo:'Driaque/shinobi-arena',sha,token:'test-token',hook,request:async(url,opts)=>{
  calls.push({url,opts});
  if(url.includes('/branches/main'))return {ok:true,json:async()=>({commit:{sha:main}})};
  if(url.includes('/actions/runs'))return {ok:true,json:async()=>({workflow_runs:[{id:1,name:'CI',head_sha:sha,head_branch:'main',event,status:'completed',conclusion}]})};
  if(fail)throw Error(hook);
  return {status};
 }};
 return {options,calls};
}
test('only verified current main is sent to the expected Render service',async()=>{
 const {options,calls}=setup();assert.deepEqual(await deployRender(options),{accepted:true,queued:false});
 const url=new URL(calls[2].url);assert.equal(url.searchParams.get('ref'),sha);assert.equal(calls[2].opts.method,'POST');assert.equal(calls[2].opts.headers,undefined);
});
test('stale main never triggers a deployment',async()=>{
 const {options,calls}=setup({main:'b'.repeat(40)});assert.deepEqual(await deployRender(options),{skipped:true});assert.equal(calls.length,1);
});
test('failed or PR CI cannot authorize production deployment',async()=>{
 for(const change of [{conclusion:'failure'},{event:'pull_request'}]){const {options,calls}=setup(change);await assert.rejects(deployRender(options),/Successful main-branch CI/);assert.equal(calls.length,2);}
});
test('missing or wrong-service hook is rejected before any external request',async()=>{
 for(const hook of ['', 'https://example.com/?key=x','https://api.render.com/deploy/srv-other?key=x']){
 const {options,calls}=setup();options.hook=hook;await assert.rejects(deployRender(options));assert.equal(calls.length,0);
 }
});
test('queued response is accepted without duplicate requests',async()=>{
 const {options,calls}=setup({status:202});assert.deepEqual(await deployRender(options),{accepted:true,queued:true});assert.equal(calls.length,3);
});
test('ambiguous hook failure never exposes credentials or retries',async()=>{
 const {options,calls}=setup({fail:true});await assert.rejects(deployRender(options),e=>!e.message.includes('test-only')&&e.message.includes('inspect deployment history'));assert.equal(calls.length,3);
});
