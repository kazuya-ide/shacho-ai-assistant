// say.mjs ― 画面を使わず、コマンドから1回だけ話しかけて動作を確かめる道具。
//   例: node tools/say.mjs "おはよう。今日の意気込みを一言で。"
// サーバーを立てなくても、記憶の読み込み → クロード → 返事 の流れをそのまま試せる。

import { askClaude } from '../brain.mjs';
import { loadSettings, loadPersona, loadNotes, loadRecentHistory, buildPrompt } from '../memory.mjs';

const userMsg = process.argv.slice(2).join(' ').trim() || 'こんにちは。自己紹介を一言でお願いします。';
const settings = await loadSettings();
const name = settings.アシスタントの名前 || '秘書';
const [persona, notes, history] = await Promise.all([loadPersona(), loadNotes(), loadRecentHistory()]);
const prompt = buildPrompt({ persona, notes, history, userMsg, assistantName: name });

console.log('【あなた】', userMsg);
console.log('【' + name + '】考えています…\n');
try {
  const reply = await askClaude(prompt, { model: settings.model || '' });
  console.log(reply);
} catch (e) {
  console.error('エラー:', e.message);
  process.exit(1);
}
