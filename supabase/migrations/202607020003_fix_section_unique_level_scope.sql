-- Permite que Primaria y Secundaria tengan la misma seccion visible
-- cuando pertenecen a niveles distintos, pero evita duplicados reales
-- dentro del mismo usuario, nivel, grado, seccion, tanda y ano escolar.

create unique index if not exists secciones_unique_user_nivel_grado_identificador_tanda_ano_idx
  on public.secciones (
    user_id,
    coalesce(nivel, 'Primaria'),
    grado,
    upper(trim(identificador)),
    coalesce(tanda, 'Matutina'),
    coalesce(ano_escolar, '')
  );
