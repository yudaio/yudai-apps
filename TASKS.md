# 自動タスクリスト (Claude 自律ループ用)

## ステータス定義
- [ ] 未着手
- [~] 進行中
- [x] 完了

---

## 2026-07-20 セッション: 重大バグ発見・修正 🚨

**根本原因を発見**: Vercelプロジェクトはリポジトリルート直下の`app/`
(6/14時点の古いスナップショット、14本、決済はLemonSqueezyの未設定
プレースホルダー)をビルドしていた。6/15〜7/20の6週間分の開発
(`yudai-apps/yudai-apps/`以下、44本+Stripe決済の本実装)は一度も
本番に反映されていなかった。**つまりこれまで収益が発生しなかったのは
当然で、コンテンツやマーケの問題ではなくデプロイ設定のミスだった。**

### 今回やったこと
- [x] **TASK-018**: 正しいv2アプリをリポジトリルートに昇格
  - 旧v1は `_archive_v1_root_20260720/` に退避(削除はしていない)
  - コミット 97ae70f, 9ff9fef
- [x] **TASK-019**: Stripeクライアントの遅延初期化化
  - モジュールトップレベルで`new Stripe(key)`していたため、
    STRIPE_SECRET_KEY未設定時に`next build`自体が失敗するバグを修正
- [x] **TASK-020**: アプリ数表示の不整合を44本に統一 (page.jsx / layout.jsx / diagnosis/page.jsx)
- [x] **TASK-021**: 未リンクだったhsp(AI HSP診断)・kojireをホーム/診断ページ導線に追加
- [x] **TASK-022**: 本番検証 — `/api/stripe/checkout`が`cs_live_...`のURLを
  200で返すことを確認。**Stripe決済は実際にライブモードで機能している**
  (Vercel側に本物の環境変数が設定済みだった)

### 判明した未確認事項 (次回セッションで検証)
- [ ] **TASK-023**: Supabase (`NEXT_PUBLIC_SUPABASE_URL`等) がVercel側で
  設定済みか未確認。未設定でもクラッシュはしない設計(`lib/supabase.js`が
  null安全)だが、premium状態の永続化に影響する可能性あり。
  `checkout.session.completed` webhook 経由の`supabase.auth.admin.updateUserById`
  が実際に動いているかは要確認。
- [ ] **TASK-024**: ローカルの`.env.local`は`ANTHROPIC_API_KEY`以外
  (Stripe/Supabase/Gemini/Groq)がすべて空。本番(Vercel)側は生きている
  ことを確認済みだが、ローカル開発では課金・保存機能のテストができない
  状態。ローカル開発を試すなら本人によるキー入力が必要(アカウント
  作成・決済情報の代行はできないため)。
- [ ] **TASK-010**: パフォーマンス最適化 (画像最適化、遅延読み込み)
- [ ] **TASK-025**: リポジトリ直下が雑多(proxy.py, gfpgan, stream_archiver等
  無関係なプロジェクトが混在)。yudai-apps専用リポジトリへの分離を検討。

---

## 優先度: 高 (過去分・完了)

- [x] TASK-001: 未コミットの変更を整理してコミット
- [x] TASK-002: Stripe決済統合(本番で動作確認済み、TASK-022参照)
- [x] TASK-003: 新規ページ(chat/create/diagnosis/tools)完成・ナビ追加

## 優先度: 中 (過去分・完了)

- [x] TASK-004: GrowthTrackerアプリを本番統合
- [x] TASK-005: Melody AI (Suno)の動作確認と改善
- [x] TASK-006: 全アプリのモバイル対応チェック
- [x] TASK-007: Vercelデプロイ確認 (今回のTASK-018で実際の反映を確認)

## 優先度: 低 (過去分)

- [x] TASK-008: 新アプリのアイデア実装 (44本達成)
- [x] TASK-009: SEO対策・OGP設定
- [x] TASK-011: yudai-apps layout.jsx に SEO/OGP 設定追加

---

## 🚀 達成済みアプリ (44本)

### AIチャット (4本)
koe, konoka, untangle, kiku

### AI診断・分析 (14本)
fate, marry, side, muda, rant, tarot, fortune, aiai, stress, morahara,
kojire, rikon, uwaki, hsp

### 学習・スキル (3本)
eigo, vocab, interview

### AI生成・創作 (8本)
dream, monster, suno, biz, kokoro, poem, message, selfintro

### ツール・体験 (11本)
books, genki, yamato, vending, recipe, travel, kakeibo, yakuin,
souzoku, fudosan, errcheck

### 美容・成長 (4本)
faceglow, growth, coach, sleep

---

## 次にやるべきこと (優先順)
1. TASK-023: Supabase側の課金後premium永続化が実際に機能しているか検証
   (webhookログを継続的にウォッチ)
2. TASK-010: パフォーマンス最適化
3. TASK-025: リポジトリの整理(無関係プロジェクトとの分離)
4. 高額課金アプリ(離婚シミュレーター¥1,480、相続税¥1,980等)の
   コンバージョン導線(useGate発火タイミング・文言)のPDCA
5. 新アプリ追加は一旦停止し、既存44本のコンバージョン改善を優先
   (アプリ数を増やすより「初めての決済」を発生させる方が優先度が高い)
