-- Panel de administracion: control manual de suscripciones.
-- Aditivo e idempotente para no afectar datos existentes.

create table if not exists public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'Gratis'
    check (plan in ('Gratis', 'Mensual', 'Trimestral', 'Anual')),
  activa boolean not null default true,
  fecha_inicio date not null default current_date,
  fecha_fin date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  unique (email),
  unique (user_id)
);

alter table public.suscripciones enable row level security;

grant select, insert, update, delete on public.suscripciones to authenticated;

create index if not exists suscripciones_estado_idx
  on public.suscripciones (activa, plan, fecha_fin);

create index if not exists suscripciones_email_idx
  on public.suscripciones (lower(email));

drop policy if exists "suscripciones_select_own_or_admin" on public.suscripciones;
create policy "suscripciones_select_own_or_admin"
  on public.suscripciones
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'rol'), '') in ('admin', 'super_admin')
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'super_admin')
  );

drop policy if exists "suscripciones_insert_admin" on public.suscripciones;
create policy "suscripciones_insert_admin"
  on public.suscripciones
  for insert
  to authenticated
  with check (
    coalesce((select auth.jwt() -> 'app_metadata' ->> 'rol'), '') in ('admin', 'super_admin')
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'super_admin')
  );

drop policy if exists "suscripciones_update_admin" on public.suscripciones;
create policy "suscripciones_update_admin"
  on public.suscripciones
  for update
  to authenticated
  using (
    coalesce((select auth.jwt() -> 'app_metadata' ->> 'rol'), '') in ('admin', 'super_admin')
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'super_admin')
  )
  with check (
    coalesce((select auth.jwt() -> 'app_metadata' ->> 'rol'), '') in ('admin', 'super_admin')
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'super_admin')
  );

drop policy if exists "suscripciones_delete_admin" on public.suscripciones;
create policy "suscripciones_delete_admin"
  on public.suscripciones
  for delete
  to authenticated
  using (
    coalesce((select auth.jwt() -> 'app_metadata' ->> 'rol'), '') in ('admin', 'super_admin')
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'super_admin')
  );
