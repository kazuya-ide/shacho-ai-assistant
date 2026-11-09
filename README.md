# 社長AIアシスタント（秘書）

堀内代表専用のAI。**社長のPCの中で常駐**して動き、**スマホからも**開ける。
考える頭は**社長の月額クロード（`claude -p`）**を使うので、ふだんは**追加費用ゼロ**。
会話も記憶も**社長のPCから一歩も出ない**（クラウドにも井手さんのところにも出ない）。

> これは井手さん向けの説明です。社長に渡す手順書は別（`../★成果物/社長AIアシスタント_はじめの準備.pdf`）。

## 何でできているか（依存ゼロ）
- node 標準機能だけ。外部パッケージなし＝社長PCへの導入が軽い。
- `server.mjs` … 常駐サーバー（127.0.0.1:8787 で画面を出す）
- `brain.mjs` … `claude -p` に文章を渡して返事をもらう（**道具なし＝安全**）
- `memory.mjs` … 人格・記憶・会話ログの読み書き
- `public/` … スマホ対応のチャット画面（PWA。ホーム画面に置ける）
- `persona.md` / `memory/notes/*.md` … 人格と記憶（ここを足す・直す）
- `config/settings.json` … ポート・モデル・名前など
- `config/mcp.json` … 将来の道具（MCP連携）を足す枠（今は空）
- `tools/say.mjs` … 画面なしで1回だけ試す道具

## 動かす
```
node server.mjs
```
ブラウザで `http://127.0.0.1:8787/` を開く。画面なしで試すなら `node tools/say.mjs "こんにちは"`。

## 常駐させる（PC起動で自動で立ち上がる）
`start.cmd` のショートカットを「スタートアップ」フォルダに置く。PowerShell で：
```powershell
$s = (New-Object -ComObject WScript.Shell).CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\秘書.lnk")
$s.TargetPath = "$PWD\start.cmd"; $s.WorkingDirectory = "$PWD"; $s.Save()
```

## 記憶の足し方
> 初回は `persona.example.md` を `persona.md` という名前でコピーして編集する。
> `persona.md`・`memory/notes/*.md`・`memory/conversations/` は **GitHubに上げない**（.gitignore）。個人情報・記憶は社長PCの中だけに置くため。
- `persona.md` … 人格・口調・役割・やってはいけないこと
- `memory/notes/*.md` … 社長の思想・好み・会社の前提など。1件1枚。何枚でも。
- クロードの過去会話を取り込むには、社長が claude.ai で書き出した文章を `memory/notes/` に `.md` で置く（本人からしか出せない）。

## スマホから使う（Tailscale）
社長スマホと社長PCを同じ Tailscale アカウントに入れ、PC側で：
```
tailscale serve --bg --tcp=8310 tcp://127.0.0.1:8787
```
スマホのブラウザで `http://<このPCのTailscale名>:8310/` を開き、ホーム画面に追加（PWA）。
※社長PCが起動している間だけ使える（本体がPCの中にあるため）。

## 送る方法（配布）と更新
- 置き場：**Private リポジトリ** `kazuya-ide/shacho-ai-assistant`（GitHub・世界に非公開）。
- 社長PCは**読み取り専用のデプロイキー**で取り込む（社長はGitHubアカウント不要）。秘密鍵は `deploy/shacho-ai-deploy`（このリポジトリには入れない）。社長PCの `%USERPROFILE%\.ssh\` に置いて clone する。clone/pull の具体コマンドは `SETUP.md` の手順2。
- 更新：井手さんが push → 社長PCで `git pull`（同じ読み取り専用キー）で反映。社長の操作ゼロ。
- 初回に社長PCでやることは、社長が**クロード デスクトップアプリに `SETUP.md` を貼る**だけ（デスクトップアプリがPC操作できる設定のとき）。
- かんたんに済ませたいときは zip 配布も可（更新は都度渡し直し）。

## 安全について
ふだんの会話で claude は**道具を一切持たない**（`--tools "" --strict-mcp-config`）。
記憶やメッセージに「こう動け」という文が紛れていても、勝手にPCを操作しない。
MCP連携が要る操作は、`config/mcp.json` に足したうえで**別モード**にして、ふだんの会話は道具なしのまま保つ。

## お金
`claude -p` は社長の月額クロードの範囲＝ふだん¥0。月額上限を超えたら従量課金に切り替わる想定。
その切替は「¥5,000ごとに続けてよいか確認」を入れる（従量課金を黙って使わない）。※この承認の仕組みは本体に組み込む予定。

## 困ったとき
- 返事が来ない → `node tools/say.mjs "テスト"` で claude 単体を確認。`claude --version` が通るか。
- 画面が出ない → `node server.mjs` のログ、ポート 8787 の重なり。
