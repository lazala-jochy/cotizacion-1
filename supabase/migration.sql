-- Cotizador — migración inicial a Supabase (multi-tenant)
-- Correr completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query).
-- Seguro de re-correr parcialmente gracias a "if not exists" / "create or replace"
-- en la mayoría de los objetos (las políticas usan drop/create para poder editarse).

-- =========================================================
-- 1. TABLAS
-- =========================================================

create table if not exists public.organizations (
  id                uuid primary key default gen_random_uuid(),
  company_name      text not null,
  company_tax_id    text,
  company_address   text,
  company_phone     text,
  company_email     text,
  company_logo_path text,
  currency          text not null default 'DOP',
  tax_rate          numeric(5,2) not null default 18,
  folio_prefix      text not null default 'COT',
  folio_counter     integer not null default 0,
  created_at        timestamptz not null default now()
);

-- Cada empresa debe ser única en todo el sistema: nombre, RNC y correo de empresa
-- no se pueden repetir entre organizaciones distintas (comparación insensible a
-- mayúsculas/espacios). RNC y email son parciales (WHERE) porque pueden quedar vacíos.
create unique index if not exists organizations_company_name_unique_idx
  on public.organizations (lower(trim(company_name)));

create unique index if not exists organizations_company_tax_id_unique_idx
  on public.organizations (lower(trim(company_tax_id)))
  where company_tax_id is not null and trim(company_tax_id) <> '';

create unique index if not exists organizations_company_email_unique_idx
  on public.organizations (lower(trim(company_email)))
  where company_email is not null and trim(company_email) <> '';

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner','admin','member')),
  full_name  text,
  created_at timestamptz not null default now()
);
create index if not exists profiles_org_id_idx on public.profiles(org_id);

create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  name       text not null,
  tax_id     text,
  email      text,
  phone      text,
  address    text,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists clients_org_id_idx on public.clients(org_id);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  description text,
  unit        text,
  unit_price  numeric(12,2) not null default 0,
  sku         text,
  created_at  timestamptz not null default now()
);
create index if not exists products_org_id_idx on public.products(org_id);

create table if not exists public.quotes (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  folio       text not null,
  client_id   uuid references public.clients(id) on delete set null,
  issue_date  date not null,
  valid_until date,
  status      text not null default 'borrador'
              check (status in ('borrador','enviada','aprobada','rechazada')),
  subtotal    numeric(12,2) not null default 0,
  tax_rate    numeric(5,2) not null default 0,
  tax_amount  numeric(12,2) not null default 0,
  total       numeric(12,2) not null default 0,
  currency    text not null default 'DOP',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, folio)
);
create index if not exists quotes_org_id_idx on public.quotes(org_id);

create table if not exists public.quote_items (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references public.quotes(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  description text not null,
  quantity    numeric(12,3) not null default 1,
  unit_price  numeric(12,2) not null default 0,
  subtotal    numeric(12,2) not null default 0
);
create index if not exists quote_items_quote_id_idx on public.quote_items(quote_id);
create index if not exists quote_items_org_id_idx on public.quote_items(org_id);

-- org_id de clients/products/quotes se completa solo si el cliente no lo manda
alter table public.clients  alter column org_id set default null;
alter table public.products alter column org_id set default null;
alter table public.quotes   alter column org_id set default null;

-- =========================================================
-- 2. FUNCIÓN HELPER (evita la recursión clásica de RLS sobre profiles)
-- =========================================================

create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_org_id() from public;
grant execute on function public.current_org_id() to authenticated;

-- Ahora que la función existe, sí podemos usarla como default de org_id
alter table public.clients  alter column org_id set default public.current_org_id();
alter table public.products alter column org_id set default public.current_org_id();
alter table public.quotes   alter column org_id set default public.current_org_id();

-- =========================================================
-- 3. TRIGGER: quote_items.org_id siempre heredado de la cotización
-- =========================================================

create or replace function public.sync_quote_item_org_id()
returns trigger
language plpgsql
as $$
begin
  select org_id into new.org_id from public.quotes where id = new.quote_id;
  return new;
end;
$$;

drop trigger if exists quote_items_org_sync on public.quote_items;
create trigger quote_items_org_sync
before insert or update on public.quote_items
for each row execute function public.sync_quote_item_org_id();

-- =========================================================
-- 4. RLS
-- =========================================================

alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.clients       enable row level security;
alter table public.products      enable row level security;
alter table public.quotes        enable row level security;
alter table public.quote_items   enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid());

drop policy if exists org_select_own on public.organizations;
create policy org_select_own on public.organizations
  for select using (id = public.current_org_id());

drop policy if exists org_update_own on public.organizations;
create policy org_update_own on public.organizations
  for update using (id = public.current_org_id())
  with check (id = public.current_org_id());

do $$
declare
  t text;
begin
  foreach t in array array['clients','products','quotes']
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select using (org_id = public.current_org_id())', t, t);

    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (org_id = public.current_org_id())', t, t);

    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('create policy %I_update on public.%I for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id())', t, t);

    execute format('drop policy if exists %I_delete on public.%I', t, t);
    execute format('create policy %I_delete on public.%I for delete using (org_id = public.current_org_id())', t, t);
  end loop;
end $$;

drop policy if exists quote_items_select on public.quote_items;
create policy quote_items_select on public.quote_items
  for select using (org_id = public.current_org_id());

drop policy if exists quote_items_insert on public.quote_items;
create policy quote_items_insert on public.quote_items
  for insert with check (org_id = public.current_org_id());

drop policy if exists quote_items_update on public.quote_items;
create policy quote_items_update on public.quote_items
  for update using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

drop policy if exists quote_items_delete on public.quote_items;
create policy quote_items_delete on public.quote_items
  for delete using (org_id = public.current_org_id());

-- =========================================================
-- 5. RPCs
-- =========================================================

-- 5.0 Chequeos de disponibilidad para el formulario de signup (paso 1, antes de crear
-- la cuenta). Se exponen a "anon" porque en ese punto todavía no hay usuario autenticado.
create or replace function public.company_name_available(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.organizations where lower(trim(company_name)) = lower(trim(p_name))
  )
$$;
revoke all on function public.company_name_available(text) from public;
grant execute on function public.company_name_available(text) to anon, authenticated;

create or replace function public.company_tax_id_available(p_tax_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_tax_id is null or trim(p_tax_id) = '' then true
    else not exists (
      select 1 from public.organizations where lower(trim(company_tax_id)) = lower(trim(p_tax_id))
    )
  end
$$;
revoke all on function public.company_tax_id_available(text) from public;
grant execute on function public.company_tax_id_available(text) to anon, authenticated;

create or replace function public.company_email_available(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_email is null or trim(p_email) = '' then true
    else not exists (
      select 1 from public.organizations where lower(trim(company_email)) = lower(trim(p_email))
    )
  end
$$;
revoke all on function public.company_email_available(text) from public;
grant execute on function public.company_email_available(text) to anon, authenticated;

-- 5.1 Signup: crea la organización + el profile del usuario que se acaba de registrar.
-- Si esta función ya existía con la firma anterior (5 argumentos, sin logo), hay que
-- eliminarla primero: CREATE OR REPLACE no cambia la lista de parámetros de una función,
-- solo reemplazaría/agregaría una sobrecarga nueva y dejaría la vieja huérfana.
drop function if exists public.complete_signup(text, text, text, text, text);

create or replace function public.complete_signup(
  p_company_name      text,
  p_company_tax_id    text,
  p_company_address   text,
  p_company_phone     text,
  p_company_email     text,
  p_company_logo_path text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select o.* into v_org
  from public.organizations o
  join public.profiles p on p.org_id = o.id
  where p.id = auth.uid();

  if found then
    return v_org;
  end if;

  if exists (
    select 1 from public.organizations
    where lower(trim(company_name)) = lower(trim(p_company_name))
  ) then
    raise exception 'DUPLICATE_COMPANY_NAME';
  end if;

  if p_company_tax_id is not null and trim(p_company_tax_id) <> '' and exists (
    select 1 from public.organizations
    where lower(trim(company_tax_id)) = lower(trim(p_company_tax_id))
  ) then
    raise exception 'DUPLICATE_COMPANY_TAX_ID';
  end if;

  if p_company_email is not null and trim(p_company_email) <> '' and exists (
    select 1 from public.organizations
    where lower(trim(company_email)) = lower(trim(p_company_email))
  ) then
    raise exception 'DUPLICATE_COMPANY_EMAIL';
  end if;

  insert into public.organizations
    (company_name, company_tax_id, company_address, company_phone, company_email, company_logo_path)
  values
    (p_company_name, p_company_tax_id, p_company_address, p_company_phone, p_company_email, p_company_logo_path)
  returning * into v_org;

  insert into public.profiles (id, org_id, role)
  values (auth.uid(), v_org.id, 'owner');

  return v_org;
end;
$$;

revoke all on function public.complete_signup(text, text, text, text, text, text) from public;
grant execute on function public.complete_signup(text, text, text, text, text, text) to authenticated;

-- 5.2 Crear cotización: incrementa el folio (con lock de fila) y crea items, todo atómico.
create or replace function public.create_quote(
  p_client_id   uuid,
  p_issue_date  date,
  p_valid_until date,
  p_status      text,
  p_tax_rate    numeric,
  p_currency    text,
  p_notes       text,
  p_items       jsonb
)
returns public.quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id     uuid := public.current_org_id();
  v_folio      text;
  v_subtotal   numeric := 0;
  v_tax_amount numeric;
  v_total      numeric;
  v_quote      public.quotes;
begin
  if v_org_id is null then
    raise exception 'no organization for current user';
  end if;

  update public.organizations
     set folio_counter = folio_counter + 1
   where id = v_org_id
   returning folio_prefix || '-' || lpad(folio_counter::text, 4, '0') into v_folio;

  select coalesce(sum((i->>'quantity')::numeric * (i->>'unit_price')::numeric), 0)
    into v_subtotal
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) i;

  v_tax_amount := v_subtotal * (coalesce(p_tax_rate, 0) / 100);
  v_total := v_subtotal + v_tax_amount;

  insert into public.quotes
    (org_id, folio, client_id, issue_date, valid_until, status,
     subtotal, tax_rate, tax_amount, total, currency, notes)
  values
    (v_org_id, v_folio, p_client_id, p_issue_date, p_valid_until, coalesce(p_status, 'borrador'),
     v_subtotal, coalesce(p_tax_rate, 0), v_tax_amount, v_total, p_currency, p_notes)
  returning * into v_quote;

  insert into public.quote_items
    (quote_id, org_id, product_id, description, quantity, unit_price, subtotal)
  select
    v_quote.id, v_org_id,
    (i->>'product_id')::uuid,
    i->>'description',
    (i->>'quantity')::numeric,
    (i->>'unit_price')::numeric,
    (i->>'quantity')::numeric * (i->>'unit_price')::numeric
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) i;

  return v_quote;
end;
$$;

revoke all on function public.create_quote(uuid, date, date, text, numeric, text, text, jsonb) from public;
grant execute on function public.create_quote(uuid, date, date, text, numeric, text, text, jsonb) to authenticated;

-- 5.3 Editar cotización: recalcula totales y reemplaza los items.
create or replace function public.update_quote(
  p_quote_id    uuid,
  p_client_id   uuid,
  p_issue_date  date,
  p_valid_until date,
  p_status      text,
  p_tax_rate    numeric,
  p_currency    text,
  p_notes       text,
  p_items       jsonb
)
returns public.quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id     uuid := public.current_org_id();
  v_subtotal   numeric := 0;
  v_tax_amount numeric;
  v_total      numeric;
  v_quote      public.quotes;
begin
  select coalesce(sum((i->>'quantity')::numeric * (i->>'unit_price')::numeric), 0)
    into v_subtotal
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) i;

  v_tax_amount := v_subtotal * (coalesce(p_tax_rate, 0) / 100);
  v_total := v_subtotal + v_tax_amount;

  update public.quotes set
    client_id   = p_client_id,
    issue_date  = p_issue_date,
    valid_until = p_valid_until,
    status      = coalesce(p_status, status),
    subtotal    = v_subtotal,
    tax_rate    = coalesce(p_tax_rate, 0),
    tax_amount  = v_tax_amount,
    total       = v_total,
    currency    = p_currency,
    notes       = p_notes,
    updated_at  = now()
  where id = p_quote_id and org_id = v_org_id
  returning * into v_quote;

  if not found then
    raise exception 'quote not found';
  end if;

  delete from public.quote_items where quote_id = p_quote_id;

  insert into public.quote_items
    (quote_id, org_id, product_id, description, quantity, unit_price, subtotal)
  select
    p_quote_id, v_org_id,
    (i->>'product_id')::uuid,
    i->>'description',
    (i->>'quantity')::numeric,
    (i->>'unit_price')::numeric,
    (i->>'quantity')::numeric * (i->>'unit_price')::numeric
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) i;

  return v_quote;
end;
$$;

revoke all on function public.update_quote(uuid, uuid, date, date, text, numeric, text, text, jsonb) from public;
grant execute on function public.update_quote(uuid, uuid, date, date, text, numeric, text, text, jsonb) to authenticated;

-- 5.4 Duplicar cotización: nuevo folio, copia los items del original.
create or replace function public.duplicate_quote(p_quote_id uuid)
returns public.quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.current_org_id();
  v_source public.quotes;
  v_folio  text;
  v_quote  public.quotes;
begin
  select * into v_source from public.quotes where id = p_quote_id and org_id = v_org_id;
  if not found then
    raise exception 'quote not found';
  end if;

  update public.organizations
     set folio_counter = folio_counter + 1
   where id = v_org_id
   returning folio_prefix || '-' || lpad(folio_counter::text, 4, '0') into v_folio;

  insert into public.quotes
    (org_id, folio, client_id, issue_date, valid_until, status,
     subtotal, tax_rate, tax_amount, total, currency, notes)
  values
    (v_org_id, v_folio, v_source.client_id, current_date, v_source.valid_until, 'borrador',
     v_source.subtotal, v_source.tax_rate, v_source.tax_amount, v_source.total, v_source.currency, v_source.notes)
  returning * into v_quote;

  insert into public.quote_items (quote_id, org_id, product_id, description, quantity, unit_price, subtotal)
  select v_quote.id, v_org_id, product_id, description, quantity, unit_price, subtotal
  from public.quote_items
  where quote_id = p_quote_id;

  return v_quote;
end;
$$;

revoke all on function public.duplicate_quote(uuid) from public;
grant execute on function public.duplicate_quote(uuid) to authenticated;

-- =========================================================
-- 6. Recuperar contraseña SIN correo, dentro de la app.
-- =========================================================
-- Verifica identidad con (email de acceso + RNC de la empresa) en vez de un
-- código por correo, y escribe el hash de la nueva contraseña directamente en
-- auth.users (mismo formato bcrypt que usa GoTrue, vía pgcrypto). Se expone a
-- "anon" porque se llama ANTES de tener sesión — es exactamente el caso de uso
-- de "olvidé mi contraseña".
create extension if not exists pgcrypto schema extensions;

create or replace function public.recover_password(
  p_email           text,
  p_company_tax_id  text,
  p_new_password    text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_org_id  uuid;
begin
  if p_new_password is null or length(p_new_password) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres.';
  end if;

  select id into v_user_id
  from auth.users
  where lower(trim(email)) = lower(trim(p_email));

  if v_user_id is null then
    raise exception 'INVALID_CREDENTIALS';
  end if;

  select org_id into v_org_id from public.profiles where id = v_user_id;
  if v_org_id is null then
    raise exception 'INVALID_CREDENTIALS';
  end if;

  if not exists (
    select 1 from public.organizations
    where id = v_org_id
      and company_tax_id is not null
      and trim(company_tax_id) <> ''
      and lower(trim(company_tax_id)) = lower(trim(p_company_tax_id))
  ) then
    raise exception 'INVALID_CREDENTIALS';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = v_user_id;

  return true;
end;
$$;

revoke all on function public.recover_password(text, text, text) from public;
grant execute on function public.recover_password(text, text, text) to anon, authenticated;
