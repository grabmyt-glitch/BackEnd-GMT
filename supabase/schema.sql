create table if not exists public.tickets (
  ticket_id text primary key,
  from_location text not null,
  to_location text not null,
  travel_date date not null,
  personal_email text not null,
  personal_phone text not null,
  place text not null,
  price numeric(10, 2) not null check (price >= 0),
  ticket_type text not null check (ticket_type in ('bus', 'train', 'flight', 'event', 'concert', 'movie')),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tickets_time_check check (end_time > start_time)
);

create index if not exists idx_tickets_travel_date on public.tickets (travel_date);
create index if not exists idx_tickets_ticket_type on public.tickets (ticket_type);
create index if not exists idx_tickets_from_location on public.tickets (from_location);
create index if not exists idx_tickets_to_location on public.tickets (to_location);
create index if not exists idx_tickets_place on public.tickets (place);
create index if not exists idx_tickets_personal_email on public.tickets (personal_email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tickets_set_updated_at on public.tickets;

create trigger tickets_set_updated_at
before update on public.tickets
for each row
execute function public.set_updated_at();

alter table if exists public.tickets disable row level security;

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
