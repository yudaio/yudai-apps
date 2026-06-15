# 自動タスクリスト (Claude 自律ループ用)

## ステータス定義
- [ ] 未着手
- [~] 進行中
- [x] 完了

---

## 優先度: 高

- [x] **TASK-001**: 未コミットの変更を整理してコミット

- [~] **TASK-002**: Stripe決済統合を完成させる
  - 実装は完了 (checkout/webhook API + stripe-success ページ)
  - **残り**: Vercelに環境変数を設定する必要あり
    - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`

- [x] **TASK-003**: 新規ページ(chat/create/diagnosis/tools)を完成させてナビゲーションに追加

---

## 優先度: 中

- [x] **TASK-004**: GrowthTrackerアプリを本番統合
- [x] **TASK-005**: Melody AI (Suno)の動作確認と改善
- [x] **TASK-006**: 全アプリのモバイル対応チェック
- [x] **TASK-007**: Vercelデプロイ確認 (READY: 30本デプロイ済み)

---

## 優先度: 低

- [x] **TASK-008**: 新アプリのアイデア実装 (30本達成)
- [x] **TASK-009**: SEO対策・OGP設定 (全カテゴリページにlayout.jsx追加済み)
- [ ] **TASK-010**: パフォーマンス最適化 (画像最適化、遅延読み込み)
- [x] **TASK-011**: yudai-apps layout.jsx に SEO/OGP 設定追加

---

## 🚀 達成済みアプリ (33本)

### AIチャット (4本)
- koe (声の遺産), konoka (このちゃんAI), untangle (Untangle), kiku (AIきいて)

### AI診断・分析 (8本)
- fate (運命診断), marry (婚活診断), side (副業診断), muda (無駄削減)
- rant (鬱憤爆発), tarot (AIタロット), fortune (今日の運勢), aiai (AI相性診断)

### 学習・スキル (3本)
- eigo (AI英会話), vocab (英単語クイズ), interview (AI面接練習)

### AI生成・創作 (8本)
- dream (夢映像化), monster (言葉モンスター), suno (Melody AI)
- biz (ビジネス文書), kokoro (内省), poem (AIポエム), message (AIメッセージ), selfintro (AI自己紹介文)

### ツール・体験 (6本)
- books (感情図書館), genki (元気玉), yamato (大和魂教育)
- vending (自販機マップ), recipe (AIレシピ), travel (AI旅行プランナー)

### 美容・成長 (4本)
- faceglow (FACEGLOW), growth (Growth Tracker), coach (AIコーチ), sleep (AI睡眠分析)

---

## 次の実装候補
- [x] **TASK-012**: AI自己紹介文ジェネレーター (生成・創作) — 完了
- [x] **TASK-013**: AI睡眠分析 (美容・成長カテゴリ追加) — 完了
- [x] **TASK-014**: AIチャットカテゴリに4本目追加 (AIきいて) — 完了
- [ ] **TASK-010**: パフォーマンス最適化
- [ ] **TASK-015**: AI診断・分析カテゴリに9本目追加（AIストレス診断など）
- [ ] **TASK-016**: ツール・体験カテゴリに7本目追加（AI家計簿など）
- [ ] **TASK-017**: 学習・スキルカテゴリに4本目追加（AIスピーチ練習など）
