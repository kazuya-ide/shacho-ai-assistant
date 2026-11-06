# セットアップ指示書（社長のクロード デスクトップアプリに貼る用）

> 使い方：社長のPCの **クロード デスクトップアプリ** に、この文章をそのまま貼って送ってください。
> アプリがPCを操作できる設定のとき、下の手順を順にやってくれます。
> 途中で「許可しますか？」が出たら「はい」を押してください（社長の操作はそれだけ）。
> ※人が手でやることもできます（井手さん向け）。

---

以下を、このWindows PC で順に実行してください。各段階で結果を教えてください。

1. **node が入っているか確認**してください。`node --version` を実行し、バージョンが出ればOK。
   出なければ https://nodejs.org/ja の「LTS」を入れてください。

2. **アプリ一式を置く**。
   - GitHub から受け取る場合：`git clone <リポジトリURL> "%USERPROFILE%\shacho-ai"` を実行。
   - zip で受け取った場合：展開して `%USERPROFILE%\shacho-ai` に置く。

3. 置いたフォルダへ移動して、**起動できるか確認**してください。
   ```
   cd "%USERPROFILE%\shacho-ai"
   node server.mjs
   ```
   「起動しました → http://127.0.0.1:8787」と出たら成功。ブラウザでそのアドレスを開いて、チャットが出るか見てください。確認できたら、いったん閉じて（Ctrl+C）次へ。

4. **PC起動時に自動で立ち上がるようにする**（常駐）。PowerShell で：
   ```powershell
   cd "$env:USERPROFILE\shacho-ai"
   $s = (New-Object -ComObject WScript.Shell).CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\秘書.lnk")
   $s.TargetPath = "$PWD\start.cmd"; $s.WorkingDirectory = "$PWD"; $s.Save()
   ```

5. **スマホから使えるようにする**（任意）。
   - このPCに Tailscale を入れてログイン。
   - `tailscale serve --bg --tcp=8310 tcp://127.0.0.1:8787` を実行。
   - 社長のスマホにも Tailscale を入れて同じアカウントでログイン。
   - スマホのブラウザで `http://<このPCのTailscale名>:8310/` を開き、ホーム画面に追加。

6. 最後に、**うまくいった点・エラーが出た点**を一覧で教えてください。

※ 会話や記憶はこのPCの `shacho-ai` フォルダの中だけに残ります。外には送りません。
