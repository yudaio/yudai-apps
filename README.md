# App Portfolio

8つのAIアプリ集

## セットアップ

```bash
npm install
```

`.env.local.example` を `.env.local` にコピーして、AnthropicのAPIキーを入れる：

```
ANTHROPIC_API_KEY=sk-ant-...
```

## 開発

```bash
npm run dev
```

## Vercelへのデプロイ

1. GitHubにpush
2. Vercelでインポート
3. 環境変数に `ANTHROPIC_API_KEY` を設定
4. Deploy

## アプリ一覧

| アプリ | URL |
|---|---|
| 🔮 運命診断 | /fate |
| 🧠 無駄削減 | /muda |
| 🎰 自販機マップ | /vending |
| 🌐 元気玉 | /genki |
| 👾 言葉モンスター | /monster |
| 📖 書物 | /books |
| 💢 鬱憤爆発 | /rant |
| 🌙 夢映像化 | /dream |

## Supabase セットアップ（オプション・クラウド保存に必要）

1. [supabase.com](https://supabase.com) で無料アカウント作成
2. 新しいプロジェクト作成
3. SQL Editorで以下を実行：

```sql
create table histories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  app_id text not null,
  input text,
  result text,
  created_at timestamptz default now()
);
alter table histories enable row level security;
create policy "own data" on histories for all using (auth.uid() = user_id);
```

4. Settings > API から URL と anon key を取得
5. `.env.local` に設定

Supabaseなしでもローカルストレージで動作します。
