// brain.mjs ― 考える頭。社長のPCの「クロード（claude -p）」に文章で聞いて、答えを受け取る。
//
// 安全のため、ここでは claude に「道具」を一切持たせない（--tools "" と --strict-mcp-config）。
// 記憶の読み書きは server 側（node）がやり、claude は文章を書くだけにする。
// こうすると、記憶やメッセージの中に「こう動け」という文が紛れていても、claude が勝手に
// PC を操作することはない（井手さんの CLAUDE.md 2026-11-03 の注意に合わせた形）。

import { spawn } from 'node:child_process';

/**
 * claude -p に prompt を渡して、返事の文章を受け取る。
 * @param {string} prompt  まるごと1本の指示文（人格＋記憶＋会話＋今回の質問）
 * @param {{model?:string, timeoutMs?:number}} opts
 * @returns {Promise<string>}
 */
export function askClaude(prompt, { model = '', timeoutMs = 180000 } = {}) {
  return new Promise((resolve, reject) => {
    // Windows では claude は .cmd のため shell 経由で呼ぶ。コマンドは1本の文字列で渡す。
    const cmd =
      `claude -p --tools "" --strict-mcp-config` +
      (model ? ` --model ${model}` : '');

    const child = spawn(cmd, { shell: true, windowsHide: true });

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
            'クロードが失敗しました（終了コード ' +
              code +
              '）。' +
              (err ? '\n' + err.slice(0, 600) : '')
          )
        );
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
