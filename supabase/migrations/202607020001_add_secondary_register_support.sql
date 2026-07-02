-- Adds secondary-level metadata while reusing the primary register tables.
-- The migration is idempotent and keeps existing primary records untouched.

alter table public.secciones
  add column if not exists nivel text not null default 'Primario',
  add column if not exists modalidad text,
  add column if not exists salida_optativa text;

alter table public.estudiantes
  add column if not exists rne text,
  add column if not exists cedula_pasaporte text,
  add column if not exists correo_electronico text,
  add column if not exists resultado_final text,
  add column if not exists observaciones_academicas text;

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
