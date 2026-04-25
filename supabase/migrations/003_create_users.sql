create table if not exists public.users (
  user_id text primary key,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_contact_check check (email is not null or phone is not null),
  constraint users_email_password_check check (email is null or password_hash is not null)
);

create unique index if not exists idx_users_email_unique on public.users ((lower(email))) where email is not null;
create unique index if not exists idx_users_phone_unique on public.users (phone) where phone is not null;

drop trigger if exists users_set_updated_at on public.users;

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

alter table if exists public.users disable row level security;
