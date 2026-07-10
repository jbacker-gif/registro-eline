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
- Backfill opcional de `calificaciones.nivel` y `calificaciones.ano_escolar` para registros antiguos, sin hacerlo automaticamente para evitar modificar historicos sin revision.

## Actualizacion de redisenio

- Se agregaron columnas aditivas a `calificaciones`: `nivel`, `ano_escolar`, `tipo_registro`, `es_recuperacion_pedagogica`, `grupo_recuperacion` y `metadata`.
- Se creo `asignaturas_nivel_config` con 8 materias de Primaria y 9 de Secundaria.
- Se creo `secundaria_registro_formatos` con 54 formatos: 6 grados x 9 asignaturas.
- La migracion aplicada fue `20260703141547 redesign_dashboard_school_context`.

## Actualizacion de boletines de Secundaria

- No se creo migracion nueva para esta intervencion.
- No se realizaron acciones destructivas.
- El flujo visible de boletines reutiliza `calificaciones`.
- Las filas del boletin se guardan con:
  - `nivel = Secundario`
  - `tipo_registro = secundaria_boletin_calificaciones`
  - `competencia = C1 | C2 | C3 | C4 | C5 | C6 | C7`
  - `periodo = P1 | P2 | RP1 | P3 | P4 | RP2`
  - `es_recuperacion_pedagogica = true` en RP1 y RP2
  - `grupo_recuperacion = RP1 | RP2` cuando aplica
  - `metadata` para resultado 70%, resultado 30%, suma 70%, suma 30%, C.F., completiva, extraordinaria, evaluacion especial, situacion final, situacion del estudiante, condicion final y observaciones.
- La tabla `secundaria_informes_preliminares` queda documentada como soporte anterior no activo en la UI.

## Correccion de calculo de calificaciones

- Se reviso localmente el respaldo de esquema y `calificaciones.periodo` es `text`, por lo que no hizo falta una migracion para guardar `RP1` y `RP2`.
- La restriccion unica existente `estudiante_id,seccion_id,asignatura_id,periodo,competencia` permite guardar cada competencia y periodo como una fila independiente.
- No se agregaron columnas porque `metadata` ya cubre los resultados calculados de la matriz oficial.

## Correccion de salida optativa

- Se creo la migracion local `supabase/migrations/202607060001_ensure_secondary_optional_subject.sql`.
- La migracion asegura de forma idempotente la asignatura generica `Salida Optativa`.
- Tambien agrega su configuracion en `asignaturas_nivel_config` para 4to a 6to de Secundaria.
- Se agregan formatos base en `secundaria_registro_formatos` para las modalidades `Academica`, `Tecnico-Profesional` y `Artes`.
- No se borraron datos ni se modificaron registros existentes.

## Carga masiva de estudiantes de Secundaria

- No se agregaron tablas ni columnas nuevas.
- El importador reutiliza `estudiantes` y `responsables_estudiante`.
- La actualizacion se resuelve por `sigerd_id`, `rne` o `numero_orden` dentro de la seccion activa.
- La plantilla agregada es `public/plantillas/plantilla_estudiantes_secundaria.csv`.
