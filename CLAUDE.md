# この秘書アプリを直すときのルール（クロード向け）

このフォルダは「社長専用の秘書アプリ」です。ここをクロードで変更するときは、次を必ず守ってください。

## 変えてよい場所（ここだけ触る）
- `public/theme.json` … 名前・色・文字サイズ（見た目）
- `public/custom/custom.css` … 画面の見た目を足す・変える（CSS）
- `public/custom/custom.js` … 画面の動きを足す（JavaScript）
- `persona.md` … 秘書の人格・口調・役割
- `memory/notes/*.md` … 覚えておいてほしいこと

## 触らない場所（井手さんが保守する本体）
- `server.mjs` / `brain.mjs` / `memory.mjs` … エンジン本体
- `public/index.html` … 画面の土台

## なぜ
本体を直接書き換えると、井手さんの更新とぶつかって壊れます。
見た目や動きを変えたいときは、**必ず** `public/theme.json` か `public/custom/` に書いてください。

## 共有の範囲
- `public/theme.json` と `public/custom/` の変更 … **自動で井手さんに共有**されます（見た目・機能）。
- `persona.md` ・ `memory/` ・ 会話 … **このパソコンの中だけ**。共有されません。
