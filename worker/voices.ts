import type {Env} from './auth';
export const cloneKey=(env:Env)=>env.ELEVENLABS_API_KEY || (env.TTS_PROVIDER==='elevenlabs'?env.TTS_API_KEY:'');
export function wavDuration(bytes:Uint8Array):number {
 const text=(start:number,length:number)=>new TextDecoder().decode(bytes.slice(start,start+length));
 if(bytes.length<44||text(0,4)!=='RIFF'||text(8,4)!=='WAVE')throw Error('请上传 PCM WAV 音频。');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let rate=0,data=0;
 for(let offset=12;offset+8<=bytes.length;){const length=view.getUint32(offset+4,true),kind=text(offset,4);if(offset+8+length>bytes.length)throw Error('WAV 文件不完整。');if(kind==='fmt '){if(length<16||![1,3].includes(view.getUint16(offset+8,true)))throw Error('WAV 编码不受支持，请导出 PCM。');rate=view.getUint32(offset+16,true);}if(kind==='data')data+=length;offset+=8+length+(length%2);}
 const seconds=data/rate;if(!Number.isFinite(seconds)||seconds<10||seconds>120)throw Error('请使用 10–120 秒的清晰单人 WAV 录音。');return seconds;
}
async function boundedAudio(request:Request){const reader=request.body?.getReader();if(!reader)throw Error('没有收到音频。');const chunks:Uint8Array[]=[];let size=0;while(true){const result=await reader.read();if(result.done)break;size+=result.value.length;if(size>8*1024*1024){await reader.cancel();throw Error('音频最大 8 MB。');}chunks.push(result.value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return bytes;}
export async function createClone(env:Env,userId:string,request:Request,fetcher:typeof fetch=fetch){
 const key=cloneKey(env);if(!key)throw Error('网站尚未配置 ElevenLabs 声音克隆服务。');
 if(request.headers.get('X-Voice-Consent')!=='yes')throw Error('请确认拥有样本声音的使用授权。');
 const name=new URL(request.url).searchParams.get('name')?.trim();if(!name||name.length>40)throw Error('请输入 1–40 字的音色名称。');
 const count=await env.DB.prepare('SELECT COUNT(*) AS total FROM custom_voices WHERE user_id=?').bind(userId).first<{total:number}>();if((count?.total||0)>=3)throw Error('每个账号最多三个自定义音色，请先删除不用的音色。');
 const bytes=await boundedAudio(request);wavDuration(bytes);const form=new FormData();form.set('name',`Kolkata ${name}`);form.append('files',new Blob([bytes],{type:'audio/wav'}),'sample.wav');
 const response=await fetcher('https://api.elevenlabs.io/v1/voices/add',{method:'POST',headers:{'xi-api-key':key},body:form,signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error(`声音克隆服务拒绝请求（${response.status}），请检查服务套餐和样本。`);
 const data=await response.json() as {voice_id?:string;requires_verification?:boolean};
 if(!data.voice_id||!/^[\w-]{1,150}$/.test(data.voice_id))throw Error('服务未返回有效音色。');
 if(data.requires_verification!==false){await fetcher(`https://api.elevenlabs.io/v1/voices/${data.voice_id}`,{method:'DELETE',headers:{'xi-api-key':key},signal:AbortSignal.timeout(10000)}).catch(()=>{});throw Error('此样本需要在语音服务商完成额外验证，尚未添加到游戏。');}
 try{await env.DB.prepare('INSERT INTO custom_voices(id,user_id,provider,name,created_at) VALUES (?,?,?,?,?)').bind(data.voice_id,userId,'elevenlabs',name,Date.now()).run();}catch(e){await fetcher(`https://api.elevenlabs.io/v1/voices/${data.voice_id}`,{method:'DELETE',headers:{'xi-api-key':key},signal:AbortSignal.timeout(10000)}).catch(()=>{});throw e;}
 return {id:data.voice_id,name};
}
export async function removeClone(env:Env,userId:string,id:string,fetcher:typeof fetch=fetch){
 if(!/^[\w-]{1,150}$/.test(id))throw Error('音色编号无效。');
 const row=await env.DB.prepare('SELECT id FROM custom_voices WHERE id=? AND user_id=?').bind(id,userId).first();if(!row)throw Error('此音色不属于当前账号。');
 const key=cloneKey(env);if(!key)throw Error('声音克隆服务尚未配置。');
 const response=await fetcher(`https://api.elevenlabs.io/v1/voices/${id}`,{method:'DELETE',headers:{'xi-api-key':key},signal:AbortSignal.timeout(20000)});if(!response.ok&&response.status!==404)throw Error('音色删除失败，请稍后重试。');
 await env.DB.prepare('DELETE FROM custom_voices WHERE id=? AND user_id=?').bind(id,userId).run();return {ok:true};
}
