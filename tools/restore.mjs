// restore.mjs ― backup.mjs で作った暗号バックアップから、記憶を元に戻す。
//   config/backup.key（バックアップ時と同じ鍵）が必要。
//   使い方: node tools/restore.mjs "秘書_記憶バックアップ_2026-11-09.enc"

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDecipheriv } from 'node:crypto';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const KEYFILE = join(ROOT, 'config', 'backup.key');

const encFile = process.argv[2];
if (!encFile) {
  console.error('使い方: node tools/restore.mjs <バックアップファイル.enc>');
  process.exit(1);
}
if (!existsSync(KEYFILE)) {
  console.error('鍵 config/backup.key がありません。保管しておいた鍵を config/ に戻してください。');
  process.exit(1);
}

const key = readFileSync(KEYFILE);
const buf = readFileSync(encFile);
const iv = buf.subarray(0, 12);
const tag = buf.subarray(12, 28);
const enc = buf.subarray(28);

const d = createDecipheriv('aes-256-gcm', key, iv);
d.setAuthTag(tag);
let json;
try {
  json = Buffer.concat([d.update(enc), d.final()]).toString('utf8');
} catch (e) {
  console.error('復元に失敗しました（鍵が違うか、ファイルが壊れています）: ' + e.message);
  process.exit(1);
}

const files = JSON.parse(json);
for (const [rel, content] of Object.entries(files)) {
  const abs = join(ROOT, rel);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
}
console.log('記憶を復元しました（' + Object.keys(files).length + ' ファイル）。');
