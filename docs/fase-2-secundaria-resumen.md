# Fase 2 Secundaria - Resumen

## Implementado

- Nuevo modulo visible en `/dashboard/registro-secundaria`.
- Acceso en la navegacion lateral como `Nivel Secundario`, separado dentro de `Registro Escolar`.
- Acceso rapido en el dashboard principal sin exigir una seccion primaria activa.
- Listado de registros secundarios por seccion.
- Busqueda de estudiantes por nombre, identificacion o tutor.
- Formulario de creacion y edicion con datos generales, academicos, familiares, salud y observaciones.
- Entrada de calificaciones basada en boletines oficiales: P1, P2, P3, P4, PC, C.F., completiva, extraordinaria, evaluacion especial y situacion final por asignatura.
- Vista imprimible de `Boletin de Calificaciones`.
- Demo visual con estudiantes de 1ro, 3ro y 6to de secundaria.
- Extension de `Secciones` para crear registros de nivel `Primario` o `Secundario`.
- Migraciones para reutilizar tablas existentes, agregar campos secundarios y crear soporte real en Supabase.
- Ajuste de Secundaria dominicana: 1ro-3ro como primer ciclo general, y 4to-6to con modalidades `Academica`, `Tecnico-Profesional` y `Artes`.

## Archivos principales modificados

- `src/app/dashboard/registro-secundaria/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/secciones/page.tsx`
- `supabase/migrations/202607020001_add_secondary_register_support.sql`
- `supabase/migrations/202607020002_fix_secondary_register_support.sql`
- `supabase/migrations/202607020003_fix_section_unique_level_scope.sql`
- `supabase/migrations/202607020004_align_secondary_cycles_modalities.sql`

## Tablas y modelo

Se reutilizan:

- `secciones`
- `estudiantes`
- `asignaturas`
- `calificaciones`
- `responsables_estudiante`
- `asistencia`
- `colegios`
- `perfiles`

Campos agregados:

- `secciones.nivel`
- `secciones.modalidad`
- `secciones.salida_optativa`
- `estudiantes.rne`
- `estudiantes.cedula_pasaporte`
- `estudiantes.correo_electronico`
- `estudiantes.resultado_final`
- `estudiantes.observaciones_academicas`

Tablas nuevas existentes de la fase anterior:

- `secundaria_competencias_catalogo`
- `secundaria_informes_preliminares` (queda fuera del flujo visible actual)

## Documentos revisados

Se extrajo texto de los PDF suministrados inicialmente y luego se cambio la referencia activa a boletines:

- `1er-informe de evaluacion.pdf` a `6to-informe de evaluacion.pdf`
- `Registro 1er-grado.pdf` a `Registro 6to-grado.pdf`
- `Boletin 1er.pdf` a `Boletin 6to.pdf`

## Decisiones funcionales

- Secundaria se construyo como continuidad del modulo de primaria.
- Las calificaciones secundarias reutilizan `calificaciones`, usando `competencia = BOLETIN` para el nuevo flujo visible.
- El primer ciclo secundario no se guarda como modalidad; se muestra como ciclo general.
- Las modalidades se reservan para segundo ciclo: `Academica`, `Tecnico-Profesional` y `Artes`.
- El boletin prioriza datos generales, tabla de calificaciones, asistencia, situacion final, condicion, observaciones y firmas.

## Falta para completar

- Convertir los PDF oficiales de boletines secundarios a JPG y superponer datos sobre esas imagenes como en Primaria.
- Persistir observaciones/situacion/condicion aunque no haya notas por asignatura.
- Agregar carga masiva secundaria.
- Validar con usuarios docentes y administrativos.

## Actualizacion de redisenio

- Se agrego `src/lib/registroEscolar.ts` para unificar etiquetas de nivel, grado, seccion, ciclo y modalidad.
- El Dashboard general separa Primaria y Secundaria en resumenes, accesos y materias.
- Secundaria usa su modulo propio para materias y registro; ya no depende de la matriz primaria.
- La vista visible de Secundaria cambia a `Boletin de Calificaciones` con P1-P4.
- Se agrego la migracion `supabase/migrations/202607030001_redesign_dashboard_school_context.sql`.

## Actualizacion de boletines

- El flujo visible de Secundaria ya no usa `Informe de Evaluacion`.
- Las acciones principales son `Calificaciones` y `Boletin`.
- 1ro-3ro se muestran como Primer Ciclo; 4to-6to como Segundo Ciclo.
- La salida optativa solo aparece para 4to, 5to y 6to.
- Detalle completo en `docs/fase-2-secundaria-boletines.md`.
