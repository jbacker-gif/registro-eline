# Fase 2 Secundaria - Supabase

## Proyecto inspeccionado

- Proyecto Supabase usado por el repo: `RegistroEscolarApp`
- Project ref: `gaitpdremkesyvsyddhn`
- Fuente: `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`

## Tablas existentes encontradas

- `colegios`
- `perfiles`
- `estudiantes`
- `secciones`
- `asignaturas`
- `calificaciones`
- `asistencia`
- `asistencias`
- `dias_bloqueados`
- `responsables_estudiante`

## Tablas reutilizadas

- `secciones`: grado, seccion, tanda, ano escolar, usuario propietario.
- `estudiantes`: ficha general del estudiante.
- `calificaciones`: notas por periodo y competencia.
- `asignaturas`: catalogo base de asignaturas.
- `asistencia`: asistencia operativa actual.
- `colegios` y `perfiles`: datos institucionales.
- `responsables_estudiante`: responsable principal.

## Columnas agregadas

En `secciones`:

- `modalidad`
- `salida_optativa`
- Se ajusto el default de `nivel` a `Primaria`.
- Se agrego una regla defensiva para que 1ro-3ro de Secundaria no usen modalidad y 4to-6to solo acepten `Academica`, `Tecnico-Profesional` o `Artes`.

En `estudiantes`:

- `rne`
- `cedula_pasaporte`
- `correo_electronico`
- `resultado_final`
- `observaciones_academicas`

## Tablas nuevas creadas

### `secundaria_competencias_catalogo`

Catalogo oficial operativo para secundaria:

- Grado
- Ciclo
- Modalidad
- Asignatura
- Codigo de competencia `C1` a `C7`
- Competencia fundamental
- Descripcion
- Estado activo

Se insertaron 378 filas: 6 grados x 9 asignaturas x 7 competencias.

### `secundaria_informes_preliminares`

Soporte para persistir informes preliminares:

- `estudiante_id`
- `seccion_id`
- `user_id`
- `promedio_final`
- `condicion_final`
- `observaciones`
- `datos` JSONB

## Relaciones implementadas

- `secundaria_informes_preliminares.estudiante_id` -> `estudiantes.id`
- `secundaria_informes_preliminares.seccion_id` -> `secciones.id`
- `secundaria_informes_preliminares.user_id` -> `auth.users.id`

## RLS

Se reviso que RLS esta activo en las tablas principales existentes.

Se agrego RLS en:

- `secundaria_competencias_catalogo`
- `secundaria_informes_preliminares`

Politicas nuevas:

- Catalogo de competencias: lectura para usuarios autenticados.
- Informes preliminares: select/insert/update solo sobre filas del usuario autenticado.

## Migraciones

Migracion local creada:

- `supabase/migrations/202607020002_fix_secondary_register_support.sql`
- `supabase/migrations/202607020003_fix_section_unique_level_scope.sql`
- `supabase/migrations/202607020004_align_secondary_cycles_modalities.sql`

Migracion aplicada en Supabase:

- `20260702211810_fix_secondary_register_support`
- `20260702215040_fix_section_unique_level_scope`
- `20260702220115_align_secondary_cycles_modalities`

## No modificado por seguridad

- No se borraron tablas.
- No se borraron columnas.
- No se uso `TRUNCATE`.
- No se ejecutaron cambios sobre datos personales reales.
- No se cambiaron politicas existentes de Primaria.
- No se altero produccion; el trabajo fue sobre el proyecto staging conectado al repo.

## Pendiente en Supabase

- Crear semillas ficticias opcionales por usuario si se confirma que deben persistirse.
- Persistir automaticamente `secundaria_informes_preliminares` desde la UI.
- Validar historicos de `secciones.modalidad` cuando se decida normalizar datos antiguos de primer ciclo.
- Revisar si se debe retirar o migrar la tabla antigua `asistencias`, que existe pero no se usa en el modulo principal.
