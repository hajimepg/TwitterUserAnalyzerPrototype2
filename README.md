Twitter フォロー分析アプリ プロトタイプ2
====

### 概要

引数で指定したユーザのTwitter利用状況を出力します。

出力項目

- プロフィール
    - スクリーンネーム
    - 名前
    - アイコン画像
    - フォロワー数
    - あなたと共通のフォロワー数(引数 `--deep-analyze` 指定時のみ)
    - フレンド数
    - あなたと共通のフレンド数(引数 `--deep-analyze` 指定時のみ)
    - Bio
- メンション先ランキングトップ10
- ハッシュタグランキングトップ10
- 曜日・時間別ツイート頻度(Heatmap)
- 日別ツイート数

### 使い方

以下の環境変数を設定します。

- TWITTER_ACCESS_TOKEN_KEY
- TWITTER_ACCESS_TOKEN_SECRET
- TWITTER_CONSUMER_KEY
- TWITTER_CONSUMER_SECRET

コマンドライン引数

`--format <json|html>`

HTML出力の場合、プロフィール画像をダウンロードします。

`--screen-name <screen-name>`

分析対象を指定します。
未指定の場合はアクセストークン発行者になります。

`--deep-analyze`

詳細な分析を行います。
その代わり、Twitter API利用数が増えます。
