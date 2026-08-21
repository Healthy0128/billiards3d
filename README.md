# 3D Billiards

スマホ・タブレット・PCのブラウザで動く、GitHub Pages向け3Dビリヤード試作です。

## 現在の実装
- Three.js 3D描画
- cannon-es 物理演算
- 16球の8ボールラック
- 球同士の衝突
- クッション反射
- 摩擦・減速
- 6ポケット判定
- 手球スクラッチ時の復帰
- ドラッグ式エイム＋ショット強度
- PC / タッチ操作
- 3種類のカメラ視点
- Web Audioによる軽量SEフォールバック

## GitHub Pages
静的サイトなので、そのままGitHub Pagesで公開できます。

Settings → Pages → Deploy from a branch → main / root

## 次に入れるもの
- 実録のキュー音・球衝突音・ポケット音
- ジャズBGM
- GLB/GLTFのビリヤード台・キュー・室内モデル
- 8-ball / 9-ballルール
- ファウル、ターン、勝敗
- 撞点UI、トップ/ドロー/サイドスピン
- ショット予測ガイドの難易度設定
- AI対戦
- ローカル2人対戦

## Libraries
- three.js 0.181.1 (MIT)
- cannon-es 0.20.0 (MIT)
