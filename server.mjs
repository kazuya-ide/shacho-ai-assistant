// server.mjs ― 社長のPCの中で常駐する小さなサーバー。
// ブラウザ（PCでもスマホでも）で開くチャット画面を出し、送られた言葉を
// クロード（claude -p）に渡して、返事を画面に返す。全部このPCの中で完結する。

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { askClaude } from './brain.mjs';
import {
  loadSettings,
  loadPersona,
  loadNotes,
  loadRecentHistory,
  saveTurn,
  buildPrompt,
} from './memory.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

async function serveStatic(res, fileRel) {
  try {
    const safe = fileRel.replace(/\.\.+/g, '').replace(/^\/+/, '');
    const path = join(PUBLIC, safe || 'index.html');
    const buf = await readFile(path);
    res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('見つかりません');
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
  });
}

const settings = await loadSettings();
const PORT = Number(process.env.PORT) || settings.port || 8787;

const server = createServer(async (req, res) => {
  // 返事API
  if (req.method === 'POST' && req.url === '/api/chat') {
    try {
      const body = JSON.parse((await readBody(req)) || '{}');
      const userMsg = (body.message || '').toString().trim();
      if (!userMsg) {
        res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'メッセージが空です。' }));
        return;
      }
      const [persona, notes, history] = await Promise.all([
        loadPersona(),
        loadNotes(),
        loadRecentHistory(),
      ]);
      const name = settings.アシスタントの名前 || '秘書';
      const prompt = buildPrompt({ persona, notes, history, userMsg, assistantName: name });
      const reply = await askClaude(prompt, { model: settings.model || '' });
      await saveTurn(userMsg, reply, name);
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ reply }));
    } catch (e) {
      res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: (e && e.message) || '不明なエラー' }));
    }
    return;
  }

  // 画面など（静的ファイル）
  if (req.method === 'GET') {
    const url = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    await serveStatic(res, url);
    return;
  }

  res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('使えないメソッドです');
});

// 二重起動・ポート重なりを分かりやすく止める。
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`ポート ${PORT} は使用中です。秘書はすでに起動している可能性があります。`);
  } else {
    console.error('起動に失敗しました:', e.message);
  }
  process.exit(1);
});

// 127.0.0.1 だけで待ち受ける。スマホからは Tailscale 経由でつなぐ（外には出さない）。
server.listen(PORT, '127.0.0.1', () => {
  const name = settings.アシスタントの名前 || '秘書';
  console.log(`「${name}」が起動しました → http://127.0.0.1:${PORT}`);
  console.log('スマホから使うときは Tailscale でこのPCにつなぎます（README参照）。');
});
