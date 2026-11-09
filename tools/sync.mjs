// sync.mjs ― 社長が変えた「見た目・機能」だけを、自動で井手さんに共有する（shacho-local ブランチ）。
//   共有するのは public/theme.json と public/custom/ だけ。
//   人格(persona.md)・記憶(memory/)・会話は .gitignore で元から入らない＝共有されない。
//   本体（server.mjs 等）が変わっていたら、事故防止のため中止して知らせる。

import { execSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const git = (args) => execSync('git ' + args, { cwd: ROOT, encoding: 'utf8' }).trim();

try {
  // 本体が変更されていないか（社長のクロードが本体を触っていないか）を先に確認
  const bodyChanged = git(
    'status --porcelain -- server.mjs brain.mjs memory.mjs public/index.html package.json CLAUDE.md'
  );
  if (bodyChanged) {
    console.error(
      '⚠ 本体ファイルが変更されています。見た目・機能だけの共有を止めました。\n' +
        '本体（server.mjs / index.html など）は井手さんが保守します。見た目は public/theme.json か public/custom/ に書いてください。\n' +
        '元に戻すか、井手さんにご連絡ください。\n' +
        bodyChanged
    );
    process.exit(2);
  }

  const changed = git('status --porcelain -- public/theme.json public/custom');
  if (!changed) {
    console.log('共有する変更はありません。');
    process.exit(0);
  }

  git('add -- public/theme.json public/custom');
  git('commit -m "社長の見た目・機能の変更（自動共有）"');
  git('push origin HEAD:shacho-local');
  console.log('見た目・機能の変更を井手さんに共有しました（shacho-local）。');
} catch (e) {
  console.error('共有に失敗しました: ' + e.message);
  process.exit(1);
}
