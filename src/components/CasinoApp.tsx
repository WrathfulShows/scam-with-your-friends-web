import {useEffect,useRef,useState} from 'react';
import {getLocale,languageTags,t} from '../i18n';
import type {Action,GameState} from '../game/engine';
import './CasinoApp.css';
const SYMBOLS=['7','★','◆','$','●','♣'];
function outcomeSymbols(amount:number,balance:number){const n=Math.abs(Math.trunc(balance));const first=n%SYMBOLS.length;return amount>0?[SYMBOLS[first],SYMBOLS[first],SYMBOLS[first]]:[SYMBOLS[first],SYMBOLS[(first+1+Math.floor(n/6)%4)%6],SYMBOLS[(first+3)%6]];}

export function CasinoApp({game,dispatch,connected=true}:{game:GameState;dispatch:(action:Action)=>void;connected?:boolean}) {
 const [bet,setBet]=useState(10),[roll,setRoll]=useState<{id:number;before:string;started:number}|null>(null),[stopped,setStopped]=useState([true,true,true]);
 const spinningRef=useRef(false),serial=useRef(0);
 const spinning=roll!==null;
 const result=game.ledger?.find(entry=>entry.label==='Rainbit 娱乐');
 const blocked=!connected?'房间连接已断开，请先重新连接。':game.phase!=='playing'?'上班后才能使用 Rainbit。':game.balance<bet?'游戏币不足，请降低投入或先完成业务。':'';
 const resultKey=JSON.stringify(result||null);
 useEffect(()=>{
  if(!roll||resultKey===roll.before)return;
  const firstStop=Math.max(roll.started+1250,performance.now());
  const timers=[0,1,2].map(i=>setTimeout(()=>{setStopped(previous=>previous.map((value,j)=>j===i?true:value));if(i===2){spinningRef.current=false;setRoll(null);}},Math.max(0,firstStop+i*450-performance.now())));
  return()=>timers.forEach(clearTimeout);
 },[roll,resultKey]);
 useEffect(()=>{if(!connected||game.phase!=='playing'){spinningRef.current=false;setRoll(null);setStopped([true,true,true]);}},[connected,game.phase]);
 const reels=result?outcomeSymbols(result.amount,result.balance):['★','$','7'];
 const outcome=result?(result.amount>0?t('Rainbit：本轮返还 ${0}，净赚 ${1}。',[result.amount*2,result.amount]):t('Rainbit：本轮损失 ${0}。',[-result.amount])):t('娱乐收益不计入今日业绩。');
 return <div className="casino-app"><h2>{t('rainbit')}<span>{t('THE ORIGINAL OFFICE CASINO')}</span></h2><div className="casino-balance">{t('BALANCE ')}<strong>${game.balance.toLocaleString(languageTags[getLocale()])}</strong></div><div aria-label={t('转轮结果')} aria-busy={spinning} className={`slot-machine ${spinning?'spinning':''}`}>{reels.map((symbol,i)=><div key={i} className={`rainbit-reel ${spinning&&!stopped[i]?'rolling':'settled'}`} data-reel={i} aria-label={spinning&&!stopped[i]?t('转动中…'):symbol}><div key={spinning&&!stopped[i]?roll!.id:'settled'} className="rainbit-strip" style={{animationDuration:`${380+i*70}ms`}} aria-hidden="true">{spinning&&!stopped[i]?[...SYMBOLS,...SYMBOLS].map((value,j)=><span key={j}>{SYMBOLS[(j+i)%6]||value}</span>):<span>{symbol}</span>}</div></div>)}</div><p>{t('赢了是眼光，输了是上班。')}</p><label>{t('投入游戏币')}<select value={bet} disabled={spinning} onChange={e=>setBet(Number(e.target.value))}>{[10,25,50,100].map(value=><option key={value} value={value}>${value}</option>)}</select></label><button className="yellow full" disabled={spinning||!!blocked} onClick={()=>{if(spinningRef.current||blocked)return;spinningRef.current=true;setStopped([false,false,false]);setRoll({id:++serial.current,before:resultKey,started:performance.now()});dispatch({type:'gamble',bet});}}>{t(spinning?'转动中…':'SPIN TO WIN')}</button>{blocked&&<p className="casino-blocked">{t(blocked)}</p>}<small>{t('仅限虚构游戏币 · 无充值、提现 · 胜率 35%，中奖返还 2 倍投入')}</small><p className="casino-result" role="status">{spinning?t('转动中…'):outcome}</p></div>;
}
