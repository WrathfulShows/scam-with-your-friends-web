import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CasinoApp} from '../src/components/CasinoApp';
import {gameReducer,newCampaign,type GameState} from '../src/game/engine';
import {setLanguage} from '../src/i18n';
import '../src/styles.css';
setLanguage('zh');
function Fixture(){const [game,setGame]=useState(newCampaign),[connected,setConnected]=useState(true),[shown,setShown]=useState(true);return <><nav>{['ready','win','lose','poor','offline'].map(mode=><button key={mode} onClick={()=>{const g=gameReducer(newCampaign(),{type:'start'});g.seed=mode==='win'?1:1000;if(mode==='ready')g.phase='ready';if(mode==='poor')g.balance=5;setGame(g);setConnected(mode!=='offline');}}>{mode}</button>)}<button onClick={()=>setGame(g=>({...g,notice:'新来电'}))}>notification</button><button onClick={()=>setShown(v=>!v)}>toggle</button><output data-testid="quota">{game.earned}</output></nav>{shown&&<CasinoApp game={game} connected={connected} dispatch={a=>setGame(g=>gameReducer(g as GameState,a))}/>}</>;}
createRoot(document.getElementById('root')!).render(<Fixture/>);
