-- El cierre sigue el calendario de Resumen anual (30 de junio).
create or replace function public.eline_ano_escolar_cerrado(ano text, fecha date)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with limpio as (
    select regexp_replace(coalesce(ano, ''), '[[:space:]/_.-]', '', 'g') as valor
  ), normalizado as (
    select case
      when valor ~ '^20[0-9]{2}20[0-9]{2}$' then valor
      when valor ~ '^[0-9]{4}$' then '20' || left(valor, 2) || '20' || right(valor, 2)
    end as valor from limpio
  )
  select coalesce(
    right(valor, 4)::integer = left(valor, 4)::integer + 1
    and fecha > make_date(right(valor, 4)::integer, 6, 30), false
  ) from normalizado;
$$;

create or replace function public.eline_proteger_seccion_cerrada()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.eline_ano_escolar_cerrado(old.ano_escolar, (now() at time zone 'America/Santo_Domingo')::date) then
    raise exception 'El año escolar está inactivo.' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.eline_proteger_registro_cerrado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  anterior public.secciones.id%type;
  siguiente public.secciones.id%type;
  seccion record;
begin
  if tg_op <> 'INSERT' then anterior := old.seccion_id; end if;
  if tg_op <> 'DELETE' then siguiente := new.seccion_id; end if;

  for seccion in
    select ano_escolar from public.secciones
    where id in (anterior, siguiente)
    order by id
    for share
  loop
    if public.eline_ano_escolar_cerrado(seccion.ano_escolar, (now() at time zone 'America/Santo_Domingo')::date) then
      raise exception 'El año escolar está inactivo. Las notas y la asistencia son de solo lectura.'
        using errcode = '55000';
    end if;
  end loop;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke execute on function public.eline_proteger_registro_cerrado() from public;

create trigger eline_seccion_cerrada
before update of ano_escolar or delete on public.secciones
for each row execute function public.eline_proteger_seccion_cerrada();

create trigger eline_calificaciones_cerradas
before insert or update or delete on public.calificaciones
for each row execute function public.eline_proteger_registro_cerrado();

create trigger eline_asistencia_cerrada
before insert or update or delete on public.asistencia
for each row execute function public.eline_proteger_registro_cerrado();

create trigger eline_dias_bloqueados_cerrados
before insert or update or delete on public.dias_bloqueados
for each row execute function public.eline_proteger_registro_cerrado();
