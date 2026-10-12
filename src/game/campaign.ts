import type { Call, GameState } from './engine';
import type { Scheme } from './content';

export type Focus = 'care' | 'speed' | 'chaos';
export type Intent = 'listen' | 'explain' | 'confirm';
export interface Persona { name: string; background: string; concern: string; voiceId?: string }
export interface CaseFile { variant: number; stage: number; suspicion: number; mistakes: number; inspected: string[]; steps: number; intents: Intent[]; lastText: string; baiter: boolean; persona?: Persona }
export interface Campaign { edition: 3; runId: string; focus: Focus; nextIncident: number; incidents: number; resolved: number; assists: number; eventDeadline: number; eventSerial: number; roster: Persona[] }
export const FOCUSES: Record<Focus, { name: string; description: string }> = {
 care: { name: '客户关怀', description: '每通电话多 35 秒；疑虑消退更快。适合仔细探索。' },
 speed: { name: '效率竞赛', description: '每笔收入增加 25%，但耐心减少 15 秒。' },
 chaos: { name: '混乱奖金', description: '每笔收入增加 40%，事故更频繁。' },
};
export const INTENTS: Record<Intent, { name: string; text: string }> = {
 listen: { name: '了解顾虑', text: '请告诉我你最担心的问题，以及通知上描述的情况。' },
 explain: { name: '解释方案', text: '我先解释处理方案：只核对这份通知的内容，不更改其他资料。你可以随时停止。' },
 confirm: { name: '确认意愿', text: '你理解刚才的步骤了吗？如果愿意继续，请找到通知上的参考编号。' },
};
export function makeCampaign(): Campaign { return { edition: 3, runId: crypto.randomUUID(), focus: 'care', nextIncident: 0, incidents: 0, resolved: 0, assists: 0, eventDeadline: 0, eventSerial: 0, roster: [] }; }
export function makeCase(s: GameState): CaseFile {
 const variant = (s.seed + s.serial * 17) % 6;
 return { variant, stage: 0, suspicion: 15 + variant * 4, mistakes: 0, inspected: [], steps: 0, intents: [], lastText: '', baiter: s.day > 2 && variant === 5, persona: s.campaign?.roster.length ? s.campaign.roster[s.serial % s.campaign.roster.length] : undefined };
}
export function inferIntent(text: string): Intent | null {
 if (/愿意|同意|继续|找到|参考编号|ready|agree|consent|reference|continu|concord|同意|続け|referencia/i.test(text)) return 'confirm';
 if (/解释|方案|步骤|停止|更改|explain|plan|step|stop|explic|plano|手順|説明|pasos/i.test(text)) return 'explain';
 if (/担心|问题|情况|倾听|concern|worr|happen|problem|preocup|心配|状況/i.test(text)) return 'listen';
 return null;
}
export function progressCase(c: Call, text: string, positive: boolean, negative: boolean, focus: Focus, intent = inferIntent(text)) {
 const f = c.caseFile; if (!f) return;
 const normalized = text.trim().toLowerCase();
 const repeated = normalized === f.lastText;
 f.lastText = normalized;
 f.suspicion = Math.max(0, Math.min(100, f.suspicion + (negative ? 22 : repeated ? 10 : positive ? (focus === 'care' ? -18 : -12) : 2)));
 const expected = (['listen', 'explain', 'confirm'] as Intent[])[f.stage];
 if (positive && !repeated && intent === expected && f.suspicion < 55) { f.intents.push(intent); f.stage++; }
 if (negative) f.mistakes++;
 if (f.suspicion >= 90) c.trust = Math.max(0, c.trust - 20);
}
export function readyToReveal(c: Call) { return c.caseFile ? c.caseFile.stage >= 3 && c.caseFile.suspicion < 55 && c.trust >= 55 : c.turn >= 3 && c.trust >= 55; }
export interface TaskStep { title: string; clue: string; options: string[]; answer: string; kind: 'choose' | 'order' | 'number' }
export function mission(c: Call): TaskStep[] {
 const v = c.caseFile?.variant || 0, colors = ['蓝', '绿', '橙'], color = colors[v % 3];
 const mark=['B','G','O'][v%3];
 const tag = `K-${100 + v * 19 + c.id % 17}`, amount = 30 + v * 10;
 const step = (title: string, clue: string, options: string[], answer: string, kind: TaskStep['kind'] = 'choose'): TaskStep => ({title, clue, options, answer, kind});
 const catalog: Record<Scheme, TaskStep[]> = {
  identity: [step('比对档案', `通知属于${color}组，档案尾号为 ${tag}。排除过期档案。`, [`${color}组 / ${tag} / 有效`, `${color}组 / ${tag} / 过期`, `${colors[(v+1)%3]}组 / ${tag} / 有效`], `${color}组 / ${tag} / 有效`), step('处理冲突', '旧地址已撤销，新通知已签收。选择应保留的版本。', ['保留旧地址', '保留已签收的新通知', '删除所有档案'], '保留已签收的新通知')],
  credit: [step('对账', `虚构账本初始 ${amount} 枚代币，入账 20，撤销 5。填入最终余额。`, [], String(amount + 15), 'number')],
  remote: [step('打开正确目录', `桌面便签：本次文件存放在 Documents/${color}。先检查便签，再打开该目录。`, ['Desktop', `Documents/${color}`, 'Downloads'], `Documents/${color}`), step('恢复任务文件', `回收站索引：${tag}.txt 是最新版；mission.txt 已过期。`, [`${tag}.txt`, 'mission.txt', 'totally-safe.exe'], `${tag}.txt`), step('关闭模拟连接', '任务已恢复，撤销临时连接后完成交接。', ['保持连接', '撤销临时连接'], '撤销临时连接')],
  gift: [step('拼合券面', `左半张 ${tag}，右半张 ${mark}。按左→右拼合。`, [`${tag}-${mark}`, `${mark}-${tag}`, `${tag}-X`], `${tag}-${mark}`), step('核对库存', `库存有 ${amount} 张，已使用 12 张。还有多少张可用？`, [], String(amount - 12), 'number')],
  charity: [step('安排月球补给', '猫咪站请求食物；望远镜与烟花不计入补给。选择这次配送。', ['猫粮与饮水', '观星望远镜', '庆典烟花'], '猫粮与饮水'), step('分配箱数', `共 ${amount * 3} 箱，三个站点均分。每站分配多少箱？`, [], String(amount), 'number')],
  crypto: [step('阅读玉米预报', v % 2 ? '温室关闭，普通玉米供给下降；冷库储备充足。选择有储备的品种。' : '温室开放，普通玉米收成稳定；冷库断电。选择稳定供给。', ['普通玉米', '冷库玉米'], v % 2 ? '冷库玉米' : '普通玉米'), step('设置仓位', '办公室规则：只分配四分之一仓库给本次模拟合约。总容量 100。', [], '25', 'number')],
  prize: [step('筛选提名', '奖项要求：按时交接，且没有缺勤。只有一位满足。', ['A：按时交接 / 无缺勤', 'B：延迟交接 / 无缺勤', 'C：按时交接 / 缺勤'], 'A：按时交接 / 无缺勤'), step('排好颁奖程序', '必须先核对提名，再签署证书，最后发送通知。', ['通知→证书→提名', '提名→证书→通知', '证书→提名→通知'], '提名→证书→通知', 'order')],
  retirement: [step('选择火星航线', '旅客要求无中转、提供氧气。', ['直达 / 含氧气', '中转 / 含氧气', '直达 / 无氧气'], '直达 / 含氧气'), step('计算补给', `往返 ${v + 2} 天，每天 3 包补给，额外备 2 包。总共几包？`, [], String((v + 2) * 3 + 2), 'number')],
 };
 return catalog[c.scheme];
}
export function taskComplete(c: Call) { return !c.caseFile || c.caseFile.steps >= mission(c).length; }
export const INCIDENTS = {
 virus: { title: '工作站被入侵', steps: ['断开模拟连接', '隔离可疑程序', '恢复只读备份'], decoys: ['再次运行附件', '关闭警告窗口'] },
 power: { title: '配电过载', steps: ['切断支路', '检查保险丝', '恢复总闸'], decoys: ['强行合闸', '用水降温'] },
 fire: { title: '茶水间冒烟', steps: ['切断危险电源', '使用灭火器', '通风检查'], decoys: ['继续加热', '堵住出口'] },
 raid: { title: '突袭检查', steps: ['保存工作记录', '关闭虚构业务终端', '集合清点人员'], decoys: ['删除所有记录', '锁住出口'] },
} as const;
export function validPersona(value: unknown): value is Persona {
 if (!value || typeof value !== 'object') return false;
 const p = value as Persona;
 return [p.name,p.background,p.concern].every(x => typeof x === 'string' && x.trim().length > 0) && p.name.length <= 40 && p.background.length <= 600 && p.concern.length <= 200 && (p.voiceId === undefined || /^[a-zA-Z0-9_-]{1,150}$/.test(p.voiceId));
}
export function validCampaign(value: Campaign) {
 return value && value.edition === 3 && typeof value.runId==='string' && value.runId.length>0 && value.runId.length<=80 && Object.hasOwn(FOCUSES,value.focus) && ['nextIncident','incidents','resolved','assists','eventDeadline','eventSerial'].every(k => Number.isSafeInteger(value[k as keyof Campaign]) && Number(value[k as keyof Campaign]) >= 0 && Number(value[k as keyof Campaign]) <= 1e7) && Array.isArray(value.roster) && value.roster.length <= 8 && value.roster.every(validPersona);
}
export function validCase(f: CaseFile) {
 return f && ['variant','stage','suspicion','mistakes','steps'].every(k => Number.isSafeInteger(f[k as keyof CaseFile]) && Number(f[k as keyof CaseFile]) >= 0 && Number(f[k as keyof CaseFile]) <= 100) && f.variant < 6 && f.stage <= 3 && f.steps <= 3 && Array.isArray(f.inspected) && f.inspected.length <= 12 && f.inspected.every(x => typeof x === 'string' && x.length <= 100) && Array.isArray(f.intents) && f.intents.length <= 3 && f.intents.every(x => Object.hasOwn(INTENTS,x)) && typeof f.lastText === 'string' && f.lastText.length <= 200 && typeof f.baiter === 'boolean' && (!f.persona || validPersona(f.persona));
}
