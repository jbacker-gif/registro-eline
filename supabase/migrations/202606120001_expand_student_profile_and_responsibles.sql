-- Expands the student profile to cover official primary register fields.
-- Nullable by design so existing student records keep working.

alter table public.estudiantes
  add column if not exists libro text,
  add column if not exists folio text,
  add column if not exists parentesco_con_quien_vive text,
  add column if not exists direccion_residencia text,
  add column if not exists fecha_nuevo_inscrito date,
  add column if not exists fecha_retiro date,
  add column if not exists condicion_inicial text,
  add column if not exists neae text,
  add column if not exists enfermedades_alergias text,
  add column if not exists medicamentos_usa text,
  add column if not exists emergencia_nombre text,
  add column if not exists emergencia_telefono text;

create table if not exists public.responsables_estudiante (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre_completo text not null,
  parentesco text,
  cedula text,
  telefono text,
  profesion_oficio text,
  nivel_educativo text,
  es_principal boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists responsables_estudiante_principal_unique
  on public.responsables_estudiante (estudiante_id)
  where es_principal = true;

alter table public.responsables_estudiante enable row level security;

grant select, insert, update, delete on public.responsables_estudiante to authenticated;

drop policy if exists "responsables_select_own" on public.responsables_estudiante;
create policy "responsables_select_own"
  on public.responsables_estudiante
  for select
  using (auth.uid() = user_id);

drop policy if exists "responsables_insert_own" on public.responsables_estudiante;
create policy "responsables_insert_own"
  on public.responsables_estudiante
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "responsables_update_own" on public.responsables_estudiante;
create policy "responsables_update_own"
  on public.responsables_estudiante
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "responsables_delete_own" on public.responsables_estudiante;
create policy "responsables_delete_own"
  on public.responsables_estudiante
  for delete
  using (auth.uid() = user_id);
