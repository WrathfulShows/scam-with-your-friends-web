import { mission } from '../src/game/campaign';
import {normalizeLocale} from '../src/i18n/locales';
import {runtimeEnv} from './admin';
import { DurableObject } from 'cloudflare:workers';
import { gameReducer, newCampaign as newGame, dayConfig, applyDialogue, parseSave, type Action, type GameState } from '../src/game/engine';
import { makeWorld, addActor, setInput, stepWorld, interactWorld, syncDeliveries, type World, type WorldCommand } from '../src/game/world';
import { generateDialogue } from './dialogue';
import { accountsEnabled, type Env } from './auth';
interface Player { teamAt?:number; id: string; name: string; game: GameState; lastAction: number; actionCount?: number; voice?: boolean; aiAt?: number; aiCount?: number }
interface Room { retired?:Record<string,Player>; public?:boolean; offers?:Record<string,{from:string;expires:number;callId:number}>; code: string; host: string; players: Record<string, Player>; seconds: number; day: number; phase: GameState['phase']; chats: { name: string; text: string }[]; world: World }
export class OfficeRoom extends DurableObject<Env> {
 room: Room | null = null; lastTick = Date.now(); gameAccum = 0; lastSave = 0; pendingAI = new Set<string>(); lastCheckpoint = 0; lastListing = 0;
 constructor(ctx: DurableObjectState, env: Env) { super(ctx, env); ctx.blockConcurrencyWhile(async () => { this.room = (await ctx.storage.get<Room>('room')) || null; if (this.room) { this.room.world ||= makeWorld(); Object.values(this.room.players).forEach((p, i) => { p.game = parseSave(p.game) || newGame(); addActor(this.room!.world, p.id, p.name, i); p.voice = false; }); } }); }
 async listing() { if(!this.room)return;const r=this.room;if(r.public&&this.ctx.getWebSockets().some(w=>w.readyState===1))await this.env.DB.prepare('INSERT INTO public_lobbies(code,name,players,day,phase,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET name=excluded.name,players=excluded.players,day=excluded.day,phase=excluded.phase,updated_at=excluded.updated_at').bind(r.code,r.players[r.host]?.name||'Office',Object.keys(r.players).length,r.day,r.phase,Date.now()).run();else await this.env.DB.prepare('DELETE FROM public_lobbies WHERE code=?').bind(r.code).run();this.lastListing=Date.now(); }
 async save(checkpoint = false) {
  await this.ctx.storage.put("room", this.room); if(checkpoint || Date.now()-this.lastListing>10000) { try{await this.listing();}catch{console.error("Lobby listing unavailable; room preserved");} } this.lastSave = Date.now();
  if (this.room && (checkpoint || Date.now() - this.lastCheckpoint >= 5000)) {
   const now = Math.max(Date.now(), this.lastCheckpoint + 1); this.lastCheckpoint = now;
   try { await this.env.DB.batch(Object.values(this.room.players).map(p => this.env.DB.prepare("INSERT INTO room_saves(user_id,room_code,state_json,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,room_code) DO UPDATE SET state_json=excluded.state_json,updated_at=excluded.updated_at WHERE excluded.updated_at>room_saves.updated_at").bind(p.id, this.room!.code, JSON.stringify(p.game), now))); }
   catch { this.lastCheckpoint = 0; console.error("Room account checkpoint unavailable; durable room retained"); }
  }
 }
 async authorized(ws: WebSocket) {
  const a = ws.deserializeAttachment(), now = Date.now();
  if (!a?.sessionHash || !a.expiresAt || a.expiresAt <= now) { ws.close(4001, "Login required"); return false; }
  if (a.checkedUntil > now && a.accountsEnabled === accountsEnabled(this.env)) return true;
  const session = await this.env.DB.prepare("SELECT s.user_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.user_id=? AND s.expires_at>? AND u.guest=?").bind(a.sessionHash, a.id, now,accountsEnabled(this.env)?0:1).first();
  if (!session) { ws.close(4001, "Login required"); return false; }
  ws.serializeAttachment({...a, checkedUntil: now + 5000, accountsEnabled: accountsEnabled(this.env)}); return true;
 }
 total() { return [...Object.values(this.room?.players || {}),...Object.values(this.room?.retired || {})].reduce((n,p)=>n+(p.game.day===this.room?.day?p.game.earned:0),0); }
 connected(id: string) { return this.ctx.getWebSockets().some(w => w.deserializeAttachment()?.id === id && w.readyState === 1); }
 sendTo(id: string, payload: unknown) { for (const w of this.ctx.getWebSockets()) if (w.deserializeAttachment()?.id === id && w.readyState === 1) try { w.send(JSON.stringify(payload)); } catch { /* A closed peer is removed by its close event. */ } }
 error(id: string, error: string) { this.sendTo(id, { type: 'error', error }); }
 worldFor(ws:WebSocket){const world=this.room!.world,a=ws.deserializeAttachment(),seen=new Set<string>(a.photos||[]),photos=world.bodies.filter(b=>b.kind==='photo').map(b=>b.id);if(photos.length!==seen.size||photos.some(id=>!seen.has(id)))ws.serializeAttachment({...a,photos});return {...world,bodies:world.bodies.map(b=>b.kind==='photo'&&seen.has(b.id)?{...b,texture:undefined}:b)};}
 broadcast(worldOnly = false) { if (!this.room) return; const r = this.room; for (const ws of this.ctx.getWebSockets()) { const id = ws.deserializeAttachment()?.id, p = r.players[id]; if (!p) continue; try { ws.send(JSON.stringify(worldOnly ? { type: 'world', world: this.worldFor(ws) } : { type: 'state', public: !!r.public, transferOffer:r.offers?.[id] && r.offers[id].expires>Date.now()?{from:r.offers[id].from,name:r.players[r.offers[id].from]?.name}:undefined, code: r.code, self: id, host: r.host, total: this.total(), game: p.game, world: this.worldFor(ws), players: Object.values(r.players).map(p => ({ id: p.id, name: p.name, earned: p.game.earned, callStatus:p.game.call?.status, event:p.game.event, clue:p.game.call?.caseFile&&p.game.call.revealed?mission(p.game.call)[p.game.call.caseFile.steps]?.clue:undefined, online: this.connected(p.id), voice: !!p.voice, talking: r.world.actors[p.id]?.talking || 0 })), chats: r.chats })); } catch { /* Ignore disconnected sockets. */ } } }
 async schedule() { if (!await this.ctx.storage.getAlarm()) { this.lastTick = Date.now(); await this.ctx.storage.setAlarm(Date.now() + 100); } }
 async fetch(request: Request) {
  const url = new URL(request.url);
  if(url.pathname==='/voice-authorize'&&request.method==='POST'){const data=await request.json() as {id:string;voiceId:string};const p=this.room?.players[data.id];return new Response(null,{status:p&&this.connected(data.id)&&p.game.call?.caseFile?.persona?.voiceId===data.voiceId?204:403});}
  if (url.pathname === "/revoke" && request.method === "POST") { const {sessionHash} = await request.json() as {sessionHash: string}; for (const ws of this.ctx.getWebSockets()) if (ws.deserializeAttachment()?.sessionHash === sessionHash) ws.close(4001, "Logged out"); return Response.json({ok:true}); }
  if (url.pathname === '/create' || url.pathname === '/join') {
   const data = await request.json() as { id: string; name: string; code: string; public?:boolean };
   if (!this.room && url.pathname === '/join') return Response.json({ error: '房间不存在，请检查邀请码。' }, { status: 404 });
   if (!this.room) this.room = { public:data.public===true, code: data.code, host: data.id, players: {}, seconds: 360, day: 1, phase: 'ready', chats: [], world: makeWorld() };
   const r = this.room;
   if (!r.players[data.id] && Object.keys(r.players).length >= 4) return Response.json({ error: '房间已满（最多 4 人）。' }, { status: 409 });
   if (!r.players[data.id] && ['won','fired'].includes(r.phase)) return Response.json({ error: '本局已开始。请等待下一局或创建新房间。' }, { status: 409 });
   const newcomer=!r.players[data.id]&&!r.retired?.[data.id];if(r.retired?.[data.id]){r.players[data.id]=r.retired[data.id];delete r.retired[data.id];const g=r.players[data.id].game;if(g.day!==r.day){g.day=r.day;g.earned=0;g.event=null;g.eventTriggered=false;g.eventSteps=0;if(g.campaign){g.campaign.incidents=0;g.campaign.nextIncident=Math.max(0,r.seconds-70);}}g.phase=r.phase;g.seconds=r.seconds;}

   r.players[data.id] ||= { id: data.id, name: data.name, game: newGame(crypto.getRandomValues(new Uint32Array(1))[0]), lastAction: 0 };
   if(newcomer && r.phase!=='ready'){const g=r.players[data.id].game;g.phase=r.phase;g.day=r.day;g.seconds=r.seconds;g.campaign!.focus=r.players[r.host]?.game.campaign?.focus||'care';g.campaign!.nextIncident=Math.max(0,r.seconds-65);}
   if(!r.host)r.host=data.id;
   addActor(r.world, data.id, data.name, [0,1,2,3].find(seat=>!Object.values(r.world.actors).some(a=>a.seat===seat))||0);
   await this.save(true); return Response.json({ code: r.code });
  }
  const id = request.headers.get('X-Player-Id'), sessionHash = request.headers.get("X-Session-Hash"), expiresAt = Number(request.headers.get("X-Session-Expires"));
  if (!id || !sessionHash || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || !this.room?.players[id]) return new Response('Join room first', { status: 403 });
  for (const old of this.ctx.getWebSockets()) if (old.deserializeAttachment()?.id === id) old.close(1000, 'Reconnected');
  const pair = new WebSocketPair(); this.ctx.acceptWebSocket(pair[1]); pair[1].serializeAttachment({ id, sessionHash, expiresAt, checkedUntil: Date.now() + 5000 });
  if (!this.connected(this.room.host)) this.room.host = id;
  this.broadcast(); await this.schedule(); return new Response(null, { status: 101, webSocket: pair[0] });
 }
 async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
  if (typeof message !== 'string' || message.length > 16000 || !this.room) return;
  if (!await this.authorized(ws)) return;
  const id: string = ws.deserializeAttachment()?.id, p = this.room.players[id]; if (!p) return;
  if (Date.now() - p.lastAction >= 1000) { p.lastAction = Date.now(); p.actionCount = 0; }
  if ((p.actionCount = (p.actionCount || 0) + 1) > 100) { this.error(id, '操作过于频繁，请稍后再试。'); return; }
  let data; try { data = JSON.parse(message); } catch { return; } if (!data || typeof data !== 'object') return;
  const r = this.room, actor = r.world.actors[id];
  if(data.type==='leave'){
   await this.save(true);interactWorld(r.world,id,{type:'drop'},p.game);p.game.call=null;p.game.wait=4;r.retired||={};r.retired[id]=p;delete r.players[id];delete r.world.actors[id];r.world.bodies=r.world.bodies.filter(b=>b.kind!=='parcel'||b.owner!==id);if(r.offers)for(const key of Object.keys(r.offers))if(key===id||r.offers[key].from===id)delete r.offers[key];
   for(const socket of this.ctx.getWebSockets())if(socket.deserializeAttachment()?.id===id)socket.close(1000,'Left office');
   if(r.host===id)r.host=Object.keys(r.players).find(key=>this.connected(key))||Object.keys(r.players)[0]||'';
   await this.save(true);this.broadcast();return;
  }
  if(data.type==='visibility' && id===r.host && typeof data.value==='boolean'){r.public=data.value;await this.save(true);this.broadcast();return;}
  if(data.type==='team'){
   const other=typeof data.to==='string'?r.players[data.to]:undefined;
   if(r.phase!=='playing'||!other||data.to===id||!this.connected(data.to))return;
   r.offers||={};
   if(data.command==='offer-transfer'){
    if(!p.game.call||p.game.call.status!=='active'||other.game.call||this.pendingAI.has(id))return;
    r.offers[data.to]={from:id,expires:Date.now()+20000,callId:p.game.call.id};
   }else if(data.command==='decline-transfer'){if(r.offers[id]?.from!==data.to)return;delete r.offers[id];}
   else if(data.command==='accept-transfer'){
    const offer=r.offers[id];if(!offer||offer.from!==data.to||offer.expires<Date.now()||p.game.call||other.game.call?.id!==offer.callId||other.game.call.status!=='active'||this.pendingAI.has(data.to)||actor.mode!=='seated')return;
    p.game.call=structuredClone(other.game.call);p.game.call.id=++p.game.serial;p.game.highlights=[...(p.game.highlights||[]),...(other.game.highlights||[]).filter(h=>h.callId===offer.callId&&h.day===r.day).map(h=>({...h,callId:p.game.call!.id}))].slice(-30);p.game.call.revision=(p.game.call.revision||0)+1;other.game.call=null;other.game.wait=4;delete r.offers[id];p.game.notice='已接入队友转来的电话，调查进度已保留。';other.game.notice='电话已转交给队友。';
   }else if(data.command==='assist'||data.command==='rescue'){
    if(Date.now()-(p.teamAt||0)<20000){this.error(id,'协作操作冷却 20 秒。');return;}
    if(data.command==='assist'){
     if(other.game.call?.status!=='active')return;
     other.game.call.patience=Math.min(180,other.game.call.patience+20);if(other.game.call.caseFile)other.game.call.caseFile.suspicion=Math.max(0,other.game.call.caseFile.suspicion-12);other.game.notice=p.name+' 已协助查阅资料，增加 20 秒耐心。';
    }else{if(!other.game.event)return;if(other.game.event==='power'&&Math.hypot(actor.x-18.8,actor.z+5.4)>2){this.error(id,'支援停电需要到配电箱附近。');return;}other.game=gameReducer(other.game,{type:'fix'});other.game.notice=p.name+' 已协助完成一项应急处置。';}
    p.teamAt=Date.now();if(p.game.campaign)p.game.campaign.assists++;
   }else return;
   await this.save(true);this.broadcast();return;
  }
  if (data.type === 'input') { setInput(r.world, id, data.input); return; }
  if (data.type === 'phone-speech') { actor.phoneTalking = Number.isFinite(data.level) ? Math.max(0, Math.min(1,data.level)) : 0; actor.phoneTalkingUntil = r.world.time + .6; return; }
  if (data.type === 'voice-state') { p.voice = data.enabled === true; actor.talking = p.voice && Number.isFinite(data.level) ? Math.max(0, Math.min(1, data.level)) : 0; this.broadcast(); return; }
  if (data.type === 'signal') {
   if (!p.voice || typeof data.to !== 'string' || data.to === id || !r.players[data.to]?.voice || !this.connected(data.to)) return;
   const signal = data.signal;
   if (!signal || typeof signal !== 'object') return;
   if (signal.description && (!['offer', 'answer'].includes(signal.description.type) || typeof signal.description.sdp !== 'string' || signal.description.sdp.length > 12000)) return;
   if (signal.candidate && (typeof signal.candidate.candidate !== 'string' || signal.candidate.candidate.length > 2000)) return;
   if (!signal.description && !signal.candidate) return;
   this.sendTo(data.to, { type: 'signal', from: id, signal }); return;
  }
  if (data.type === 'dialogue') {
   if (r.phase !== 'playing' || actor.mode !== 'seated' || !p.game.call || p.game.call.status !== 'active' || p.game.event || typeof data.text !== 'string' || !data.text.trim() || data.text.length > 200) { this.sendTo(id, { type: 'dialogue-status', busy: false, error: '当前通话不可应答，请确认已入座且通话仍在继续。' }); return; }
   if (this.pendingAI.has(id)) { this.sendTo(id, { type: 'dialogue-status', busy: true, error: '上一条 AI 应答仍在处理中。' }); return; }
   if (Date.now() - (p.aiAt || 0) > 600000) { p.aiAt = Date.now(); p.aiCount = 0; }
   if ((p.aiCount = (p.aiCount || 0) + 1) > 60) { this.sendTo(id, { type: 'dialogue-status', busy: false, error: 'AI 对话额度暂时用完。' }); return; }
   this.pendingAI.add(id); this.sendTo(id, { type: 'dialogue-status', busy: true });
   const expected = structuredClone(p.game.call);
   try { const result = await generateDialogue(await runtimeEnv(this.env), expected, data.text, fetch, normalizeLocale(data.locale)); p.game = applyDialogue(p.game, data.text, result); await this.save(true); this.broadcast(); this.sendTo(id, { type: 'dialogue-status', busy: false }); }
   catch (e) { this.sendTo(id, { type: 'dialogue-status', busy: false, error: e instanceof Error ? e.message : 'AI 暂时不可用。' }); }
   finally { this.pendingAI.delete(id); } return;
  }
  if (data.type === 'world-command') {
   const c = data.command as WorldCommand;
   if (!c || !['sit', 'stand', 'interact', 'drop', 'throw', 'wave', 'use','print'].includes(c.type) || (c.type === 'use' && typeof c.item !== 'string')) return;
   const result = interactWorld(r.world, id, c, p.game); p.game = result.game; if (result.message) this.sendTo(id, { type: 'hint', message: result.message });
  } else if (data.type === 'chat' && typeof data.text === 'string' && data.text.trim()) r.chats = [...r.chats, { name: p.name, text: data.text.trim().slice(0, 240) }].slice(-30);
  else if (data.type === 'action' && data.action && typeof data.action.type === 'string') {
   const a = data.action as Action;
   if(a.type==='focus'||a.type==='roster'){if(id!==r.host||!['ready','review'].includes(r.phase))return;for(const member of Object.values(r.players))member.game=gameReducer(member.game,a);}
   else if (['start', 'next', 'review'].includes(a.type)) {
    if (id !== r.host || (a.type === 'start' && r.phase !== 'ready') || (a.type === 'next' && r.phase !== 'review')) return;
    if (a.type === 'review') this.finish();
    else { for (const player of Object.values(r.players)) player.game = gameReducer(player.game, a); r.phase = p.game.phase; r.day = p.game.day; r.seconds = p.game.seconds; this.gameAccum = 0; if(a.type==='next')for(const old of Object.values(r.retired||{})){old.game.earned=0;} }
   } else if (r.phase === 'playing' && ['accept', 'hangup', 'reply', 'verify', 'verify-credit', 'buy', 'fix', 'gamble', 'clear-notice','task','inspect','incident'].includes(a.type)) {
    if (actor.mode !== 'seated' && a.type !== 'clear-notice' && a.type !== 'hangup') { this.error(id, '请先走到自己的工位并入座。'); return; }
    if (a.type === 'reply' && (!['warm', 'confident', 'playful'].includes(a.tone) || (a.text !== undefined && typeof a.text !== 'string'))) return;
    if (a.type === 'verify' && typeof a.code !== 'string') return;
    if (a.type === 'verify-credit' && (typeof a.value !== 'string' || !Number.isInteger(a.field))) return;
    if (a.type === 'buy' && typeof a.id !== 'string') return;
    if(a.type==='fix'&&p.game.campaign)return;
    if(a.type==='incident'&&p.game.event==='power')return;
    if (a.type === 'fix' && p.game.event === 'power') { this.error(id, '停电需要到茶水间配电箱处理。'); return; }
    p.game = gameReducer(p.game, a);
   } else return;
  } else return;
  syncDeliveries(r.world, id, p.game); await this.save(true); this.broadcast();
 }
 finish() { if (!this.room || this.room.phase !== 'playing') return; const r = this.room, total = this.total(), passed = total >= dayConfig(r.day).quota; r.phase = passed ? (r.day === 7 ? 'won' : 'review') : 'fired'; for (const p of Object.values(r.players)) { p.game.phase = r.phase; p.game.seconds = r.seconds; p.game.call = null; p.game.event = null; p.game.history.push({ day: r.day, earned: total, quota: dayConfig(r.day).quota, passed }); if (r.phase === 'won') p.game.achievements = [...new Set([...(p.game.achievements || []), 'survivor'])]; } }
 async alarm() {
  if (!this.room || !this.ctx.getWebSockets().some(w => w.readyState === 1)) return;
  const r = this.room, now = Date.now(), elapsed = Math.min(2, Math.max(0, (now - this.lastTick) / 1000)); this.lastTick = now; stepWorld(r.world, elapsed);
  this.gameAccum += elapsed; let changed = false;
  while (this.gameAccum >= 1) { this.gameAccum--; if (r.phase !== 'playing') continue; r.seconds = Math.max(0, r.seconds - 1); if (!r.seconds) this.finish(); else for (const p of Object.values(r.players)) { p.game.seconds = r.seconds + 1; p.game = gameReducer(p.game, { type: 'tick' }); syncDeliveries(r.world, p.id, p.game); } changed = true; }
  for (const p of Object.values(r.players)) { const a = r.world.actors[p.id]; if (!this.connected(p.id)) { a.input.forward = a.input.side = 0; a.talking = 0; } }
  if (now - this.lastSave > 1000 || changed) await this.save();
  this.broadcast(!changed); await this.ctx.storage.setAlarm(Date.now() + 100);
 }
 async webSocketClose(ws: WebSocket) { const id = ws.deserializeAttachment()?.id; ws.close(); if (!this.room) return; const p = this.room.players[id]; if (p && !this.connected(id)) { p.voice = false; const actor = this.room.world.actors[id]; actor.talking = 0; interactWorld(this.room.world, id, { type: 'drop' }, p.game); } const next = Object.values(this.room.players).find(p => this.connected(p.id)); if (next && !this.connected(this.room.host)) this.room.host = next.id; await this.save(true); this.broadcast(); }
}

