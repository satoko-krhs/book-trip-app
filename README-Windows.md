# BookTrip ビルド済みWindows配布版

Node.js・npm・Rollupのインストールや実行は不要です。クラウドでビルドしたHTMLとブラウザ用JavaScriptをEdgeで表示します。ARM64用ネイティブモジュール、EXE、DLLは含みません。

## Windowsで開く

1. https://github.com/satoko-krhs/book-trip-app/releases で **BookTrip-Windows-Built-v0.1.0.zip** をダウンロードします。「Source code」のZIPではありません。
2. ダウンロードしたZIPを右クリックして「すべて展開」を選びます。
3. 展開先の **BookTrip.html** を右クリックし、「プログラムから開く」→「Microsoft Edge」を選びます。通常はダブルクリックでも開けます。
4. 「本の世界を、旅しよう。」と3作品のカードが表示されたら、作品と出発地を選んで旅程を作成します。ターミナルを開く必要はありません。
5. 「管理ツール」も同じHTML内から開けます。管理画面ではURL末尾が `#/admin/travel-times` になります。

BookTrip.htmlにはReact、JavaScript、CSS、画像、初期JSONデータをすべて埋め込んでいます。このファイルは同じ内容のまま別フォルダーへコピーして使えます。基本画面・旅程編集はネット接続不要です。Google Mapsの表示にはネット接続が必要です。

## 企業・組織の管理対象PCについて

Application Control、SmartScreen、Edgeの組織ポリシーなどの無効化や例外設定は不要であり、本手順では案内しません。HTMLやJavaScript自体の表示が組織のポリシーで禁止されている場合は、ポリシーを変更せず、管理者へ承認済みの配信方法を相談してください。

**Windows ARM64実機のEdgeでの表示は未確認です。** クラウドの管理対象Chromiumではローカルファイルの `file://` 表示が `ERR_BLOCKED_BY_ADMINISTRATOR` になったため、設定を変更せずにその検証を中止しました。同一の単体HTMLをHTTPで配信してクラウドのChromiumで操作確認し、読み込み後に通信を切った状態で旅程生成・時間編集を確認しています。これはWindows側のファイル表示ポリシーの許可を保証するものではありません。

## 保存・JSON出力

管理画面で「このブラウザに登録」を押すとブラウザ内へ保存します。ローカルHTMLの保存領域はブラウザやファイルパス、組織の設定に依存し、別PCと共有されません。大切な入力は「JSONをダウンロード」でバックアップしてください。クリップボードへのアクセスが許可されない場合もJSONダウンロードを使用できます。

旅程は画面の再読み込みでリセットされます。作品と地点の関連は未確認、初期移動時間はnullのままです。表示される滞在時間はサンプルであり実測値ではありません。

## ZIPの内容

- `BookTrip.html`: Windowsで直接開くための単体HTML。まずはこちらを使用します。
- `README-Windows.md`: この説明書。
- `THIRD-PARTY-NOTICES.txt`: React等のライセンス。写真の出典・ライセンスは画面下部にも表示します。
- `web/`: `npm run build` で生成した `dist/` の内容。管理者が承認した静的Webサーバーに配置する場合のために同梱しています。サーバーのルートにこの中身を配置し、`/admin/travel-times` を `index.html` へフォールバックしてください。`web/index.html` をダブルクリックする用途ではありません。
- `BUILD-INFO.json`: 元ソースのコミットID等。
- `SHA256SUMS.txt`: 同梱ファイルのSHA-256チェックサム。

ソースコード、node_modules、.env、Windowsで動かすネイティブプログラムは含みません。distをGitのソース管理へ追加せず、ビルド済みファイルだけをGitHub Releasesへ配布しています。
