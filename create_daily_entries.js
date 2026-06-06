const https = require('https');

const sql = [
  "create table if not exists public.daily_entries (",
  "  id bigserial primary key,",
  "  created_at timestamptz default now(),",
  "  user_id uuid references auth.users(id) on delete cascade,",
  "  entry_date date not null default current_date,",
  "  mood_text text not null,",
  "  emotion_tags text[] default '{}',",
  "  lang text default 'ja'",
  ");",
  "alter table public.daily_entries enable row level security;",
  "do $$ begin",
  "  if not exists (select 1 from pg_policies where tablename='daily_entries' and policyname='read_all') then",
  "    create policy read_all on public.daily_entries for select using (true);",
  "  end if;",
  "  if not exists (select 1 from pg_policies where tablename='daily_entries' and policyname='insert_all') then",
  "    create policy insert_all on public.daily_entries for insert with check (true);",
  "  end if;",
  "end $$;"
].join('\n');

const data = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/jikwmahbbwcctjupjwb/database/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppa3dtd2FoYmJ3Y2N0anVwandiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYxODQ0OCwiZXhwIjoyMDk2MTk0NDQ4fQ.-02Z4gmLRx0HI8Zp-dbwe4QABfi97qu2QNRKMUrYmAU'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
