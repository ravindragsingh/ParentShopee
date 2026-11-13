import{L as ft,g as Ae,C as b,E as z,d as se,b as Ce,i as De,v as Re,a as lt,F as Y,o as F,c as pt,e as M,f as O,W as ht}from"./index-ffa47cee.js";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gt{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(bt(n)){const i=n.getImmediate();return`${i.library}/${i.version}`}else return null}).filter(n=>n).join(" ")}}function bt(e){const t=e.getComponent();return(t==null?void 0:t.type)==="VERSION"}const q="@firebase/app",ce="0.16.4";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const h=new ft("@firebase/app"),wt="@firebase/app-compat",mt="@firebase/analytics-compat",yt="@firebase/analytics",It="@firebase/app-check-compat",St="@firebase/app-check",Tt="@firebase/auth",vt="@firebase/auth-compat",_t="@firebase/database",Et="@firebase/data-connect",kt="@firebase/database-compat",At="@firebase/functions",Ct="@firebase/functions-compat",Dt="@firebase/installations",Rt="@firebase/installations-compat",Nt="@firebase/messaging",Ot="@firebase/messaging-compat",Pt="@firebase/performance",$t="@firebase/performance-compat",Ft="@firebase/remote-config",Mt="@firebase/remote-config-compat",xt="@firebase/storage",Ht="@firebase/storage-compat",Bt="@firebase/firestore",jt="@firebase/ai",Ut="@firebase/firestore-compat",Kt="firebase";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const V="[DEFAULT]",Lt={[q]:"fire-core",[wt]:"fire-core-compat",[yt]:"fire-analytics",[mt]:"fire-analytics-compat",[St]:"fire-app-check",[It]:"fire-app-check-compat",[Tt]:"fire-auth",[vt]:"fire-auth-compat",[_t]:"fire-rtdb",[Et]:"fire-data-connect",[kt]:"fire-rtdb-compat",[At]:"fire-fn",[Ct]:"fire-fn-compat",[Dt]:"fire-iid",[Rt]:"fire-iid-compat",[Nt]:"fire-fcm",[Ot]:"fire-fcm-compat",[Pt]:"fire-perf",[$t]:"fire-perf-compat",[Ft]:"fire-rc",[Mt]:"fire-rc-compat",[xt]:"fire-gcs",[Ht]:"fire-gcs-compat",[Bt]:"fire-fst",[Ut]:"fire-fst-compat",[jt]:"fire-vertex","fire-js":"fire-js",[Kt]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const P=new Map,qt=new Map,W=new Map;function de(e,t){try{e.container.addComponent(t)}catch(n){h.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function y(e){const t=e.name;if(W.has(t))return h.debug(`There were multiple attempts to register component ${t}.`),!1;W.set(t,e);for(const n of P.values())de(n,e);for(const n of qt.values())de(n,e);return!0}function X(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vt={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},p=new z("app","Firebase",Vt);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wt{constructor(t,n,i){this._isDeleted=!1,this._options={...t},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=i,this.container.addComponent(new b("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw p.create("app-deleted",{appName:this._name})}}function Gt(e,t={}){let n=e;typeof t!="object"&&(t={name:t});const i={name:V,automaticDataCollectionEnabled:!0,...t},r=i.name;if(typeof r!="string"||!r)throw p.create("bad-app-name",{appName:String(r)});if(n||(n=Ae()),!n)throw p.create("no-options");const a=P.get(r);if(a)if(se(n,a.options)){if(se(i,a.config))return a;throw p.create("duplicate-app",{appName:r,mismatchedParam:"config",oldValue:JSON.stringify(a.config),newValue:JSON.stringify(i)})}else throw p.create("duplicate-app",{appName:r,mismatchedParam:"options",oldValue:JSON.stringify(a.options),newValue:JSON.stringify(n)});const o=new lt(r);for(const u of W.values())o.addComponent(u);const c=new Wt(n,i,o);return P.set(r,c),c}function Jt(e=V){const t=P.get(e);if(!t&&e===V&&Ae())return Gt();if(!t)throw p.create("no-app",{appName:e});return t}function m(e,t,n){let i=Lt[e]??e;n&&(i+=`-${n}`);const r=i.match(/\s|\//),a=t.match(/\s|\//);if(r||a){const o=[`Unable to register library "${i}" with version "${t}":`];r&&o.push(`library name "${i}" contains illegal characters (whitespace or "/")`),r&&a&&o.push("and"),a&&o.push(`version name "${t}" contains illegal characters (whitespace or "/")`),h.warn(o.join(" "));return}y(new b(`${i}-version`,()=>({library:i,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zt="firebase-heartbeat-database",Yt=1,D="firebase-heartbeat-store";let H=null;function Ne(){return H||(H=F(zt,Yt,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(D)}catch(n){console.warn(n)}}}}).catch(e=>{throw p.create("idb-open",{originalErrorMessage:e.message})})),H}async function Xt(e){try{const n=(await Ne()).transaction(D),i=await n.objectStore(D).get(Oe(e));return await n.done,i}catch(t){if(t instanceof Y)h.warn(t.message);else{const n=p.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});h.warn(n.message)}}}async function ue(e,t){try{const i=(await Ne()).transaction(D,"readwrite");await i.objectStore(D).put(t,Oe(e)),await i.done}catch(n){if(n instanceof Y)h.warn(n.message);else{const i=p.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});h.warn(i.message)}}}function Oe(e){return`${e.name}!${e.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qt=1024,Zt=30;class en{constructor(t){this.container=t,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new nn(n),this._heartbeatsCachePromise=this._storage.read().then(i=>(this._heartbeatsCache=i,i))}async triggerHeartbeat(){var t,n;try{const r=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),a=fe();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)==null?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===a||this._heartbeatsCache.heartbeats.some(o=>o.date===a))return;if(this._heartbeatsCache.heartbeats.push({date:a,agent:r}),this._heartbeatsCache.heartbeats.length>Zt){const o=rn(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(i){h.warn(i)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=fe(),{heartbeatsToSend:i,unsentEntries:r}=tn(this._heartbeatsCache.heartbeats),a=Ce(JSON.stringify({version:2,heartbeats:i}));return this._heartbeatsCache.lastSentHeartbeatDate=n,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),a}catch(n){return h.warn(n),""}}}function fe(){return new Date().toISOString().substring(0,10)}function tn(e,t=Qt){const n=[];let i=e.slice();for(const r of e){const a=n.find(o=>o.agent===r.agent);if(a){if(a.dates.push(r.date),le(n)>t){a.dates.pop();break}}else if(n.push({agent:r.agent,dates:[r.date]}),le(n)>t){n.pop();break}i=i.slice(1)}return{heartbeatsToSend:n,unsentEntries:i}}class nn{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return De()?Re().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await Xt(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){const i=await this.read();return ue(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??i.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){const i=await this.read();return ue(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??i.lastSentHeartbeatDate,heartbeats:[...i.heartbeats,...t.heartbeats]})}else return}}function le(e){return Ce(JSON.stringify({version:2,heartbeats:e})).length}function rn(e){if(e.length===0)return-1;let t=0,n=e[0].date;for(let i=1;i<e.length;i++)e[i].date<n&&(n=e[i].date,t=i);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function an(e){y(new b("platform-logger",t=>new gt(t),"PRIVATE")),y(new b("heartbeat",t=>new en(t),"PRIVATE")),m(q,ce,e),m(q,ce,"esm2020"),m("fire-js","")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */an("");const Pe="@firebase/installations",Q="0.6.24";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $e=1e4,Fe=`w:${Q}`,Me="FIS_v2",on="https://firebaseinstallations.googleapis.com/v1",sn=60*60*1e3,cn="installations",dn="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const un={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},I=new z(cn,dn,un);function xe(e){return e instanceof Y&&e.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function He({projectId:e}){return`${on}/projects/${e}/installations`}function Be(e){return{token:e.token,requestStatus:2,expiresIn:ln(e.expiresIn),creationTime:Date.now()}}async function je(e,t){const i=(await t.json()).error;return I.create("request-failed",{requestName:e,serverCode:i.code,serverMessage:i.message,serverStatus:i.status})}function Ue({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function fn(e,{refreshToken:t}){const n=Ue(e);return n.append("Authorization",pn(t)),n}async function Ke(e){const t=await e();return t.status>=500&&t.status<600?e():t}function ln(e){return Number(e.replace("s","000"))}function pn(e){return`${Me} ${e}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function hn({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const i=He(e),r=Ue(e),a=t.getImmediate({optional:!0});if(a){const s=await a.getHeartbeatsHeader();s&&r.append("x-firebase-client",s)}const o={fid:n,authVersion:Me,appId:e.appId,sdkVersion:Fe},c={method:"POST",headers:r,body:JSON.stringify(o)},u=await Ke(()=>fetch(i,c));if(u.ok){const s=await u.json();return{fid:s.fid||n,registrationStatus:2,refreshToken:s.refreshToken,authToken:Be(s.authToken)}}else throw await je("Create Installation",u)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Le(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gn(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bn=/^[cdef][\w-]{21}$/,G="";function wn(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=mn(e);return bn.test(n)?n:G}catch{return G}}function mn(e){return gn(e).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _(e){return`${e.appName}!${e.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const T=new Map;function qe(e,t){const n=_(e);Ve(n,t),Sn(n,t)}function yn(e,t){We();const n=_(e);let i=T.get(n);i||(i=new Set,T.set(n,i)),i.add(t)}function In(e,t){const n=_(e),i=T.get(n);i&&(i.delete(t),i.size===0&&T.delete(n),Ge())}function Ve(e,t){const n=T.get(e);if(n)for(const i of n)i(t)}function Sn(e,t){const n=We();n&&n.postMessage({key:e,fid:t}),Ge()}let w=null;function We(){return!w&&"BroadcastChannel"in self&&(w=new BroadcastChannel("[Firebase] FID Change"),w.onmessage=e=>{Ve(e.data.key,e.data.fid)}),w}function Ge(){T.size===0&&w&&(w.close(),w=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tn="firebase-installations-database",vn=1,S="firebase-installations-store";let B=null;function Z(){return B||(B=F(Tn,vn,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(S)}}})),B}async function $(e,t){const n=_(e),r=(await Z()).transaction(S,"readwrite"),a=r.objectStore(S),o=await a.get(n);return await a.put(t,n),await r.done,(!o||o.fid!==t.fid)&&qe(e,t.fid),t}async function Je(e){const t=_(e),i=(await Z()).transaction(S,"readwrite");await i.objectStore(S).delete(t),await i.done}async function x(e,t){const n=_(e),r=(await Z()).transaction(S,"readwrite"),a=r.objectStore(S),o=await a.get(n),c=t(o);return c===void 0?await a.delete(n):await a.put(c,n),await r.done,c&&(!o||o.fid!==c.fid)&&qe(e,c.fid),c}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ee(e){let t;const n=await x(e.appConfig,i=>{const r=_n(i),a=En(e,r);return t=a.registrationPromise,a.installationEntry});return n.fid===G?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function _n(e){const t=e||{fid:wn(),registrationStatus:0};return ze(t)}function En(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const r=Promise.reject(I.create("app-offline"));return{installationEntry:t,registrationPromise:r}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},i=kn(e,n);return{installationEntry:n,registrationPromise:i}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:An(e)}:{installationEntry:t}}async function kn(e,t){try{const n=await hn(e,t);return $(e.appConfig,n)}catch(n){throw xe(n)&&n.customData.serverCode===409?await Je(e.appConfig):await $(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function An(e){let t=await pe(e.appConfig);for(;t.registrationStatus===1;)await Le(100),t=await pe(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:i}=await ee(e);return i||n}return t}function pe(e){return x(e,t=>{if(!t)throw I.create("installation-not-found");return ze(t)})}function ze(e){return Cn(e)?{fid:e.fid,registrationStatus:0}:e}function Cn(e){return e.registrationStatus===1&&e.registrationTime+$e<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Dn({appConfig:e,heartbeatServiceProvider:t},n){const i=Rn(e,n),r=fn(e,n),a=t.getImmediate({optional:!0});if(a){const s=await a.getHeartbeatsHeader();s&&r.append("x-firebase-client",s)}const o={installation:{sdkVersion:Fe,appId:e.appId}},c={method:"POST",headers:r,body:JSON.stringify(o)},u=await Ke(()=>fetch(i,c));if(u.ok){const s=await u.json();return Be(s)}else throw await je("Generate Auth Token",u)}function Rn(e,{fid:t}){return`${He(e)}/${t}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function te(e,t=!1){let n;const i=await x(e.appConfig,a=>{if(!Ye(a))throw I.create("not-registered");const o=a.authToken;if(!t&&Pn(o))return a;if(o.requestStatus===1)return n=Nn(e,t),a;{if(!navigator.onLine)throw I.create("app-offline");const c=Fn(a);return n=On(e,c),c}});return n?await n:i.authToken}async function Nn(e,t){let n=await he(e.appConfig);for(;n.authToken.requestStatus===1;)await Le(100),n=await he(e.appConfig);const i=n.authToken;return i.requestStatus===0?te(e,t):i}function he(e){return x(e,t=>{if(!Ye(t))throw I.create("not-registered");const n=t.authToken;return Mn(n)?{...t,authToken:{requestStatus:0}}:t})}async function On(e,t){try{const n=await Dn(e,t),i={...t,authToken:n};return await $(e.appConfig,i),n}catch(n){if(xe(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await Je(e.appConfig);else{const i={...t,authToken:{requestStatus:0}};await $(e.appConfig,i)}throw n}}function Ye(e){return e!==void 0&&e.registrationStatus===2}function Pn(e){return e.requestStatus===2&&!$n(e)}function $n(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+sn}function Fn(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function Mn(e){return e.requestStatus===1&&e.requestTime+$e<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function xn(e){const t=e,{installationEntry:n,registrationPromise:i}=await ee(t);return i?i.catch(console.error):te(t).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Hn(e,t=!1){const n=e;return await Bn(n),(await te(n,t)).token}async function Bn(e){const{registrationPromise:t}=await ee(e);t&&await t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jn(e,t){const{appConfig:n}=e;return yn(n,t),()=>{In(n,t)}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Un(e){if(!e||!e.options)throw j("App Configuration");if(!e.name)throw j("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw j(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function j(e){return I.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xe="installations",Kn="installations-internal",Ln=e=>{const t=e.getProvider("app").getImmediate(),n=Un(t),i=X(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:i,_delete:()=>Promise.resolve()}},qn=e=>{const t=e.getProvider("app").getImmediate(),n=X(t,Xe).getImmediate();return{getId:()=>xn(n),getToken:r=>Hn(n,r)}};function Vn(){y(new b(Xe,Ln,"PUBLIC")),y(new b(Kn,qn,"PRIVATE"))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Vn();m(Pe,Q);m(Pe,Q,"esm2020");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wn="/firebase-messaging-sw.js",Gn="/firebase-cloud-messaging-push-scope",Qe="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",Jn="https://fcmregistrations.googleapis.com/v1",Ze="google.c.a.c_id",zn="google.c.a.c_l",Yn="google.c.a.ts",Xn="google.c.a.e",ge=1e4;var be;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(be||(be={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var v;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked",e.FID_REGISTERED="fid-registered"})(v||(v={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function f(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function et(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),i=atob(n),r=new Uint8Array(i.length);for(let a=0;a<i.length;++a)r[a]=i.charCodeAt(a);return r}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const U="fcm_token_details_db",Qn=5,we="fcm_token_object_Store";async function Zn(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(a=>a.name).includes(U))return null;let t=null;return(await F(U,Qn,{upgrade:async(i,r,a,o)=>{if(r<2||!i.objectStoreNames.contains(we))return;const c=o.objectStore(we),u=await c.index("fcmSenderId").get(e);if(await c.clear(),!!u){if(r===2){const s=u;if(!s.auth||!s.p256dh||!s.endpoint)return;t={token:s.fcmToken,createTime:s.createTime??Date.now(),subscriptionOptions:{auth:s.auth,p256dh:s.p256dh,endpoint:s.endpoint,swScope:s.swScope,vapidKey:typeof s.vapidKey=="string"?s.vapidKey:f(s.vapidKey)}}}else if(r===3){const s=u;t={token:s.fcmToken,createTime:s.createTime,subscriptionOptions:{auth:f(s.auth),p256dh:f(s.p256dh),endpoint:s.endpoint,swScope:s.swScope,vapidKey:f(s.vapidKey)}}}else if(r===4){const s=u;t={token:s.fcmToken,createTime:s.createTime,subscriptionOptions:{auth:f(s.auth),p256dh:f(s.p256dh),endpoint:s.endpoint,swScope:s.swScope,vapidKey:f(s.vapidKey)}}}}}})).close(),await O(U),await O("fcm_vapid_details_db"),await O("undefined"),ei(t)?t:null}function ei(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ti={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","fid-registration-failed":"A problem occurred while creating an FCM registration via FID: {$errorInfo}","fid-unregister-failed":"A problem occurred while unregistering the FCM registration via FID: {$errorInfo}","fid-registration-idb-schema-unavailable":"Unable to read or persist FID registration metadata because the messaging IndexedDB schema is unavailable (for example, the database could not be upgraded to the latest version).","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used.","invalid-on-registered-handler":"No onRegistered callback handler was provided or registered. Implement onRegistered() before register()."},d=new z("messaging","Messaging",ti);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const me="firebase-messaging-database",ye=2,g="firebase-messaging-store",l="firebase-messaging-fid-registration-store",ni={openDB:F,deleteDB:O};let Ie=ni,C=null;function ii(e,t,n){switch(t){case 0:if(e.createObjectStore(g),n===1)break;case 1:n===2&&e.createObjectStore(l)}}function Se(e){return{upgrade:(t,n)=>{ii(t,n,e)},blocked:()=>{},blocking:(t,n,i)=>{var r;C=null,(r=i.target)==null||r.close()},terminated:()=>{C=null}}}function E(){return C||(C=Ie.openDB(me,ye,Se(2)).catch(()=>Ie.openDB(me,ye-1,Se(1)))),C}function tt(e,t){return e.objectStoreNames.contains(t)}function ne(e){if(!tt(e,l))throw d.create("fid-registration-idb-schema-unavailable")}async function nt(e){const t=k(e),i=await(await E()).transaction(g).objectStore(g).get(t);if(i)return i;{const r=await Zn(e.appConfig.senderId);if(r)return await ie(e,r),r}}async function ie(e,t){const n=k(e),i=await E(),r=[g],a=tt(i,l);a&&r.push(l);const o=i.transaction(r,"readwrite");return await o.objectStore(g).put(t,n),a&&await o.objectStore(l).delete(n),await o.done,t}async function ri(e){const t=k(e),i=(await E()).transaction(g,"readwrite");await i.objectStore(g).delete(t),await i.done}async function re(e){const t=k(e),n=await E();return ne(n),await n.transaction(l).objectStore(l).get(t)}async function ai(e,t){const n=k(e),i=await E();ne(i);const r=i.transaction([g,l],"readwrite");return await r.objectStore(l).put(t,n),await r.objectStore(g).delete(n),await r.done,t}async function oi(e){const t=k(e),n=await E();ne(n);const i=n.transaction(l,"readwrite");await i.objectStore(l).delete(t),await i.done}function k({appConfig:e}){return e.appId}const Te="@firebase/messaging",J="0.13.3";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const si=3,ci=1e3;async function di(e,t){const n=await N(e),i=ae(t,e.appConfig.appName,!1),r={method:"POST",headers:n,body:JSON.stringify(i)};let a;try{a=await(await fetch(R(e.appConfig),r)).json()}catch(o){throw d.create("token-subscribe-failed",{errorInfo:o==null?void 0:o.toString()})}if(a.error){const o=a.error.message;throw d.create("token-subscribe-failed",{errorInfo:o})}if(!a.token)throw d.create("token-subscribe-no-token");return a.token}async function ui(e,t){var u;const n=await N(e),i=ae(t,e.appConfig.appName,!0),r={method:"POST",headers:n,body:JSON.stringify(i)};let a;try{a=await gi(()=>fetch(R(e.appConfig),r),si,ci)}catch(s){throw d.create("fid-registration-failed",{errorInfo:s==null?void 0:s.toString()})}if(a.ok)return{responseFid:await li(a)};let o;try{o=await a.json()}catch{throw d.create("fid-registration-failed",{errorInfo:a.statusText})}const c=((u=o.error)==null?void 0:u.message)??a.statusText;throw d.create("fid-registration-failed",{errorInfo:c})}async function fi(e,t){var a;const i={method:"DELETE",headers:await N(e)};let r;try{r=await fetch(`${R(e.appConfig)}/${t}`,i)}catch(o){throw d.create("fid-unregister-failed",{errorInfo:o==null?void 0:o.toString()})}if(!r.ok)try{throw((a=(await r.json()).error)==null?void 0:a.message)??r.statusText}catch(o){throw d.create("fid-unregister-failed",{errorInfo:typeof o=="string"&&o||r.statusText||(o==null?void 0:o.toString())})}}async function li(e){const t=await e.text();if(!t.trim())throw d.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is empty"});let n;try{n=JSON.parse(t)}catch{throw d.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is not valid JSON"})}const i=n.name;if(typeof i!="string"||i.length===0)throw d.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response did not include a non-empty name"});return pi(i)}const ve="/registrations/";function pi(e){const t=e.indexOf(ve);if(t!==-1){const n=e.slice(t+ve.length);if(n.length>0)return n}throw d.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response name is not a valid registration resource name"})}async function hi(e,t){const n=await N(e),i=ae(t.subscriptionOptions,e.appConfig.appName,!1),r={method:"PATCH",headers:n,body:JSON.stringify(i)};let a;try{a=await(await fetch(`${R(e.appConfig)}/${t.token}`,r)).json()}catch(o){throw d.create("token-update-failed",{errorInfo:o==null?void 0:o.toString()})}if(a.error){const o=a.error.message;throw d.create("token-update-failed",{errorInfo:o})}if(!a.token)throw d.create("token-update-no-token");return a.token}async function it(e,t){const i={method:"DELETE",headers:await N(e)};try{const a=await(await fetch(`${R(e.appConfig)}/${t}`,i)).json();if(a.error){const o=a.error.message;throw d.create("token-unsubscribe-failed",{errorInfo:o})}}catch(r){throw d.create("token-unsubscribe-failed",{errorInfo:r==null?void 0:r.toString()})}}async function gi(e,t,n){let i;for(let r=0;r<t;r++)try{return await e()}catch(a){if(i=a,r<t-1){const o=n*Math.pow(2,r);await new Promise(c=>setTimeout(c,o))}}throw i}function R({projectId:e}){return`${Jn}/projects/${e}/registrations`}async function N({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function bi(e,t){var n,i;try{if(/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(e))return new URL(e).host}catch{}try{if(typeof self<"u"&&((n=self.location)!=null&&n.href))return new URL(e,self.location.origin).host}catch{}return typeof self<"u"&&((i=self.location)!=null&&i.host)?self.location.host:t}function ae({p256dh:e,auth:t,endpoint:n,vapidKey:i,swScope:r},a,o){const c={web:{origin:bi(r,a),endpoint:n,auth:t,p256dh:e}};return o&&(c.fcm_sdk_version=J),i!==Qe&&(c.web.applicationPubKey=i),c}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wi=7*24*60*60*1e3;async function mi(e){const t=await vi(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:f(t.getKey("auth")),p256dh:f(t.getKey("p256dh"))},i=await nt(e.firebaseDependencies);if(i){if(_i(i.subscriptionOptions,n))return Date.now()>=i.createTime+wi?Ti(e,{token:i.token,createTime:Date.now(),subscriptionOptions:n}):i.token;try{await it(e.firebaseDependencies,i.token)}catch(r){console.warn(r)}return _e(e.firebaseDependencies,n)}else return _e(e.firebaseDependencies,n)}async function yi(e,t){await it(e.firebaseDependencies,t.token),await ri(e.firebaseDependencies),await rt(e.firebaseDependencies)}async function Ii(e){const t=await re(e.firebaseDependencies).catch(()=>{}),n=t==null?void 0:t.fid;n&&await fi(e.firebaseDependencies,n),await rt(e.firebaseDependencies),n&&ki(e,n)}async function Si(e){const t=await nt(e.firebaseDependencies);t?await yi(e,t):await Ii(e);const n=await e.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function Ti(e,t){try{const n=await hi(e.firebaseDependencies,t),i={...t,token:n,createTime:Date.now()};return await ie(e.firebaseDependencies,i),n}catch(n){throw n}}async function _e(e,t){const i={token:await di(e,t),createTime:Date.now(),subscriptionOptions:t};return await ie(e,i),i.token}async function vi(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:et(t)})}function _i(e,t){const n=t.vapidKey===e.vapidKey,i=t.endpoint===e.endpoint,r=t.auth===e.auth,a=t.p256dh===e.p256dh;return n&&i&&r&&a}async function rt(e){try{await oi(e)}catch{}}function Ei(e,t){const n=e.onRegisteredHandler;n&&(typeof n=="function"?n(t):n.next(t))}function ki(e,t){const n=e.onUnregisteredHandler;n&&(typeof n=="function"?n(t):n.next(t))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function at(e){try{e.swRegistration=await navigator.serviceWorker.register(Wn,{scope:Gn}),e.swRegistration.update().catch(()=>{}),await Ai(e.swRegistration)}catch(t){throw d.create("failed-service-worker-registration",{browserErrorMessage:t==null?void 0:t.message})}}async function Ai(e){return new Promise((t,n)=>{const i=setTimeout(()=>n(new Error(`Service worker not registered after ${ge} ms`)),ge),r=e.installing||e.waiting;e.active?(clearTimeout(i),t()):r?r.onstatechange=a=>{var o;((o=a.target)==null?void 0:o.state)==="activated"&&(r.onstatechange=null,clearTimeout(i),t())}:(clearTimeout(i),n(new Error("No incoming service worker found.")))})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ot(e,t){if(!t&&!e.swRegistration&&await at(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw d.create("invalid-sw-registration");e.swRegistration=t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function st(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=Qe)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ee=3;async function Ci(e,t){const n=await Di(e.swRegistration,e.vapidKey),i={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:n.endpoint,auth:f(n.getKey("auth")),p256dh:f(n.getKey("p256dh"))},r=e.firebaseDependencies.installations;for(let a=0;a<Ee;a++){const{responseFid:o}=await ui(e.firebaseDependencies,i);if(o===t)return;a<Ee-1&&await r.getToken(!0)}throw d.create("fid-registration-failed",{errorInfo:"CreateRegistration response FID does not match Firebase Installation ID"})}async function Di(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:et(t)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ri=7*24*60*60*1e3;async function ct(e,t){if(!navigator)throw d.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw d.create("permission-blocked");if(!e.onRegisteredHandler)throw d.create("invalid-on-registered-handler");await st(e,t==null?void 0:t.vapidKey),await ot(e,t==null?void 0:t.serviceWorkerRegistration);const n=e._registerNotifyChain.catch(()=>{});return e._registerNotifyChain=n.then(async()=>{const i=await e.firebaseDependencies.installations.getId(),r=await re(e.firebaseDependencies),a=Date.now();if((!r||r.fid!==i||a>=r.lastRegisterTime+Ri)&&(await Ci(e,i),await ai(e.firebaseDependencies,{fid:i,lastRegisterTime:a,vapidKey:e.vapidKey})),!e.onRegisteredHandler)throw d.create("invalid-on-registered-handler");Ei(e,i)}),e._registerNotifyChain}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ni(e,t){return jn(t,()=>{(async()=>!e.onRegisteredHandler||!await re(e.firebaseDependencies)||await ct(e).catch(()=>{}))()})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ke(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Oi(t,e),Pi(t,e),$i(t,e),t}function Oi(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const i=t.notification.body;i&&(e.notification.body=i);const r=t.notification.image;r&&(e.notification.image=r);const a=t.notification.icon;a&&(e.notification.icon=a)}function Pi(e,t){t.data&&(e.data=t.data)}function $i(e,t){var r,a,o,c;if(!t.fcmOptions&&!((r=t.notification)!=null&&r.click_action))return;e.fcmOptions={};const n=((a=t.fcmOptions)==null?void 0:a.link)??((o=t.notification)==null?void 0:o.click_action);n&&(e.fcmOptions.link=n);const i=(c=t.fcmOptions)==null?void 0:c.analytics_label;i&&(e.fcmOptions.analyticsLabel=i)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fi(e){return typeof e=="object"&&!!e&&Ze in e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mi(e){if(!e||!e.options)throw K("App Configuration Object");if(!e.name)throw K("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const i of t)if(!n[i])throw K(i);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function K(e){return d.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xi{constructor(t,n,i){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.onRegisteredHandler=null,this.onUnregisteredHandler=null,this._registerNotifyChain=Promise.resolve(),this._fidChangeUnsubscribe=null,this.logEvents=[],this.logQueue={state:"stopped"};const r=Mi(t);this.firebaseDependencies={app:t,appConfig:r,installations:n,analyticsProvider:i}}_delete(){return this._fidChangeUnsubscribe&&(this._fidChangeUnsubscribe(),this._fidChangeUnsubscribe=null),this.logQueue.state==="scheduled"&&clearTimeout(this.logQueue.timerId),this.logQueue={state:"stopped"},Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function dt(e,t){if(!navigator)throw d.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw d.create("permission-blocked");return await st(e,t==null?void 0:t.vapidKey),await ot(e,t==null?void 0:t.serviceWorkerRegistration),mi(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Hi(e,t,n){const i=Bi(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(i,{message_id:n[Ze],message_name:n[zn],message_time:n[Yn],message_device_time:Math.floor(Date.now()/1e3)})}function Bi(e){switch(e){case v.NOTIFICATION_CLICKED:return"notification_open";case v.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ji(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;if(e.onMessageHandler&&n.messageType===v.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(ke(n)):e.onMessageHandler.next(ke(n))),e.onRegisteredHandler&&n.messageType===v.FID_REGISTERED){const r=n.fid;typeof e.onRegisteredHandler=="function"?e.onRegisteredHandler(r):e.onRegisteredHandler.next(r)}const i=n.data;Fi(i)&&i[Xn]==="1"&&await Hi(e,n.messageType,i)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ui=e=>{const t=new xi(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>ji(t,n)),t._fidChangeUnsubscribe=Ni(t,e.getProvider("installations").getImmediate()),t},Ki=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:i=>dt(t,i),register:i=>ct(t,i)}};function Li(){y(new b("messaging",Ui,"PUBLIC")),y(new b("messaging-internal",Ki,"PRIVATE")),m(Te,J),m(Te,J,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function A(){try{await Re()}catch{return!1}return typeof window<"u"&&De()&&pt()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function qi(e){if(!navigator)throw d.create("only-available-in-window");return e.swRegistration||await at(e),Si(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vi(e,t){if(!navigator)throw d.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function L(e=Jt()){return A().then(t=>{if(!t)throw d.create("unsupported-browser")},t=>{throw d.create("indexed-db-unsupported")}),X(M(e),"messaging").getImmediate()}async function Wi(e,t){return e=M(e),dt(e,t)}function Gi(e){return e=M(e),qi(e)}function Ji(e,t){return e=M(e),Vi(e,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Li();class oe extends ht{constructor(){super(),A().then(t=>{if(!t)return;const n=L();Ji(n,i=>this.handleNotificationReceived(i))})}async checkPermissions(){return await A()?{receive:this.convertNotificationPermissionToPermissionState(Notification.permission)}:{receive:"denied"}}async requestPermissions(){if(!await A())return{receive:"denied"};const n=await Notification.requestPermission();return{receive:this.convertNotificationPermissionToPermissionState(n)}}async isSupported(){return{isSupported:await A()}}async getToken(t){const n=L();return{token:await Wi(n,{vapidKey:t.vapidKey,serviceWorkerRegistration:t.serviceWorkerRegistration})}}async deleteToken(){const t=L();await Gi(t)}async getDeliveredNotifications(){this.throwUnimplementedError()}async removeDeliveredNotifications(t){this.throwUnimplementedError()}async removeAllDeliveredNotifications(){this.throwUnimplementedError()}async subscribeToTopic(t){this.throwUnimplementedError()}async unsubscribeFromTopic(t){this.throwUnimplementedError()}async createChannel(t){this.throwUnimplementedError()}async deleteChannel(t){this.throwUnimplementedError()}async listChannels(){this.throwUnimplementedError()}handleNotificationReceived(t){const i={notification:this.createNotificationResult(t)};this.notifyListeners(oe.notificationReceivedEvent,i)}createNotificationResult(t){var n,i,r;return{body:(n=t.notification)===null||n===void 0?void 0:n.body,data:t.data,id:t.messageId,image:(i=t.notification)===null||i===void 0?void 0:i.image,title:(r=t.notification)===null||r===void 0?void 0:r.title}}convertNotificationPermissionToPermissionState(t){let n="prompt";switch(t){case"granted":n="granted";break;case"denied":n="denied";break}return n}throwUnimplementedError(){throw this.unimplemented("Not implemented on web.")}}oe.notificationReceivedEvent="notificationReceived";export{oe as FirebaseMessagingWeb};
