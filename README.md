# まんまる文化祭 ARスタンプラリー — Phase 1

自治会・地域イベントへ横展開できる標準品を想定した、5キャラクター・5ARポイントの静的Webアプリです。子どもたちが描いた原画をカメラで認識し、「スタンプを貯める」を押すと対応する3Dモデルが絵から飛び出すように登場します。スタンプは端末の `localStorage` に保存します。

## Phase 1でできること

- iPhone Safari / Android Chromeからカメラを起動
- MindAR + A-Frameによる画像ターゲット認識
- 原画5枚と3Dモデル5体を番号で対応付け
- スタンプ取得後にGLBモデルを拡大・浮上・回転させてAR表示
- 認識中だけスタンプボタンを表示
- イベントID・ポイントID単位でスタンプを端末保存
- 端末内のスタンプ記録をリセット
- `event-config.json` と素材の差し替えによるイベント展開
- GitHub Pagesのサブディレクトリ配信

カメラ画像はブラウザ内で処理し、サーバーへ送信しません。スタンプは端末・ブラウザ単位の保存です。ブラウザの履歴やサイトデータを消すと失われ、別端末には引き継がれません。

トップ画面の「スタンプをリセット」は、このアプリのイベントIDに紐づくスタンプ記録だけを削除します。ブラウザ全体のキャッシュ、履歴、ほかのサイトのデータには影響しません。

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
│   ├── targets.mind           # 原画5枚から作るMindAR用認識データ
│   ├── targets/               # 01〜05の子どもたちの原画
│   ├── models/                # 原画と同番号の01〜05 GLBモデル
│   └── main-visual-2026.jpg   # トップ画面のメイン画像
└── tests/
```

`targets.mind` は、会場に掲示する5枚の原画を `01` から `05` の順番でまとめてコンパイルします。順番を変えると原画と3Dモデルの対応がずれるため、ファイル名と投入順を揃えてください。

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

1. 会場に掲示する `01_pencil.jpg`〜`05_hero_dog.jpg` を用意します。余白を含む掲示物全体を、実際に印刷する状態と同じ画像にしてください。
2. [MindAR Image Targets Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/) をPCブラウザで開きます。
3. 5枚を `01`、`02`、`03`、`04`、`05` の順にドラッグ＆ドロップし、`Start` を押します。
4. 特徴点の表示を確認します。点が少ない場合や一部に偏る場合は、画像を調整して再度コンパイルします。
5. `Download` を押して `targets.mind` を保存します。
6. ダウンロードしたファイルで `assets/targets.mind` を上書きします。
7. コンパイル元の画像を印刷し、照明・距離・角度を変えて実機テストします。

Compilerへ投入した順番が `event-config.json` の `targetIndex`（0始まり）に対応します。つまり `01_pencil.jpg` は `targetIndex: 0`、`05_hero_dog.jpg` は `targetIndex: 4` です。

## 原画と3Dモデルを差し替える

1. 原画を `assets/targets/`、対応するGLBを `assets/models/` に同じ番号で配置します。
2. 原画を番号順にCompilerへ投入し、`assets/targets.mind` を作り直します。
3. `event-config.json` の `sourceImage`、`modelFile`、`name`、各メッセージを変更します。
4. 実機を見ながら `modelScale`、`modelPosition`、`modelRotation` を調整します。

モデルには環境光・方向光と半透明の影を付け、スタンプ取得時に拡大・浮上する登場演出を加えています。GLB自体にアニメーションがなくても、ゆっくり左右へ回転して立体感を見せます。

## `event-config.json` の考え方

- `event.id`: localStorageの保存領域を分ける一意なID。年度やイベントが変わる場合は必ず変更します。
- `event.heroImage`: トップ画面に表示するイベントのメイン画像。ARキャラクター画像とは独立して差し替えられます。
- `ar.targetFile`: Compilerで作った `.mind` ファイル。
- `points[]`: キャラクターごとの原画、3Dモデル、表示サイズ、メッセージをまとめた配列。
- `targetIndex`: `.mind` 内の画像順。先頭は `0`。
- `completion.requiredStampCount`: コンプリートに必要な数。現在は `5`。

アプリは `points` をループしてARエンティティを生成します。将来ルーレットを追加するときは、保存済みポイント数が `requiredStampCount` に達した後のコンプリート処理から遷移できます。

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
3. `assets/targets/` の原画5枚を別画面に表示するか、会場用サイズで印刷します。
4. ターゲット全体を明るい場所で枠内に映します。
5. 正しいキャラクター名とスタンプボタンが現れることを確認します。
6. スタンプ取得後、原画と同番号の3Dモデルが拡大・浮上して表示されることを確認します。
7. 5ポイントすべてで、モデルの向き・大きさ・明るさ・追従を確認します。
8. ページを再読み込みし、獲得済みポイントでは3Dモデルが再表示されることを確認します。
9. 低照度、逆光、斜め、距離、混雑時の回線で試します。
10. SafariのプライベートブラウズやChromeのシークレットモードは保存が消えやすいため、本番案内では通常モードを推奨します。

## イベント終了後の運用

推奨は、即時削除ではなく「公開停止 → 保管 → 削除」です。

1. 終了時刻後、イベントURLの `index.html` を終了案内ページへ置き換えて公開停止します。
2. 設定、ターゲット画像、`targets.mind`、キャラクター素材、確定URLを非公開保管します。
3. 30〜90日後、問い合わせがなければ公開ディレクトリを削除します。
4. 翌年再利用する場合は別の `event.id` とディレクトリ名にして複製します。前年の端末データが混ざるのを防げます。

個人情報を収集しないPhase 1でも、素材の利用許諾と掲載期間は主催者・制作者間で確認してください。

## 現時点の制約

- スタンプは端末内保存のみで、不正防止や端末間同期はありません。
- 3Dモデルの見え方は各GLBの原点・向き・マテリアルに影響されるため、実機でポイントごとの微調整が必要です。
- ライブラリはCDNから読み込むため、初回起動時はインターネット接続が必要です。
- iOSではユーザー操作からカメラを開始する必要があるため、起動ボタンを設けています。

MindARの基本構成とCompiler手順は[公式ドキュメント](https://hiukim.github.io/mind-ar-js-doc/)を参照してください。
