let configPromise;
export async function apiBase(explicit=''){
 const value=explicit||document.querySelector('#online-server')?.value.trim();let url;
 if(value)url=new URL(value);else{configPromise??=fetch('./online-config.json',{cache:'no-store'}).then(r=>r.json());const config=await configPromise;url=new URL(config.sameOrigin?location.origin:config.url||location.origin);}
 if(url.protocol==='wss:')url.protocol='https:';if(url.protocol==='ws:')url.protocol='http:';if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Use a valid arena server address');return url.origin;
}
export async function arenaRequest(path,{base,token,method='GET',body}={}){
 base??=await apiBase();const response=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000),cache:'no-store'});const value=await response.json();if(!response.ok)throw new Error(value.error||'Arena request failed');return value;
}
const key=base=>`shinobi.profile.v1.${base}`;
export function profileToken(base){try{return localStorage.getItem(key(base))||'';}catch{return '';}}
export async function ensureIdentity(name,base){let token=profileToken(base);if(token){try{await arenaRequest('/api/me',{base,token});return token;}catch(e){throw new Error('Your saved profile could not be loaded. Use Arena → Profile to restore it, or retry when the server is available.');}}
 const created=await arenaRequest('/api/identity',{base,method:'POST',body:{name}});try{localStorage.setItem(key(base),created.token);}catch{throw new Error('Save a profile recovery code before ranked play; browser storage is unavailable.');}return created.token;
}
export async function restoreIdentity(token,base){if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw new Error('Enter the complete profile recovery code');const value=await arenaRequest('/api/me',{base,token});localStorage.setItem(key(base),token);return value;}
