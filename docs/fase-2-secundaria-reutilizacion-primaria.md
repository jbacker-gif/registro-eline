# Fase 2 Secundaria - Reutilizacion de Primaria

## Tablas reutilizadas

- `estudiantes`: ficha base del estudiante.
- `secciones`: grado, seccion, tanda y ano escolar.
- `asignaturas`: catalogo de areas/asignaturas.
- `calificaciones`: notas por estudiante, seccion, asignatura, periodo y competencia.
- `asistencia`: base para asistencia y puntualidad.
- `colegios` y `perfiles`: datos institucionales y docentes.
- `responsables_estudiante`: responsable principal.

## Tablas extendidas

- `secciones`: se agregan `nivel`, `modalidad` y `salida_optativa`.
- `estudiantes`: se agregan `rne`, `cedula_pasaporte`, `correo_electronico`, `resultado_final` y `observaciones_academicas`.

## Nuevas tablas necesarias

Se agregaron dos tablas especificas porque Secundaria requiere soporte que Primaria no tenia:

- `secundaria_competencias_catalogo`: catalogo de 7 competencias por grado/asignatura.
- `secundaria_informes_preliminares`: persistencia de informes preliminares imprimibles.

## Componentes o pantallas reutilizadas

- Navegacion del dashboard.
- Pantalla de secciones.
- Patrones visuales de listados, formularios y tablas.
- Cliente Supabase existente.
- Flujo de usuario autenticado por `supabase.auth.getSession()`.

## Adaptaciones para secundaria

- Creacion de secciones con nivel secundario.
- Campos de modalidad y salida optativa para el segundo ciclo de Secundaria.
- Formulario secundario con RNE, cedula/pasaporte, condicion inicial, resultado final y observaciones.
- Evaluacion por siete competencias, en lugar del esquema primario de tres competencias.
- Menu lateral agrupado para separar Registro Escolar, Reportes y Configuracion.
- Pantalla de secciones con filtro de nivel educativo.

## Diferencias funcionales

- Secundaria usa minimo aprobatorio de 70.
- Los informes extraidos indican siete competencias especificas por asignatura.
- 1ro a 3ro usan primer ciclo general sin modalidad.
- 4to a 6to usan segundo ciclo con modalidades `Academica`, `Tecnico-Profesional` o `Artes`, y salida optativa cuando aplique.
- El informe secundario tiene mas paginas que el boletin primario y requiere una etapa posterior de maquetacion oficial.

## Riesgos y limitaciones

- Si la tabla `asignaturas` no tiene una restriccion unica, la migracion evita duplicados exactos, pero no normaliza tildes.
- La vista preliminar de informe no esta alineada pixel a pixel con los PDF oficiales.
- Las politicas RLS existentes deben cubrir las columnas nuevas al aplicar la migracion.
- El modulo secundario ya no borra calificaciones para guardar; usa `upsert` sobre la llave unica existente.
