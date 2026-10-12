import {useEffect,useState} from 'react';
import {api} from '../game/storage';
import {t} from '../i18n';
interface Lobby {code:string;name:string;players:number;day:number;phase:string}
export function LobbyBrowser({join}:{join:(code:string)=>Promise<void>}){
 const[rooms,setRooms]=useState<Lobby[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{let live=true;const controller=new AbortController();const load=()=>void api<{rooms:Lobby[]}>('/lobbies','GET',undefined,controller.signal).then(v=>{if(live){setRooms(v.rooms);setError('');}}).catch(e=>{if(live)setError((e as Error).message);});load();const timer=setInterval(load,15000);return()=>{live=false;controller.abort();clearInterval(timer);};},[revision]);
 return <section className="lobby-browser"><header><h3>{t('公开办公室')}</h3><button onClick={()=>setRevision(n=>n+1)}>{t('刷新')}</button></header>{rooms.map(room=><article key={room.code}><div><b>{room.name}</b><small>{t('第')} {room.day} {t('天')} · {room.players}/4 · {t(room.phase==='ready'?'等待开始':'可中途加入')}</small></div><button disabled={busy} onClick={async()=>{setBusy(true);try{await join(room.code);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{t('加入')}</button></article>)}{!rooms.length&&!error&&<p>{t('暂时没有公开房间。可以创建自己的办公室并公开招募。')}</p>}{error&&<p role="alert">{t(error)}</p>}</section>;
}
