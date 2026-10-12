export interface Clip { id: string; owner: string; run: string; day: number; call: number; kind: 'video'|'audio'; created: number; blob: Blob }
function openDB(): Promise<IDBDatabase> { return new Promise((resolve,reject)=>{const r=indexedDB.open('kolkata-media',1);r.onupgradeneeded=()=>r.result.createObjectStore('clips',{keyPath:'id'});r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result);}); }
export async function clips(owner:string):Promise<Clip[]> {const db=await openDB();try{return await new Promise((resolve,reject)=>{const r=db.transaction('clips').objectStore('clips').getAll();r.onsuccess=()=>resolve((r.result as Clip[]).filter(c=>c.owner===owner).sort((a,b)=>b.created-a.created));r.onerror=()=>reject(r.error);});}finally{db.close();}}
async function write(clip:Clip|string){const db=await openDB();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('clips','readwrite');const store=tx.objectStore('clips');if(typeof clip==='string')store.delete(clip);else store.put(clip);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
export async function deleteClip(id:string){await write(id);window.dispatchEvent(new Event('swyf-media'));}
export interface CaptureState { active:boolean;pending:boolean;seconds:number;message:string }
let state:CaptureState={active:false,pending:false,seconds:0,message:''};const listeners=new Set<()=>void>();
let recorder:MediaRecorder|null=null,tracks:MediaStreamTrack[]=[],context:AudioContext|null=null,timer:ReturnType<typeof setInterval>|null=null,generation=0;
export const captureSnapshot=()=>state;
export function subscribeCapture(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
function publish(update:Partial<CaptureState>){state={...state,...update};listeners.forEach(fn=>fn());}
function release(){tracks.forEach(t=>t.stop());tracks=[];if(context)void context.close();context=null;if(timer)clearInterval(timer);timer=null;}
export function stopCapture(){generation++;const saving=!!recorder&&recorder.state!=='inactive';if(saving)recorder!.stop();release();publish({active:false,pending:saving||state.pending&&!tracks.length&&!!recorder});}
export async function startCapture(meta:Omit<Clip,'id'|'created'|'blob'>, microphone:boolean){
 if(state.active||state.pending)return;const gen=++generation;publish({pending:true,message:'',seconds:0});
 try{
  if(!navigator.mediaDevices||typeof MediaRecorder==='undefined')throw Error('此浏览器不支持录制，请使用桌面版 Chrome 或 Edge。');
  const streams:MediaStream[]=[];
  if(meta.kind==='video'){const display=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});if(gen!==generation){display.getTracks().forEach(t=>t.stop());return;}streams.push(display);tracks.push(...display.getTracks());}
  if(microphone||meta.kind==='audio'){const mic=await navigator.mediaDevices.getUserMedia({audio:true});if(gen!==generation){mic.getTracks().forEach(t=>t.stop());return;}streams.push(mic);tracks.push(...mic.getTracks());}
  const output=new MediaStream(streams.flatMap(s=>s.getVideoTracks()));const audio=streams.filter(s=>s.getAudioTracks().length);
  if(audio.length){context=new AudioContext();await context.resume();const mix=context.createMediaStreamDestination();for(const stream of audio)context.createMediaStreamSource(new MediaStream(stream.getAudioTracks())).connect(mix);output.addTrack(mix.stream.getAudioTracks()[0]);}
  const preferred=meta.kind==='video'?['video/webm;codecs=vp8,opus','video/webm','video/mp4']:['audio/webm;codecs=opus','audio/webm','audio/mp4'];
  const mimeType=preferred.find(m=>MediaRecorder.isTypeSupported(m));if(!mimeType)throw Error('浏览器没有可用的录制编码器。');
  const r=new MediaRecorder(output,{mimeType,videoBitsPerSecond:2_000_000});recorder=r;const chunks:Blob[]=[];let bytes=0;
  r.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);bytes+=e.data.size;if(bytes>64*1024*1024)stopCapture();}};
  r.onstop=()=>{const blob=new Blob(chunks,{type:r.mimeType});recorder=null;release();publish({active:false,pending:true,message:'正在保存录制…'});void (async()=>{const old=await clips(meta.owner);if(old.length>=20)throw Error('本地录制已满 20 段，请删除旧片段后再录制。');await write({...meta,id:crypto.randomUUID(),created:Date.now(),blob});window.dispatchEvent(new Event('swyf-media'));publish({pending:false,message:'录制已保存在本机素材库。'});})().catch(e=>{publish({pending:false,message:(e as Error).message});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`kolkata-recovery.${r.mimeType.includes('mp4')?'mp4':'webm'}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);});};
  r.onerror=()=>{publish({message:'录制中断，已尝试保存已有内容。'});stopCapture();};
  tracks.filter(t=>t.kind==='video').forEach(t=>t.onended=stopCapture);r.start(1000);publish({active:true,pending:false});timer=setInterval(()=>{publish({seconds:state.seconds+1});if(state.seconds>=180)stopCapture();},1000);
 }catch(e){release();publish({active:false,pending:false,message:e instanceof Error?e.message:'无法开始录制。'});}
}
