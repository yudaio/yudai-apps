-- ============================================
-- book_notes テーブル
-- 書物アプリのコミュニティ共有機能
-- ============================================

create table if not exists public.book_notes (
  id           bigserial primary key,
  created_at   timestamptz default now(),
  user_id      uuid references auth.users(id) on delete set null,
  book_title   text        not null,
  phrase       text,
  note         text,
  emotions     text[]      default '{}',
  lang         text        not null default 'ja',
  likes        integer     not null default 0
);

-- インデックス（表示速度向上）
create index if not exists book_notes_lang_idx      on public.book_notes (lang);
create index if not exists book_notes_created_idx   on public.book_notes (created_at desc);
create index if not exists book_notes_user_idx      on public.book_notes (user_id);

-- RLS（Row Level Security）有効化
alter table public.book_notes enable row level security;

-- 誰でも読める（コミュニティ公開）
create policy "Anyone can read book_notes"
  on public.book_notes for select
  using (true);

-- ログインユーザーは投稿できる
create policy "Authenticated users can insert book_notes"
  on public.book_notes for insert
  to authenticated
  with check (auth.uid() = user_id OR user_id is null);

-- 自分の投稿は削除できる
create policy "Users can delete own book_notes"
  on public.book_notes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- histories テーブル（既存・なければ作成）
-- ============================================

create table if not exists public.histories (
  id         bigserial primary key,
  created_at timestamptz default now(),
  user_id    uuid references auth.users(id) on delete cascade,
  app_id     text not null,
  input      text,
  result     text
);

create index if not exists histories_user_app_idx
  on public.histories (user_id, app_id);

alter table public.histories enable row level security;

create policy "Users can read own histories"
  on public.histories for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own histories"
  on public.histories for insert
  to authenticated
  with check (auth.uid() = user_id);
