// 一時セットアップルート - daily_entriesテーブル作成用
export async function GET() {
  const { Client } = await import('pg');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    await client.query(`
      create table if not exists public.daily_entries (
        id           bigserial primary key,
        created_at   timestamptz default now(),
        user_id      uuid references auth.users(id) on delete cascade,
        entry_date   date not null default current_date,
        mood_text    text not null,
        emotion_tags text[] default '{}',
        lang         text default 'ja'
      )
    `);

    await client.query(`alter table public.daily_entries enable row level security`);

    await client.query(`
      do $do$ begin
        if not exists (
          select 1 from pg_policies
          where tablename='daily_entries' and policyname='read_all'
        ) then
          create policy read_all on public.daily_entries for select using (true);
        end if;
        if not exists (
          select 1 from pg_policies
          where tablename='daily_entries' and policyname='insert_all'
        ) then
          create policy insert_all on public.daily_entries for insert with check (true);
        end if;
      end $do$
    `);

    await client.end();
    return Response.json({ success: true, message: 'daily_entries table created' });

  } catch (err) {
    await client.end().catch(() => {});
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
