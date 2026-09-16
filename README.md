# まんまる文化祭 ARスタンプラリー（Phase 1）

GitHub Pagesで配信できる、MindAR + A-Frame の画像認識ARモックアップです。QRコードから `?spot=01` の専用ページを開き、カメラで会場の画像ターゲットを認識すると、まるぽんのPNGと吹き出しがAR表示されます。

## ファイル構成

```text
index.html                 AR画面とA-Frame/MindARのシーン
app.js                     spot判定、起動、targetFound/targetLostのUI制御
styles.css                 スマホ向け画面デザイン
assets/character-marpon.png 動作確認用の透明背景キャラクターPNG
assets/target-demo.svg     会場に設置するターゲット画像の見本
assets/targets.mind        MindARで生成する認識データ（要作成）
```

## 1. まずローカルで確認する

カメラは `file://` では動かないため、VS CodeのLive Serverなど、HTTPSまたはlocalhostで配信します。静的サーバーでプロジェクト直下を開き、`/index.html?spot=01` にアクセスしてください。

最初の表示では、`assets/targets.mind` が未作成のためエラーになります。次の手順で作成します。

## 2. MindAR Image Target Compilerでtargets.mindを作る

1. [MindAR Image Target Compiler](https://hiukim.github.io/mind-ar-js/tools/compile) を開く。
2. `assets/target-demo.svg` をPNGまたはJPGとして書き出してアップロードする。印刷物を使う場合は、実際に会場へ置く画像をアップロードする。
3. 画像の特徴点が十分に表示されることを確認する。単色・余白が多すぎる画像は避ける。
4. Compile後、ダウンロードした `targets.mind` をこのプロジェクトの `assets/targets.mind` として保存する。
5. 実機でページを再読み込みし、画面のターゲット画像をカメラに映す。

本番では `target-demo.svg` を子どもたちの絵や会場オリジナルのポスターに差し替え、その画像から `targets.mind` を再生成します。`mindar-image-target="targetIndex: 0"` と対応する1枚目のターゲットを使う設計です。

## 3. QRコードを作る

GitHub Pages公開後のURLに `?spot=01` を付けたURLをQRコード化します。

```text
https://あなたのユーザー名.github.io/リポジトリ名/?spot=01
```

複数キャラへ拡張するときは `?spot=02`、`?spot=03` のように分け、`app.js` の `characters` とHTML内の `mindar-image-target` を追加します。

## 4. GitHub Pagesで公開する

1. このフォルダの内容をGitHubリポジトリのルートへアップロードする。
2. `assets/targets.mind` が含まれていることを確認する。
3. GitHubの **Settings → Pages** を開く。
4. **Deploy from a branch**、対象ブランチの `/ (root)` を選び、Saveする。
5. 発行されたHTTPS URLをQRコードにする。

MindARはカメラを使うため、GitHub PagesのHTTPS URLでテストしてください。

## 5. iPhone Safari / Android Chromeで実機テスト

- URLがHTTPSであることを確認する。
- 初回アクセス時にカメラを許可する。
- `カメラを起動する` を押す。
- 会場ターゲットを明るい場所で画面中央に映し、ゆっくり動かす。
- 認識するとまるぽんと吹き出しが表示される。
- うまく認識しない場合は、画像を大きく印刷し、光の反射・ぼけ・極端な斜め撮影を避ける。
- iPhoneではSafariのプライベートブラウズやカメラ使用中の別アプリを避ける。
- AndroidではChromeのサイト設定でカメラが許可されていることを確認する。

## 将来の拡張ポイント

キャラクターのタップ判定は、`#character` にクリックイベントを追加する場所を用意しやすい構造です。スタンプ取得は、例えば次のように `localStorage` を使って追加できます。

```js
localStorage.setItem('stamp_01', 'true');
const collected = Object.keys(localStorage).filter((key) => key.startsWith('stamp_')).length;
```

複数スタンプ化では、`characters` を増やし、各スポットの `targetIndex` とキャラクター画像・吹き出し文をデータで管理します。コンプリート判定は `collected >= requiredCount` で画面を切り替えます。
