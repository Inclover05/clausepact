// Uses the system Git Credential Manager in memory; never logs or stores credentials.
import {spawnSync} from 'node:child_process';
const run=(args,options={})=>spawnSync('git',args,{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'},...options});
const credential=run(['credential','fill'],{input:'protocol=https\nhost=github.com\n\n'});
if(credential.status!==0)throw Error('GitHub credential is unavailable through Git Credential Manager.');
const password=credential.stdout.split(/\r?\n/).find(x=>x.startsWith('password='))?.slice(9);
if(!password)throw Error('No GitHub credential available.');
const api=async(path,method='GET',body)=>{
 const response=await fetch(`https://api.github.com${path}`,{method,headers:{Authorization:`Bearer ${password}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 const value=await response.json();if(!response.ok)throw Error(`GitHub request failed (${response.status}).`);return value;
};
const user=await api('/user');const name='clausepact';
let repo;try{repo=await api(`/repos/${user.login}/${name}`);}catch(e){if(!e.message.includes('(404)'))throw e;repo=await api('/user/repos','POST',{name,private:false,description:'Mutually accepted bounty briefs and clause-grounded scope-change decisions on GenLayer.',auto_init:false});}
if(repo.private)throw Error('Existing repository is private; refusing to change its visibility.');
for(const args of [['init','-b','main'],['config','user.name',user.login],['config','user.email',`${user.id}+${user.login}@users.noreply.github.com`]]){
 const result=run(args);if(result.status!==0)throw Error('Git setup failed.');
}
const remote=run(['remote','get-url','origin']);
if(remote.status===0&&remote.stdout.trim()!==repo.clone_url)throw Error('Repository origin does not match ScopeLock.');
if(remote.status!==0&&run(['remote','add','origin',repo.clone_url]).status!==0)throw Error('Could not set ScopeLock origin.');
if(run(['add','.']).status!==0)throw Error('Could not stage sanitized source.');
const changes=run(['diff','--cached','--quiet']);
if(changes.status===1&&run(['commit','-m','Build ClausePact: mutually accepted briefs and clause-grounded rulings']).status!==0)throw Error('Could not commit source.');
if(run(['push','-u','origin','main']).status!==0)throw Error('GitHub push failed.');
console.log(JSON.stringify({repository:repo.html_url,commit:run(['rev-parse','HEAD']).stdout.trim()}));

