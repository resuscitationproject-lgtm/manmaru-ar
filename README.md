# まんまる文化祭 ARスタンプラリー — Phase 1

自治会・地域イベントへ横展開できる標準品を想定した、1キャラクター・1ARポイントの静的Webアプリです。QRコードからページを開き、画像ターゲットをカメラで認識するとキャラクターと必殺技の吹き出しが現れます。「スタンプを貯める」を押すと端末の `localStorage` に保存します。

## Phase 1でできること

- iPhone Safari / Android Chromeからカメラを起動
- MindAR + A-Frameによる画像ターゲット認識
- 透過PNGキャラクターと日本語吹き出しをAR表示
- 認識中だけスタンプボタンを表示
- イベントID・ポイントID単位でスタンプを端末保存
- `event-config.json` と素材の差し替えによるイベント展開
- GitHub Pagesのサブディレクトリ配信

カメラ画像はブラウザ内で処理し、サーバーへ送信しません。スタンプは端末・ブラウザ単位の保存です。ブラウザの履歴やサイトデータを消すと失われ、別端末には引き継がれません。

## ファイル構成

```text
manmaru-ar-stamp-rally/
├── index.html
├── event-config.json          # イベント名、ARポイント、達成条件
├── styles.css
├── js/
│   ├── app.js                 # AR画面とイベント進行
│   └── stamp-store.js         # localStorage保存（複数ポイント対応）
├── assets/
│   ├── targets.mind           # MindAR用の認識データ
│   ├── target-demo.svg        # Phase 1動作確認用ターゲット
│   └── character-marpon.png   # 透過PNGキャラクター
└── tests/
```

Phase 1には、リポジトリに登録済みのデモターゲットと認識データを同梱しています。`target-demo.svg` を画像として書き出したものと `targets.mind` の組み合わせでテストし、本番前には必ず実際の会場掲示画像から作り直してください。

## ローカルで確認する

ファイルを直接開く `file://` ではカメラや設定ファイルの読み込みが動きません。フォルダ内でローカルWebサーバーを起動します。

```bash
cd manmaru-ar
npx serve .
```

PCでは表示確認ができます。スマートフォン実機でカメラを使うときは、GitHub PagesなどのHTTPS環境へ公開してください。

保存処理のテストは次で実行できます。

```bash
npm test
```

## MindAR Image Target Compilerで `targets.mind` を作る

1. 会場に掲示する画像を用意します。模様や色の変化が多く、特徴点が画像全体に分散する写真・イラストが向いています。単色背景、繰り返し模様、左右対称だけの図は避けます。
2. [MindAR Image Targets Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/) をPCブラウザで開きます。
3. ターゲット画像をドラッグ＆ドロップし、`Start` を押します。
4. 特徴点の表示を確認します。点が少ない場合や一部に偏る場合は、画像を調整して再度コンパイルします。
5. `Download` を押して `targets.mind` を保存します。
6. ダウンロードしたファイルで `assets/targets.mind` を上書きします。
7. コンパイル元の画像を印刷し、照明・距離・角度を変えて実機テストします。

複数ポイント版では、使う全画像をポイント順にまとめてコンパイルします。Compilerへ投入した順番が `event-config.json` の `targetIndex`（0始まり）に対応します。

## キャラクター透過PNGを差し替える

1. 背景を透明にした正方形に近いPNGを用意します（目安 1024×1024px、数MB以下）。
2. `assets/` に配置します。例: `assets/manmaru-character.png`
3. `event-config.json` の `characterImage` を新しいパスに変えます。
4. `characterAlt`、`speech`、`foundMessage`、`stampMessage` もイベントに合わせて変更します。

吹き出しはブラウザ内のCanvasで生成するため、日本語を画像化して準備する必要はありません。`speech` 内の `\n` で改行できます。

## `event-config.json` の考え方

- `event.id`: localStorageの保存領域を分ける一意なID。年度やイベントが変わる場合は必ず変更します。
- `ar.targetFile`: Compilerで作った `.mind` ファイル。
- `points[]`: 将来の複数キャラクター・複数ポイント用配列。Phase 1は先頭の1件を表示します。
- `targetIndex`: `.mind` 内の画像順。先頭は `0`。
- `completion.requiredStampCount`: コンプリートに必要な数。Phase 1は `1`。

将来版では `points` をループしてARエンティティを生成し、保存済みポイント数が `requiredStampCount` に達したらコンプリート画面、その後にルーレット画面へ遷移できます。保存データはすでに複数ポイントを扱える構造です。

## GitHub Pagesへ公開する

1. このフォルダをGitHubリポジトリへ置きます。複数イベントを1リポジトリで管理する場合は、イベントごとにディレクトリを分けます。

   ```text
   repository-root/
   ├── manmaru-2026/
   ├── kurosaki-2026/
   └── index.html
   ```

2. GitHubのリポジトリで **Settings → Pages** を開きます。
3. **Build and deployment** で **Deploy from a branch** を選び、公開ブランチと `/ (root)` を指定します。
4. 公開完了後、スマートフォンでHTTPSのURLを開きます。

想定URLは次の形です。

```text
試作: https://resuscitationproject-lgtm.github.io/manmaru-ar/
将来: https://ar.kitakyushu-itclub.org/manmaru-2026/
```

`ar.kitakyushu-itclub.org` をリポジトリのカスタムドメインに設定すれば、イベントごとのDNS設定は不要です。各イベントは同じドメイン配下のディレクトリとして運用します。

## QRコード

GitHub Pagesで確定したイベントURLをQRコード化します。QRコードには必ず末尾の `/` まで含む本番HTTPS URLを使ってください。印刷前に、iPhoneとAndroidの標準カメラから読み取り、目的のページが直接開くことを確認します。

## 実機テスト手順

1. iPhone SafariとAndroid ChromeでQRコードを読みます。
2. 「カメラを起動する」を押し、カメラ利用を許可します。
3. `assets/target-demo.svg`（本番では会場掲示物）を別画面に表示するか印刷します。
4. ターゲット全体を明るい場所で枠内に映します。
5. キャラクターと吹き出しが追従し、スタンプボタンが現れることを確認します。
6. スタンプを獲得してページを再読み込みし、「獲得済み」が保持されることを確認します。
7. 低照度、逆光、斜め、距離、混雑時の回線で試します。
8. SafariのプライベートブラウズやChromeのシークレットモードは保存が消えやすいため、本番案内では通常モードを推奨します。

## イベント終了後の運用

推奨は、即時削除ではなく「公開停止 → 保管 → 削除」です。

1. 終了時刻後、イベントURLの `index.html` を終了案内ページへ置き換えて公開停止します。
2. 設定、ターゲット画像、`targets.mind`、キャラクター素材、確定URLを非公開保管します。
3. 30〜90日後、問い合わせがなければ公開ディレクトリを削除します。
4. 翌年再利用する場合は別の `event.id` とディレクトリ名にして複製します。前年の端末データが混ざるのを防げます。

個人情報を収集しないPhase 1でも、素材の利用許諾と掲載期間は主催者・制作者間で確認してください。

## 現時点の制約

- スタンプは端末内保存のみで、不正防止や端末間同期はありません。
- Phase 1の画面は先頭ポイントのみ生成します。データ形式と保存処理は複数ポイント対応済みです。
- ライブラリはCDNから読み込むため、初回起動時はインターネット接続が必要です。
- iOSではユーザー操作からカメラを開始する必要があるため、起動ボタンを設けています。

MindARの基本構成とCompiler手順は[公式ドキュメント](https://hiukim.github.io/mind-ar-js-doc/)を参照してください。
