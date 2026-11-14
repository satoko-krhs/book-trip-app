# BookTrip

本の世界を、旅しよう。React + TypeScript + Viteによる、ブラウザだけで動く研修用MVPです。バックエンド、認証、予約、有料地図API、APIキーは使用しません。

## Windows ARM64でNode.js・npmを使わず表示する

ビルド済み配布版は [GitHub Releases](https://github.com/satoko-krhs/book-trip-app/releases) から取得してください。**BookTrip-Windows-Built-v0.1.1.zip** をダウンロードして「すべて展開」し、**BookTrip.html** をMicrosoft Edgeで開きます。ローカルサーバー、npm install、npm run devは不要です。

画像・スタイル・React実行コード・初期データは単体HTMLに含まれています。詳細は [Windows配布版README](README-Windows.md) を参照してください。管理画面は単体HTML内のハッシュ経路を使い、通常のWeb版のURLは従来どおりです。

Windows ARM64のEdge実機では未確認です。クラウドの管理対象Chromiumではfile://の表示がポリシーでブロックされたため、回避せず、同じ単体HTMLのHTTP配信で機能を検証しています。組織がHTML・JavaScript自体を禁止している場合は、管理者へ承認された配信方法を相談してください。セキュリティポリシーの無効化や回避は行いません。

クラウド側での配布版の再生成（Windowsユーザーは実行不要）:

```sh
npm install
npm run build
npm run build:standalone
npm test
npm run test:standalone
npm run test:routes
python scripts/package-windows.py
```

標準Vite出力は `dist/`、単体HTML・配布ZIPは `work/` に生成します。どちらもGitでは除外し、ZIPのみReleasesの添付にします。配布ZIPにはソース・node_modules・機密情報を含めません。

## 起動

Node.js 20.19+ または 22.12+（検証環境: Node.js 24）を使用します。

```sh
cd /workspace/book-trip-app
npm install
npm run dev -- --host 0.0.0.0 --port 5174 --strictPort
```

- メイン: `http://localhost:5174/`
- 管理ツール: `http://localhost:5174/admin/travel-times`
- 5174が使用中なら、既存プロセスを調べた上で `--port 5175` 等に変更してください。既存の5173サーバーを停止する必要はありません。
- 管理画面への直接アクセス・更新はViteのSPAフォールバックで動作します。外部の静的ホスティングを利用する場合も `/admin/travel-times` を `index.html` にフォールバックする設定が必要です。

**クラウド環境とWindows PCのlocalhostは別のコンピューターです。** 上記のURLはサーバーを実行したコンピューターから開きます。クラウド用ポート転送機能を利用する場合は5174を指定してください。このセッションにはポート転送URLを発行するツールがなく、利用者のPC向けURLは確認できていません。Codexの右パネルで「+ → Desktop」を開ける場合は、Desktop内のChromeから `http://localhost:5174/` を開いてください。Desktopを手動で開く経路そのものは今回の自動テストでは検証していません。

Windows PCで試す場合は、成果物のZIPを解凍してターミナルで `book-trip-app` フォルダーへ移動し、`npm install` と `npm run dev -- --host 0.0.0.0 --port 5174 --strictPort` を実行してください。そのPCのブラウザで `http://localhost:5174/` を開けます。ソースのindex.htmlや通常のdist/index.htmlのダブルクリックでは動きません。直接開く場合は上記の配布版BookTrip.htmlを使用してください。

## 実装済み

- 「坊っちゃん」「古都」「こころ」の画像付きカード選択、各4候補地。
- 出発地・帰着地、半日/1日/2日、日ごとの出発時刻、交通手段の入力。
- 半日は先頭2地点、1日は4地点、2日は2地点ずつをJSONの固定順で表示。
- 2日間のDay 1最終目的地とDay 2出発地はそれぞれ入力。未入力から宿泊先を推定しません。
- 15分単位の滞在時間編集、1分単位の移動時間編集、到着・出発・帰着予定の即時再計算。
- 移動時間 `null` と0分を区別。未入力以降の予定時刻は `--:--`、合計は未確定。翌日・2日後の時刻表示。
- 地点検索と経路確認にGoogle Maps公式Maps URLsを使用。往復経路、日別経路、端末の経由地点数制限に応じた分割で訪問順を維持。
- 管理画面で区間追加、地点/交通手段/時間/確認日/状態/出典の編集、経路を開く、ブラウザへの登録、JSONコピー・ダウンロード。
- 確認済みマスタだけを、方向・交通手段・地点IDまたは自由入力名をキーに旅程へ適用。
- PC/スマートフォン対応、明示的なエラー表示。

## データの扱い

`src/data/` に4つのJSONを配置しています。

- `books.json`: 作品と固定順のスポットID。
- `spots.json`: 名前、住所、作品との関係、確認状態、出典、サンプル滞在時間。
- `travel-times.json`: 初期マスタ。実地確認をしていないため、初期値は全区間未確認・所要時間null。
- `itinerary-templates.json`: 半日/1日/2日のスポット配置。

作品と各地点の直接の関連は未検証で、全件「未確認」、関連の出典URLはnullです。旅行候補地を作品に直接登場する聖地と断定していません。滞在時間は研修用サンプルであり実測ではありません。営業時間、休館、食事、休憩、宿泊時間は計算しません。

### 移動時間マスタ

既存のTravelTime型に `bookId` と自由入力用の `fromPlaceName` / `toPlaceName` を追加しています。

```json
{
  "id": "unique-record-id",
  "bookId": "botchan",
  "fromSpotId": "",
  "fromPlaceName": "松山駅",
  "toSpotId": "dogo-onsen",
  "travelMode": "transit",
  "durationMinutes": null,
  "checkedAt": null,
  "sourceUrl": null,
  "verificationStatus": "unverified"
}
```

- 登録先はこのブラウザのlocalStorage（`booktrip-travel-times-v1`）。実際の確認後に時間・確認日を入力して確認済みとし、「このブラウザに登録」を押します。
- 登録した値は**次に作成する旅程**に反映します。作成済み旅程の手入力値を勝手に上書きしません。
- 未確認レコードは時間が入っていても使いません。逆方向・別交通手段を流用しません。自由入力名は前後空白を除いた完全一致です。
- 確認済みの登録には両地点、0以上の整数の時間、確認日が必要です。同じ方向・交通手段・端点の確認済み重複を拒否します。
- JSONをコピーまたはダウンロードして `src/data/travel-times.json` を手動で置き換えると、初期マスタとして使用できます。ブラウザ登録がある場合はlocalStorageが優先です。初期ファイルを検証するときはブラウザのサイトデータを削除してください。
- ブラウザからソースJSONファイルは直接更新しません。別ブラウザ・別PCへの同期はありません。
- 旅程自体は画面を更新するとリセットされます。

### Google Maps

施設名＋住所を使用し、訪問順をそのままリンクにします。PCは経由地最大9件、モバイルブラウザまたは画面幅700px以下では最大3件として扱い、1リンクに収まれば1ボタン、超過時は分割します。分割時は「前半：松山駅 → 松山城」「後半：松山城 → 松山駅」のように実際の始点・終点を表示し、境界地点を共有します。URLの長さも考慮します。画面幅を切り替えるとリンクも再生成します。滞在時間、手入力の移動時間、出発時刻はGoogle Mapsへ送信しません。Google Maps側の表示名や最終的な経路・所要時間はBookTripでは制御しません。

写真はWikimedia Commonsから取得した地域のイメージ写真です。写真の作者、元ファイル、ライセンスは画面下部と `public/images/credits.json` に記載しています。カード表示に合わせてトリミングと彩度調整をしています。写真の出典は作品との関連の証拠ではありません。

## 検証

```sh
npm run build
npm test
# 別ターミナルでViteを5174で起動してから
npm run test:e2e
```

- `npm run test:routes`: Web版・単体HTML版の両方で、PC/モバイル × 半日/1日/2日の計12ケースを操作し、ボタン数・施設名・接続地点・画面幅変更を確認します。
- `npm test`: 時間計算、未確定の伝播、0分、深夜越え、全作品の固定順、2日間、マスタの方向と交通手段、Google Maps経路分割。
- `npm run test:e2e`: Playwrightを使い、実際のChromiumでフォーム検証、3作品の旅程生成、滞在/移動編集、半日/2日、宿泊先、マスタ登録・適用、直接URL/更新、JSONコピー・ダウンロード、390pxのスマートフォン表示を操作。
- システムChromiumが `/usr/bin/chromium` にある場合は利用します。他の環境は `npx playwright install chromium`、または環境変数 `CHROMIUM_PATH` に実行ファイルのパスを指定してください。テストURLの変更は `BOOKTRIP_TEST_URL` を使用します。
- 画像、スクリーンショット、テスト結果は `work/` に出力。Google Mapsのリンク構造は検証しましたが、Google Maps側で表示される経路・所要時間の実地検証はしていません。

## 今後の改善

作品との関係を文献で調査して出典を登録すること、移動時間の実地確認、営業時間や休憩の扱い、ブラウザ以外へのデータ共有、アクセシビリティの詳細検証。これらは今回のMVPには含めていません。

Google Maps URLsの仕様: https://developers.google.com/maps/documentation/urls/guide#directions-action
