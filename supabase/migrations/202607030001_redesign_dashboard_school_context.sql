-- Redisenio funcional: contexto claro por nivel, materias por nivel/grado
-- y soporte explicito para formato de Registro Secundario con RP.
-- Migracion aditiva e idempotente; no elimina tablas, columnas ni datos.

alter table public.calificaciones
  add column if not exists nivel text,
  add column if not exists ano_escolar text,
  add column if not exists tipo_registro text,
  add column if not exists es_recuperacion_pedagogica boolean not null default false,
  add column if not exists grupo_recuperacion text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.asignaturas_nivel_config (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid references public.asignaturas(id),
  nombre text not null,
  nivel text not null check (nivel in ('Primaria', 'Secundario')),
  grado_inicio text,
  grado_fin text,
  ciclo text,
  modalidad text,
  orden integer not null default 0,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.asignaturas_nivel_config enable row level security;
grant select on public.asignaturas_nivel_config to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'asignaturas_nivel_config'
      and policyname = 'asignaturas_nivel_config_select_authenticated'
  ) then
    create policy "asignaturas_nivel_config_select_authenticated"
      on public.asignaturas_nivel_config
      for select
      to authenticated
      using (true);
  end if;
end $$;

create table if not exists public.secundaria_registro_formatos (
  id uuid primary key default gen_random_uuid(),
  grado text not null,
  ciclo text not null,
  modalidad text,
  asignatura_nombre text not null,
  estructura jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.secundaria_registro_formatos enable row level security;
grant select on public.secundaria_registro_formatos to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'secundaria_registro_formatos'
      and policyname = 'secundaria_registro_formatos_select_authenticated'
  ) then
    create policy "secundaria_registro_formatos_select_authenticated"
      on public.secundaria_registro_formatos
      for select
      to authenticated
      using (true);
  end if;
end $$;

insert into public.asignaturas_nivel_config (asignatura_id, nombre, nivel, grado_inicio, grado_fin, ciclo, orden)
select a.id, datos.nombre, 'Primaria', '1ro', '6to', 'Primaria', datos.orden
from (values
  ('Lengua Espanola', 1),
  ('Matematica', 2),
  ('Ciencias Sociales', 3),
  ('Ciencias de la Naturaleza', 4),
  ('Lenguas Extranjeras - Ingles', 5),
  ('Educacion Fisica', 6),
  ('Formacion Integral Humana y Religiosa', 7),
  ('Educacion Artistica', 8)
) as datos(nombre, orden)
left join lateral (
  select id
  from public.asignaturas
  where lower(nombre) in (
    lower(datos.nombre),
    lower(replace(datos.nombre, 'Espanola', 'Española')),
    lower(replace(datos.nombre, 'Matematica', 'Matemática')),
    lower(replace(datos.nombre, 'Educacion', 'Educación')),
    lower(replace(datos.nombre, 'Formacion', 'Formación')),
    lower(replace(datos.nombre, 'Lenguas Extranjeras - Ingles', 'Lenguas Extranjeras (inglés)'))
  )
  order by case when lower(nombre) = lower(datos.nombre) then 0 else 1 end, nombre
  limit 1
) a on true
where not exists (
  select 1 from public.asignaturas_nivel_config existente
  where existente.nombre = datos.nombre
    and existente.nivel = 'Primaria'
);

insert into public.asignaturas_nivel_config (asignatura_id, nombre, nivel, grado_inicio, grado_fin, ciclo, orden)
select a.id, datos.nombre, 'Secundario', '1ro', '6to', 'Secundaria', datos.orden
from (values
  ('Lengua Espanola', 1),
  ('Lenguas Extranjeras - Ingles', 2),
  ('Lenguas Extranjeras - Frances', 3),
  ('Matematica', 4),
  ('Ciencias Sociales', 5),
  ('Ciencias de la Naturaleza', 6),
  ('Educacion Artistica', 7),
  ('Educacion Fisica', 8),
  ('Formacion Integral Humana y Religiosa', 9)
) as datos(nombre, orden)
left join lateral (
  select id
  from public.asignaturas
  where lower(nombre) = lower(datos.nombre)
  order by nombre
  limit 1
) a on true
where not exists (
  select 1 from public.asignaturas_nivel_config existente
  where existente.nombre = datos.nombre
    and existente.nivel = 'Secundario'
);

insert into public.secundaria_registro_formatos (grado, ciclo, modalidad, asignatura_nombre, estructura)
select
  grado,
  case when grado in ('1ro', '2do', '3ro') then 'Primer ciclo general' else 'Segundo ciclo' end,
  case when grado in ('4to', '5to', '6to') then 'Academica' else null end,
  asignatura_nombre,
  jsonb_build_object(
    'nivel', 'Secundario',
    'periodos', jsonb_build_array('P1', 'P2', 'RP', 'P3', 'P4', 'RP'),
    'competencias', 7,
    'rp', jsonb_build_object('aplica', true, 'grupos', jsonb_build_array('P1-P2', 'P3-P4')),
    'ponderacion', jsonb_build_object('primeras_competencias', '70%', 'ultimas_competencias', '30%'),
    'minimo_aprobatorio', 70,
    'incluye', jsonb_build_array('competencias especificas', 'indicadores de logro', 'asistencia', 'conducta', 'promedio', 'condicion final', 'observaciones', 'firmas')
  )
from unnest(array['1ro','2do','3ro','4to','5to','6to']) as grado
cross join (values
  ('Lengua Espanola'),
  ('Lenguas Extranjeras - Ingles'),
  ('Lenguas Extranjeras - Frances'),
  ('Matematica'),
  ('Ciencias Sociales'),
  ('Ciencias de la Naturaleza'),
  ('Educacion Artistica'),
  ('Educacion Fisica'),
  ('Formacion Integral Humana y Religiosa')
) as asignaturas(asignatura_nombre)
where not exists (
  select 1 from public.secundaria_registro_formatos existente
  where existente.grado = grado
    and existente.asignatura_nombre = asignaturas.asignatura_nombre
    and coalesce(existente.modalidad, '') = coalesce(case when grado in ('4to', '5to', '6to') then 'Academica' else null end, '')
);

create index if not exists asignaturas_nivel_config_lookup_idx
  on public.asignaturas_nivel_config (nivel, grado_inicio, grado_fin, activa);

create index if not exists calificaciones_contexto_idx
  on public.calificaciones (nivel, ano_escolar, tipo_registro, seccion_id);

create index if not exists secundaria_registro_formatos_lookup_idx
  on public.secundaria_registro_formatos (grado, asignatura_nombre, activo);

create index if not exists secundaria_registro_formatos_contexto_idx
  on public.secundaria_registro_formatos (
    grado,
    asignatura_nombre,
    coalesce(modalidad, '')
  );
