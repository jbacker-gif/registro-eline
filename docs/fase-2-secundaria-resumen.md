# Fase 2 Secundaria - Resumen

## Implementado

- Nuevo modulo visible en `/dashboard/registro-secundaria`.
- Acceso en la navegacion lateral como `Nivel Secundario`, separado dentro de `Registro Escolar`.
- Acceso rapido en el dashboard principal sin exigir una seccion primaria activa.
- Listado de registros secundarios por seccion.
- Filtros por ano escolar, grado, ciclo/modalidad, resultado y busqueda.
- Formulario de creacion y edicion con datos generales, academicos, familiares, salud y observaciones.
- Evaluacion por cuatro periodos (`P1` a `P4`) y siete competencias especificas por asignatura.
- Evaluacion conectada al catalogo real `secundaria_competencias_catalogo` en Supabase.
- Vista preliminar imprimible del informe de evaluacion.
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

Tablas nuevas:

- `secundaria_competencias_catalogo`
- `secundaria_informes_preliminares`

## Documentos revisados

Se extrajo texto de los 12 PDF suministrados:

- `1er-informe de evaluacion.pdf` a `6to-informe de evaluacion.pdf`
- `Registro 1er-grado.pdf` a `Registro 6to-grado.pdf`

## Decisiones funcionales

- Secundaria se construyo como continuidad del modulo de primaria.
- Las calificaciones secundarias reutilizan `calificaciones`, usando competencias `C1` a `C7`.
- El primer ciclo secundario no se guarda como modalidad; se muestra como ciclo general.
- Las modalidades se reservan para segundo ciclo: `Academica`, `Tecnico-Profesional` y `Artes`.
- El informe preliminar prioriza datos, tabla de asignaturas, calificacion final y firmas; queda pendiente superponer datos sobre plantillas oficiales.

## Falta para completar

- Persistir desde UI los informes preliminares en `secundaria_informes_preliminares`.
- Ajustar reportes sobre imagen/PDF oficial por grado.
- Completar recuperacion pedagogica `RP` por pares de periodos.
- Agregar carga masiva secundaria.
- Validar con usuarios docentes y administrativos.
