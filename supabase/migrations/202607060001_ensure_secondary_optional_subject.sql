insert into public.asignaturas (nombre)
select 'Salida Optativa'
where not exists (
  select 1
  from public.asignaturas
  where lower(nombre) = lower('Salida Optativa')
);

insert into public.asignaturas_nivel_config (asignatura_id, nombre, nivel, grado_inicio, grado_fin, ciclo, modalidad, orden)
select a.id, 'Salida Optativa', 'Secundario', '4to', '6to', 'Segundo ciclo', null, 10
from public.asignaturas a
where lower(a.nombre) = lower('Salida Optativa')
  and not exists (
    select 1
    from public.asignaturas_nivel_config existente
    where lower(existente.nombre) = lower('Salida Optativa')
      and existente.nivel = 'Secundario'
  );

insert into public.secundaria_registro_formatos (grado, ciclo, modalidad, asignatura_nombre, estructura)
select
  grado,
  'Segundo ciclo',
  modalidad,
  'Salida Optativa',
  jsonb_build_object(
    'nivel', 'Secundario',
    'periodos', jsonb_build_array('P1', 'P2', 'RP', 'P3', 'P4', 'RP'),
    'competencias', 7,
    'rp', jsonb_build_object('aplica', true, 'grupos', jsonb_build_array('P1-P2', 'P3-P4')),
    'ponderacion', jsonb_build_object('primeras_competencias', '70%', 'ultimas_competencias', '30%'),
    'campos', jsonb_build_array('resultado_70', 'resultado_30', 'calificacion_final', 'completiva', 'extraordinaria', 'especial', 'situacion')
  )
from (values ('4to'), ('5to'), ('6to')) grados(grado)
cross join (values ('Academica'), ('Tecnico-Profesional'), ('Artes')) modalidades(modalidad)
where not exists (
  select 1
  from public.secundaria_registro_formatos formato
  where formato.grado = grados.grado
    and formato.modalidad = modalidades.modalidad
    and lower(formato.asignatura_nombre) = lower('Salida Optativa')
);
