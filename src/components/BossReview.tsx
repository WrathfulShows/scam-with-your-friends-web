import {useEffect,useState} from 'react';
import type {GameState} from '../game/engine';
import {dayConfig} from '../game/engine';
import {t} from '../i18n';
export function BossReview({game,total}:{game:GameState;total:number}){
 const [beat,setBeat]=useState(0),[dismissed,setDismissed]=useState(false);
 const ratio=total/dayConfig(game.day).quota;
 const quotes=[t('所有人到会议室。把笑声也带过来。'),t('今天的数字已经出来了。'),t(ratio>=1.5?'超额完成。看来咖啡机比我更会管理。':ratio>=1?'你们保住了工作。椅子明天继续出租。':'业绩没过线。纸箱就在门口，自取。')];
 const funniest=game.highlights?.filter(h=>h.day===game.day).sort((a,b)=>b.quote.length-a.quote.length)[0];
 useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches){setBeat(2);return;}const a=setTimeout(()=>setBeat(1),1800),b=setTimeout(()=>setBeat(2),3500);return()=>{clearTimeout(a);clearTimeout(b);};},[]);
 if(dismissed)return null;
 return <aside className={`boss-review beat-${beat}`} aria-label={t('老板考核')}><div className="boss-avatar" aria-hidden="true"><div className="boss-hair"/><div className="boss-eyes">• •</div><div className="boss-mouth"/><div className="boss-tie"/></div><div><small>THE BOSS / {t('绩效时刻')}</small><p key={beat}>{quotes[beat]}</p>{beat===2&&<><strong>{Math.round(ratio*100)}% {t('目标完成率')}</strong>{funniest&&<blockquote>“{funniest.quote}”</blockquote>}<small>{t('累计排障')} {game.campaign?.resolved||0} · {t('协助队友')} {game.campaign?.assists||0}</small></>}</div><button onClick={()=>setDismissed(true)} aria-label={t('收起老板点评')}>×</button></aside>;
}
