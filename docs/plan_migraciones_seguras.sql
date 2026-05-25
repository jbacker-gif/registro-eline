-- Plan de migraciones sugeridas (NO ejecutar directo en producción)
-- Fecha: 2026-05-25

-- 0) Verificación: confirmar que el frontend no usa `public.asistencias`
-- (En el repo actual se observan consultas a `asistencia`, no a `asistencias`.)

-- 1) Detectar duplicados antes de constraints (asistencia)
select estudiante_id, seccion_id, fecha, count(*)
from public.asistencia
group by 1,2,3
having count(*) > 1;

-- 2) Detectar duplicados antes de constraints (calificaciones)
select estudiante_id, seccion_id, asignatura_id, periodo, competencia, count(*)
from public.calificaciones
group by 1,2,3,4,5
having count(*) > 1;

-- 3) Renombrado seguro de tabla aparentemente en desuso (NO DROP)
-- Ejecutar solo con confirmación explícita:
-- alter table public.asistencias rename to asistencias_deprecated_backup;

-- 4) Constraints únicos (solo si no hay duplicados)
-- alter table public.asistencia
--   add constraint asistencia_unique_estudiante_seccion_fecha
--   unique (estudiante_id, seccion_id, fecha);

-- alter table public.calificaciones
--   add constraint calificaciones_unique_estudiante_seccion_asignatura_periodo_comp
--   unique (estudiante_id, seccion_id, asignatura_id, periodo, competencia);

-- 5) Endurecimiento de RLS (ejemplo base)
-- Idea: además de auth.uid() = user_id, validar pertenencia cruzada de estudiante_id y seccion_id.
-- Implementar por tabla y ambiente (staging -> producción):
-- create policy ... using (
--   auth.uid() = user_id
--   and exists (
--     select 1 from public.estudiantes e
--     where e.id = estudiante_id
--       and e.user_id = auth.uid()
--       and e.seccion_id = seccion_id
--   )
-- );

-- 6) Permisos anon
-- Revisar grants actuales y revocar los innecesarios para tablas sensibles.
-- Ejemplo a ajustar por entorno:
-- revoke all on table public.calificaciones from anon;
-- revoke all on table public.asistencia from anon;
-- revoke all on table public.dias_bloqueados from anon;
-- revoke all on table public.estudiantes from anon;

-- 7) Flujo recomendado de despliegue
-- a) Probar scripts en entorno de staging/clon.
-- b) Respaldar datos.
-- c) Ejecutar checks de duplicados.
-- d) Aplicar rename y constraints.
-- e) Aplicar políticas RLS reforzadas.
-- f) Smoke tests de frontend (asistencia, calificaciones, boletines).
