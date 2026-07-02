-- Alinea Secundaria con la estructura dominicana:
-- 1ro a 3ro pertenecen al primer ciclo general y no usan modalidad.
-- 4to a 6to pertenecen al segundo ciclo y usan una de tres modalidades.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'secciones_secundaria_modalidad_por_ciclo_chk'
  ) then
    alter table public.secciones
      add constraint secciones_secundaria_modalidad_por_ciclo_chk
      check (
        nivel <> 'Secundario'
        or grado not in ('1ro', '2do', '3ro', '4to', '5to', '6to')
        or (grado in ('1ro', '2do', '3ro') and modalidad is null)
        or (grado in ('4to', '5to', '6to') and modalidad in ('Academica', 'Tecnico-Profesional', 'Artes'))
      ) not valid;
  end if;
end $$;

update public.secundaria_competencias_catalogo
set modalidad = null
where grado in ('1ro', '2do', '3ro')
  and modalidad is not null;
