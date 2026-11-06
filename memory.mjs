// memory.mjs ― 記憶のあつかい。全部「社長のPCの中のファイル」で完結する。
//   persona.md            … 社長の人格・役割・返事の仕方（井手さんが用意して埋める）
//   memory/notes/*.md     … 社長についての記憶（思想・好み・決めごと等）。何枚でも足せる
//   memory/conversations/ … 日ごとの会話ログ。ここに自動でたまる
//
// クラウドにも、井手さんのところにも出ない。読み書きはこのPCのこのフォルダだけ。

import { readFile, writeFile, readdir, mkdir, appendFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const NOTES_DIR = join(ROOT, 'memory', 'notes');
const CONV_DIR = join(ROOT, 'memory', 'conversations');

async function safeRead(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

/** 設定を読む（無ければ既定値） */
export async function loadSettings() {
  const raw = await safeRead(join(ROOT, 'config', 'settings.json'));
  const def = {
    port: 8787,
    model: '',
    アシスタントの名前: '秘書',
    直近の会話を何ターン分読むか: 8,
  };
  if (!raw) return def;
  try {
    return { ...def, ...JSON.parse(raw) };
  } catch {
    return def;
  }
}

/** 人格ファイル */
export async function loadPersona() {
  return (await safeRead(join(ROOT, 'persona.md'))).trim();
}

/** memory/notes/*.md を全部つなげて返す（.md のみ、README は除く） */
export async function loadNotes() {
  let files = [];
  try {
    files = await readdir(NOTES_DIR);
  } catch {
    return '';
  }
  const mds = files
    .filter((f) => f.toLowerCase().endsWith('.md') && f.toLowerCase() !== 'readme.md')
    .sort();
  const parts = [];
  for (const f of mds) {
    const text = (await safeRead(join(NOTES_DIR, f))).trim();
    if (text) parts.push(`--- ${f} ---\n${text}`);
  }
  return parts.join('\n\n');
}

function todayFile() {
  const d = new Date();
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
  return join(CONV_DIR, `${ymd}.md`);
}

/** 今日の会話ログの末尾（直近のやりとり）を返す */
export async function loadRecentHistory(maxChars = 6000) {
  const text = await safeRead(todayFile());
  if (!text) return '';
  return text.length > maxChars ? text.slice(text.length - maxChars) : text;
}

/** 1ターン分を会話ログに書き足す */
export async function saveTurn(userMsg, reply, assistantName = '秘書') {
  await mkdir(CONV_DIR, { recursive: true });
  const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  const block =
    `\n## ${time}\n` +
    `**堀内さん:** ${userMsg}\n\n` +
    `**${assistantName}:** ${reply}\n`;
  await appendFile(todayFile(), block, 'utf8');
}

/** 人格＋記憶＋直近会話＋今回の質問を、1本の指示文に組み立てる */
export function buildPrompt({ persona, notes, history, userMsg, assistantName = '秘書' }) {
  return [
    `あなたは、合同会社LITの代表「堀内 勝（ほりうち まさる）」さん専用のAIアシスタントです。`,
    `名前は「${assistantName}」。堀内さんに対しては、必ず丁寧な日本語（です・ます）で、要点を短く答えてください。`,
    `記憶に書いていないことは、推測で断定しないでください。分からないことは「分かりません」と正直に言ってください。`,
    ``,
    `# あなたの人格・役割`,
    persona || '（まだ設定されていません。一般的な有能で誠実な秘書として振る舞ってください。）',
    ``,
    `# 堀内さんについての記憶`,
    notes || '（まだ記憶はありません。）',
    ``,
    `# 今日のここまでの会話`,
    history || '（まだありません。）',
    ``,
    `# いまの堀内さんの発言`,
    userMsg,
    ``,
    `上をふまえ、「${assistantName}」として堀内さんへの返事だけを書いてください（前置きや説明は不要）。`,
  ].join('\n');
}
