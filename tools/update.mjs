// update.mjs ― 井手さんの最新（origin/main）を取り込んで、本体を更新する。
//   人格(persona.md)・記憶(memory/)・設定(settings.json)は .gitignore＝git の外なので、
//   更新しても消えない・上書きされない。見た目(theme/custom)は社長のものが優先される。

import { execSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const git = (args) => execSync('git ' + args, { cwd: ROOT, encoding: 'utf8' }).trim();

try {
  git('fetch origin');
  // 社長が theme/custom を変えていても、井手さんの本体更新をなるべく自動で取り込む。
  // 衝突（同じ行を両方が変更）が起きたら、見た目は社長のものを優先する。
  let out = '';
  try {
    out = git('merge -X ours origin/main -m "井手さんの更新を取り込み（見た目は社長優先）"');
  } catch (mergeErr) {
    // マージ中断。安全側に倒して知らせる（勝手に壊さない）。
    try { git('merge --abort'); } catch {}
    console.error(
      '更新で衝突が起きたため、中止して元の状態に戻しました。井手さんにご連絡ください。\n' +
        mergeErr.message
    );
    process.exit(1);
  }
  console.log('最新に更新しました。\n' + out);
} catch (e) {
  console.error('更新で問題が起きました: ' + e.message + '\n井手さんにご連絡ください。');
  process.exit(1);
}
