# 自動タスクリスト (Claude 自律ループ用)

## ステータス定義
- [ ] 未着手
- [~] 進行中
- [x] 完了

---

## 優先度: 高

- [x] **TASK-001**: 未コミットの変更を整理してコミット
  - GrowthTracker, Suno, growth APIs, Stripe関連ファイルをすべてコミット済み
  - 3コミットに整理して完了

- [~] **TASK-002**: Stripe決済統合を完成させる
  - 実装は完了 (checkout/webhook API + stripe-success ページ)
  - **残り**: Vercelに環境変数を設定する必要あり
    - `STRIPE_SECRET_KEY`
    - `STRIPE_PRICE_ID`  
    - `STRIPE_WEBHOOK_SECRET`
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - ユーザーがVercelダッシュボードで設定後、完了

- [x] **TASK-003**: 新規ページ(chat/create/diagnosis/tools)を完成させてナビゲーションに追加
  - yudai-apps/app/chat, create, diagnosis, tools ページはすべて実装済み

---

## 優先度: 中

- [x] **TASK-004**: GrowthTrackerアプリを本番統合
  - app/apps/GrowthTracker.jsx と yudai-apps/app/apps/GrowthTracker.jsx 両方に追加済み

- [x] **TASK-005**: Melody AI (Suno)の動作確認と改善
  - app/apps/Suno.jsx と yudai-apps/app/apps/Suno.jsx 両方に追加済み

- [x] **TASK-006**: 全アプリのモバイル対応チェック
  - モバイルレイアウト確認済み。StatBar 4カラム・コンテンツシングルカラム正常

- [x] **TASK-007**: Vercelデプロイ確認
  - dpl_GMf4XsK8gSKqx7jAgn7JUuCkrz1D が READY を確認
  - 本番URL: yudai-apps.vercel.app に反映済み

---

## 優先度: 低

- [x] **TASK-008**: 新アプリのアイデア実装
  - AIタロット占い (tarot) を実装 → アプリ数21本に

- [ ] **TASK-009**: SEO対策・OGP設定
  - 全アプリページにmeta情報を追加 (主要ページは完了済み)

- [ ] **TASK-010**: パフォーマンス最適化
  - 画像最適化、遅延読み込み等

- [x] **TASK-011**: yudai-apps layout.jsx に SEO/OGP 設定追加
  - layout.jsx に title・description・openGraph 設定済み

---

## 完了済み
- TASK-001: 未コミット変更の整理・コミット (3コミット)
- TASK-003: chat/create/diagnosis/toolsページ実装
- TASK-004: GrowthTracker統合
- TASK-005: Melody AI統合
- TASK-006: モバイル対応確認
- TASK-007: Vercelデプロイ確認 (READY)
- TASK-008: AIタロット占いアプリ新規実装 (21本目)
- TASK-011: layout.jsx SEO/OGP設定
- FaceGlow・Coach・ApiKeySetup を yudai-apps に追加 (コミット済み)
- yudai-apps/app/[appId]/page.jsx に戻るナビ追加
- yudai-apps/app/page.jsx に「美容・成長」カテゴリ追加
