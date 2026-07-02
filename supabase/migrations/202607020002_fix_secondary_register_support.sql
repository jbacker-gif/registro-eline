-- Patch seguro para soporte real de Registro Escolar - Nivel Secundario.
-- No borra tablas, columnas ni datos. Todo es aditivo e idempotente.

alter table public.secciones
  alter column nivel set default 'Primaria',
  add column if not exists modalidad text,
  add column if not exists salida_optativa text;

alter table public.estudiantes
  add column if not exists rne text,
  add column if not exists cedula_pasaporte text,
  add column if not exists correo_electronico text,
  add column if not exists resultado_final text,
  add column if not exists observaciones_academicas text;

create table if not exists public.secundaria_competencias_catalogo (
  id uuid primary key default gen_random_uuid(),
  grado text not null,
  ciclo text not null,
  modalidad text,
  asignatura_nombre text not null,
  competencia_codigo text not null,
  competencia_fundamental text not null,
  descripcion text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  unique (grado, asignatura_nombre, competencia_codigo)
);

alter table public.secundaria_competencias_catalogo enable row level security;
grant select on public.secundaria_competencias_catalogo to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'secundaria_competencias_catalogo'
      and policyname = 'secundaria_competencias_catalogo_select_authenticated'
  ) then
    create policy "secundaria_competencias_catalogo_select_authenticated"
      on public.secundaria_competencias_catalogo
      for select
      to authenticated
      using (true);
  end if;
end $$;

create table if not exists public.secundaria_informes_preliminares (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  seccion_id uuid not null references public.secciones(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  promedio_final numeric,
  condicion_final text,
  observaciones text,
  datos jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.secundaria_informes_preliminares enable row level security;
grant select, insert, update on public.secundaria_informes_preliminares to authenticated;

create index if not exists secundaria_informes_estudiante_idx
  on public.secundaria_informes_preliminares (estudiante_id);

create index if not exists secundaria_informes_seccion_user_idx
  on public.secundaria_informes_preliminares (seccion_id, user_id);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'secundaria_informes_preliminares'
      and policyname = 'secundaria_informes_select_own'
  ) then
    create policy "secundaria_informes_select_own"
      on public.secundaria_informes_preliminares
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'secundaria_informes_preliminares'
      and policyname = 'secundaria_informes_insert_own'
  ) then
    create policy "secundaria_informes_insert_own"
      on public.secundaria_informes_preliminares
      for insert
      to authenticated
      with check (
        (select auth.uid()) = user_id
        and exists (
          select 1
          from public.estudiantes e
          where e.id = estudiante_id
            and e.user_id = (select auth.uid())
            and e.seccion_id = seccion_id
        )
        and exists (
          select 1
          from public.secciones s
          where s.id = seccion_id
            and s.user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'secundaria_informes_preliminares'
      and policyname = 'secundaria_informes_update_own'
  ) then
    create policy "secundaria_informes_update_own"
      on public.secundaria_informes_preliminares
      for update
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end $$;

insert into public.asignaturas (nombre)
select nombre
from (
  values
    ('Lengua Espanola'),
    ('Lenguas Extranjeras - Ingles'),
    ('Lenguas Extranjeras - Frances'),
    ('Matematica'),
    ('Ciencias Sociales'),
    ('Ciencias de la Naturaleza'),
    ('Educacion Artistica'),
    ('Educacion Fisica'),
    ('Formacion Integral Humana y Religiosa')
) as nuevas(nombre)
where not exists (
  select 1
  from public.asignaturas existentes
  where lower(existentes.nombre) = lower(nuevas.nombre)
);

insert into public.secundaria_competencias_catalogo (
  grado,
  ciclo,
  modalidad,
  asignatura_nombre,
  competencia_codigo,
  competencia_fundamental,
  descripcion
)
select grado, ciclo, modalidad, asignatura_nombre, competencia_codigo, competencia_fundamental, descripcion
from (
  select
    grado,
    case when grado in ('1ro', '2do', '3ro') then 'Primer ciclo' else 'Segundo ciclo' end as ciclo,
    case when grado in ('4to', '5to', '6to') then 'Academica' else 'Primer ciclo' end as modalidad,
    asignatura_nombre,
    competencia_codigo,
    competencia_fundamental,
    descripcion
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
  cross join (values
    ('C1', 'Comunicativa', 'Comunica ideas, informaciones, sentimientos y experiencias segun la asignatura.'),
    ('C2', 'Pensamiento logico, creativo y critico', 'Analiza, argumenta y propone soluciones con pensamiento critico y creativo.'),
    ('C3', 'Resolucion de problemas', 'Plantea, desarrolla y evalua soluciones a situaciones del contexto.'),
    ('C4', 'Cientifica y tecnologica', 'Usa procesos cientificos y herramientas tecnologicas pertinentes.'),
    ('C5', 'Etica y ciudadana', 'Actua con respeto, responsabilidad y sentido ciudadano.'),
    ('C6', 'Ambiental y de la salud', 'Relaciona los aprendizajes con bienestar, ambiente y salud.'),
    ('C7', 'Desarrollo personal y espiritual', 'Fortalece autonomia, proyecto de vida y convivencia.')
  ) as comps(competencia_codigo, competencia_fundamental, descripcion)
) as catalogo
where not exists (
  select 1
  from public.secundaria_competencias_catalogo existente
  where existente.grado = catalogo.grado
    and existente.asignatura_nombre = catalogo.asignatura_nombre
    and existente.competencia_codigo = catalogo.competencia_codigo
);

create index if not exists estudiantes_seccion_user_idx
  on public.estudiantes (seccion_id, user_id);

create index if not exists calificaciones_secundaria_lookup_idx
  on public.calificaciones (seccion_id, estudiante_id, asignatura_id, periodo, competencia);

create index if not exists secciones_nivel_user_idx
  on public.secciones (nivel, user_id);
