# 自動タスクリスト (Claude 自律ループ用)

## ステータス定義
- [ ] 未着手
- [~] 進行中
- [x] 完了

---

## 優先度: 高

- [ ] **TASK-001**: 未コミットの変更を整理してコミット
  - `app/apps/GrowthTracker.jsx`, `app/apps/Suno.jsx` などの新規ファイルをコミット
  - `app/[appId]/page.jsx`, `app/api/ai/route.js`, `app/apps/Paywall.jsx` などの修正をコミット

- [ ] **TASK-002**: Stripe決済統合を完成させる
  - `yudai-apps/app/api/stripe/` の実装確認・完成
  - `yudai-apps/app/stripe-success/` のページ完成
  - Paywallとの連携

- [ ] **TASK-003**: 新規ページ(chat/create/diagnosis/tools)を完成させてナビゲーションに追加
  - `yudai-apps/app/chat/page.jsx`
  - `yudai-apps/app/create/page.jsx`
  - `yudai-apps/app/diagnosis/page.jsx`
  - `yudai-apps/app/tools/page.jsx`

---

## 優先度: 中

- [ ] **TASK-004**: GrowthTrackerアプリを本番統合
  - メインのapp/apps/GrowthTracker.jsxをyudai-appsと同期

- [ ] **TASK-005**: Melody AI (Suno)の動作確認と改善
  - app/apps/Suno.jsx の最終チェック

- [ ] **TASK-006**: 全アプリのモバイル対応チェック
  - スマートフォンでの表示・操作感の最適化

- [ ] **TASK-007**: Vercelデプロイ確認
  - 最新の変更をVercelにデプロイして動作確認

---

## 優先度: 低

- [ ] **TASK-008**: 新アプリのアイデア実装
  - ユーザー要望に基づく新しいアプリを追加

- [ ] **TASK-009**: SEO対策・OGP設定
  - 全アプリページにmeta情報を追加

- [ ] **TASK-010**: パフォーマンス最適化
  - 画像最適化、遅延読み込み等

---

## 完了済み
(完了したタスクはここに移動)
