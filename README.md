# 重賞ノート

中央競馬の重賞（G1・G2・G3）の予想と根拠を載せる、静的サイトです。GitHub Pagesで公開できます。

## 公開のしかた（初回だけ）

1. GitHubで新しいリポジトリを作ります（例: `keiba-notes`、Publicにします）。
2. このフォルダの中身をすべてリポジトリに入れます（`index.html`、`assets`、`data`、`.nojekyll` など）。
3. リポジトリの **Settings → Pages** を開きます。
4. **Source** を `Deploy from a branch` にし、Branchを `main`、フォルダを `/ (root)` にして保存します。
5. 数分後に `https://（ユーザー名）.github.io/（リポジトリ名）/` で見られるようになります。

## 自分のパソコンで確認する

```
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。ファイルを直接ダブルクリックで開くと、データが読み込めません。

## 毎週の更新のしかた

Claudeに「今週の重賞の予想を追加して」と頼むと、次の3つを更新します。

1. `data/races.json` に、そのレースを追加します（`status` を `provisional` または `final` にします）。
2. `data/（レースID）.json` を新しく作ります。サンプルは `data/2026-11-08-argentina.json` です。
3. レース後に `data/record.json` へ、予想と結果を追記します。

更新したら、GitHubにアップロード（コミット）すると、サイトに反映されます。

## ファイル構成

```
index.html            ページ本体
assets/style.css      見た目
assets/app.js         ページの表示処理
data/races.json       レース一覧
data/（レースID）.json  各レースの予想と根拠
data/record.json      予想の成績
```

## 注意

- 予想は情報提供が目的で、的中を保証するものではありません。
- 出走表・オッズ・結果は、必ずJRAの発表と照らし合わせてください。
- 競馬サイトの自動収集（スクレイピング）は、規約で禁止されていることがあります。データはJRA公式サイトを中心に、手作業または規約に沿った方法で集めてください。
