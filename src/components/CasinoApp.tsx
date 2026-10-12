import {useEffect,useRef,useState} from 'react';
import {getLocale,languageTags,t} from '../i18n';
import type {Action,GameState} from '../game/engine';

export function CasinoApp({game,dispatch,connected=true}:{game:GameState;dispatch:(action:Action)=>void;connected?:boolean}) {
 const [bet,setBet]=useState(10),[spinning,setSpinning]=useState(false),[frame,setFrame]=useState(0);
 const spinningRef=useRef(false);
 const result=game.ledger?.find(entry=>entry.label==='Rainbit 娱乐');
 const blocked=!connected?'房间连接已断开，请先重新连接。':game.phase!=='playing'?'上班后才能使用 Rainbit。':game.balance<bet?'游戏币不足，请降低投入或先完成业务。':'';
 useEffect(()=>{if(!spinning)return;const interval=setInterval(()=>setFrame(n=>n+1),90);const timer=setTimeout(()=>{spinningRef.current=false;setSpinning(false);},900);return()=>{clearInterval(interval);clearTimeout(timer);};},[spinning]);
 const symbols=['★','$','7'];
 const reels=spinning?symbols.map((_,i)=>symbols[(frame+i)%3]):result?.amount&&result.amount>0?['7','7','7']:['★','$','7'];
 const outcome=result?(result.amount>0?t('Rainbit：本轮返还 ${0}，净赚 ${1}。',[result.amount*2,result.amount]):t('Rainbit：本轮损失 ${0}。',[-result.amount])):t('娱乐收益不计入今日业绩。');
 return <div className="casino-app"><h2>{t('rainbit')}<span>{t('THE ORIGINAL OFFICE CASINO')}</span></h2><div className="casino-balance">{t('BALANCE ')}<strong>${game.balance.toLocaleString(languageTags[getLocale()])}</strong></div><div aria-label={t('转轮结果')} aria-busy={spinning} className={`slot-machine ${spinning?'spinning':''}`}>{reels.map((symbol,i)=><span key={i}>{symbol}</span>)}</div><p>{t('赢了是眼光，输了是上班。')}</p><label>{t('投入游戏币')}<select value={bet} disabled={spinning} onChange={e=>setBet(Number(e.target.value))}>{[10,25,50,100].map(value=><option key={value} value={value}>${value}</option>)}</select></label><button className="yellow full" disabled={spinning||!!blocked} onClick={()=>{if(spinningRef.current||blocked)return;spinningRef.current=true;setSpinning(true);dispatch({type:'gamble',bet});}}>{t(spinning?'转动中…':'SPIN TO WIN')}</button>{blocked&&<p className="casino-blocked">{t(blocked)}</p>}<small>{t('仅限虚构游戏币 · 无充值、提现 · 胜率 35%，中奖返还 2 倍投入')}</small><p className="casino-result" role="status">{spinning?t('转动中…'):outcome}</p></div>;
}
