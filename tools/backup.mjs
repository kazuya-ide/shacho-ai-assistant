// backup.mjs ― 記憶（persona.md と memory/ の中身）を「暗号化して」1ファイルに書き出す。
//   鍵は config/backup.key（無ければ自動で作る）。この鍵が無いと中身は読めない＝井手さんにも読めない。
//   出力先に、外付けやクラウド同期フォルダ（OneDrive/Googleドライブ等）を指定すれば、
//   暗号化されたまま退避できる（PC故障・紛失に備える）。
//
//   使い方: node tools/backup.mjs "退避先フォルダ"
//   例    : node tools/backup.mjs "D:\\秘書バックアップ"

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, createCipheriv } from 'node:crypto';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const KEYFILE = join(ROOT, 'config', 'backup.key');

// 鍵（無ければ作る）
if (!existsSync(KEYFILE)) {
  writeFileSync(KEYFILE, randomBytes(32));
  console.log(
    'バックアップ用の鍵を作りました → config/backup.key\n' +
      '★この鍵を、別の場所（USBメモリ等）にもコピーして保管してください。無くすと復元できません。'
  );
}
const key = readFileSync(KEYFILE);

async function collect() {
  const files = {};
  try {
    files['persona.md'] = await readFile(join(ROOT, 'persona.md'), 'utf8');
  } catch {}
  async function walk(rel) {
    let items;
    try {
      items = await readdir(join(ROOT, rel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const it of items) {
      const r = rel + '/' + it.name;
      if (it.isDirectory()) await walk(r);
      else if (it.name.endsWith('.md')) files[r] = await readFile(join(ROOT, r), 'utf8');
    }
  }
  await walk('memory');
  return files;
}

const outDir = process.argv[2] || join(ROOT, 'backup');
await mkdir(outDir, { recursive: true });

const plain = Buffer.from(JSON.stringify(await collect()), 'utf8');
const iv = randomBytes(12);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
const tag = cipher.getAuthTag();

const ymd = new Date().toISOString().slice(0, 10);
const outFile = join(outDir, `秘書_記憶バックアップ_${ymd}.enc`);
await writeFile(outFile, Buffer.concat([iv, tag, enc]));
console.log('暗号化バックアップを作りました → ' + outFile + '\n（鍵が無いと読めません。井手さんにも読めません）');
