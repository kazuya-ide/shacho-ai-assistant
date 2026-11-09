// brain.mjs ― 考える頭。社長のPCの「クロード（claude -p）」に文章で聞いて、答えを受け取る。
//
// 安全のため、ここでは claude に「道具」を一切持たせない（--tools "" と --strict-mcp-config）。
// 記憶の読み書きは server 側（node）がやり、claude は文章を書くだけにする。
// こうすると、記憶やメッセージの中に「こう動け」という文が紛れていても、claude が勝手に
// PC を操作することはない（井手さんの CLAUDE.md 2026-11-03 の注意に合わせた形）。

import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

// claude を「まっさら」な場所で動かすための作業フォルダ。
// ここで動かすことで、このPCの CLAUDE.md（全体・アプリ内）を拾わない。
const BRAIN_DIR = join(tmpdir(), 'shacho-ai-brain');
try { mkdirSync(BRAIN_DIR, { recursive: true }); } catch {}

/**
 * claude -p に prompt を渡して、返事の文章を受け取る。
 * @param {string} prompt  まるごと1本の指示文（人格＋記憶＋会話＋今回の質問）
 * @param {{model?:string, timeoutMs?:number}} opts
 * @returns {Promise<string>}
 */
export function askClaude(prompt, { model = '', timeoutMs = 180000 } = {}) {
  return new Promise((resolve, reject) => {
    // Windows では claude は .cmd のため shell 経由で呼ぶ。コマンドは1本の文字列で渡す。
    //   --tools ""            … 道具を持たせない（安全）
    //   --strict-mcp-config   … MCP 連携を読み込まない
    //   --setting-sources ""  … このPCの設定・hook（CLAUDE.md由来の振る舞い等）を読み込まない
    // さらに cwd をまっさらな作業フォルダにして、CLAUDE.md を拾わないようにする。
    // これで「秘書」の人格だけで答える（このPCの他の設定に汚染されない）。
    // 先頭の `chcp 65001` で、この子プロセスの文字コードを UTF-8 に固定する。
    // これが無いと、日本語PC(CP932)で標準入力の日本語が文字化けする。
    const cmd =
      `chcp 65001 >nul & claude -p --tools "" --strict-mcp-config --setting-sources ""` +
      (model ? ` --model ${model}` : '');

    const child = spawn(cmd, { shell: true, windowsHide: true, cwd: BRAIN_DIR });

    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('クロードの返事が時間内に返りませんでした（時間切れ）。'));
    }, timeoutMs);

    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error('クロードを起動できませんでした: ' + e.message));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(out.trim());
      } else {
        reject(
          new Error(
            'クロードに接続できませんでした。初回は一度だけサインインが必要です。' +
              'ターミナルで「claude auth login」を実行してログインしてください。' +
              (err ? '\n(詳細: ' + err.slice(0, 300) + ')' : '')
          )
        );
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
