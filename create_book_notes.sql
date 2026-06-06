create table if not exists public.book_notes (
  id           bigserial primary key,
  created_at   timestamptz default now(),
  user_id      uuid references auth.users(id) on delete set null,
  book_title   text not null,
  phrase       text,
  note         text,
  emotions     text[] default '{}',
  lang         text not null default 'ja',
  likes        integer not null default 0
);
alter table public.book_notes enable row level security;
