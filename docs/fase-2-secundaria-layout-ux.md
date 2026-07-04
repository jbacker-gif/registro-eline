# Fase 2 Secundaria - Layout y UX

## Problema visual encontrado

El menu lateral original mezclaba rutas de Primaria y Secundaria en una sola lista plana. El usuario podia entrar a estudiantes, asistencia, boletines o secundaria sin una separacion clara de nivel educativo.

Tambien `/dashboard/secciones` mostraba todos los grados juntos y podia hacer pensar que 1ro-6to siempre eran de Primaria.

## Cambios realizados

- El menu lateral ahora esta agrupado por bloques:
  - Inicio
  - Registro Escolar
  - Reportes
  - Configuracion
- Dentro de `Registro Escolar` se separan:
  - `Nivel Primario`
  - `Nivel Secundario`
  - `Asistencia Primaria`
  - `Notas Primaria`
- Los reportes actuales se etiquetan como Primaria para no confundirlos con el informe preliminar de Secundaria.
- `/dashboard/secciones` ahora tiene filtro visual por `Todos`, `Primaria` y `Secundario`.
- El formulario de secciones incluye nivel educativo; para 1ro-3ro muestra `Primer ciclo general` y para 4to-6to habilita modalidades `Academica`, `Tecnico-Profesional` y `Artes`.
- `/dashboard/registro-secundaria` muestra el titulo explicito `Registro Escolar - Nivel Secundario`.
- Se agregaron filtros por ano escolar, grado, ciclo/modalidad, resultado y busqueda.
- Las acciones del listado secundario se separan en `Ver`, `Editar`, `Calificaciones` y `Boletin`.

## Rutas a revisar

- `/dashboard`
- `/dashboard/secciones`
- `/dashboard/registro-secundaria`
- `/dashboard/estudiantes`
- `/dashboard/asistencia`
- `/dashboard/boletines`

## Recomendaciones pendientes

- Crear landing interna o dashboard propio para Secundaria con tarjetas por submodulo.
- Crear reportes secundarios oficiales separados de boletines primarios.
- Agregar breadcrumbs persistentes si se adopta un componente comun de layout.
- Considerar iconos diferenciados para Primaria y Secundaria en el menu.

## Actualizacion de redisenio

- El Dashboard general ahora separa resumen, accesos y materias por nivel educativo.
- La seccion activa del Dashboard se renombro a `Seccion activa para Primaria`.
- Las secciones se muestran con etiqueta completa de nivel, grado, seccion, tanda, ano escolar y modalidad cuando aplica.
- Las materias de Primaria quedan en el Dashboard; las materias de Secundaria se gestionan dentro de `/dashboard/registro-secundaria`.

## Actualizacion de distribucion del Dashboard

- Se eliminaron las tarjetas `Pendientes Primaria` y `Pendientes Secundaria` del resumen superior porque solo contaban estudiantes con resultado `Pendiente` y no abrian una cola de trabajo accionable.
- El resumen superior queda enfocado en volumen real: estudiantes y secciones por nivel.
- El encabezado ahora tiene dos selectores separados: `Seccion activa para Primaria` y `Seccion activa para Secundaria`.
- El modulo secundario replica la estructura de Primaria con cuatro accesos: `Estudiantes`, `Asistencia`, `Notas` y `Reportes`.
- Debajo de la entrada de calificaciones de Primaria se agrego la entrada de calificaciones de Secundaria con materias propias del nivel.

## Actualizacion de modulo de estudiantes

- `/dashboard/estudiantes?seccion_id=...` ahora presenta el listado de Primaria con encabezado institucional, docente titular, cantidad de matriculados, busqueda y tabla academica.
- La pestana `Listado` de `/dashboard/registro-secundaria` replica esa experiencia con identidad visual verde y contexto de ciclo/modalidad.
- En ambos niveles se muestran etiquetas completas de seccion para evitar confundir grados iguales.
- Se documentaron los detalles en `docs/modulo-estudiantes-primaria-secundaria.md`.
- Se ajusto la paleta: Primaria usa blanco con acentos azul/sky y Secundaria usa blanco con acentos teal/slate, reduciendo el tono beige/verde original.
- Se elimino la linea secundaria repetida del encabezado de Primaria.
- Se retiro en Secundaria la franja superior de titulo general, selector, tarjetas resumen, filtros y pestanas, para que el modulo comience directamente con el listado limpio.
- El flujo visible de Secundaria ahora usa `Boletin de Calificaciones` en lugar de `Informe de Evaluacion`.

## Actualizacion del modulo Primario en Dashboard

- El modulo de Nivel Primario ahora queda organizado en cinco accesos principales:
  - `Estudiantes`: ficha y datos academicos de la seccion.
  - `Asistencia`: registro mensual de asistencia, ausencia, excusa y tardanza.
  - `Notas`: carga masiva y matriz de calificaciones de Primaria.
  - `Reporte`: resumen anual de asistencia y sabana de calificaciones.
  - `Boletines`: generacion de boletines finales por estudiante o seccion.
- `Reporte` apunta a `/dashboard/resumen`.
- `Boletines` apunta a `/dashboard/boletines`.

## Actualizacion de paginas del modulo Secundario

- El modulo de Nivel Secundario queda alineado con Primaria en cinco accesos principales: `Estudiantes`, `Asistencia`, `Notas`, `Reporte` y `Boletines`.
- Se crearon rutas propias para Secundaria:
  - `/dashboard/secundaria/estudiantes`
  - `/dashboard/secundaria/asistencia`
  - `/dashboard/secundaria/calificaciones-masivas`
  - `/dashboard/secundaria/resumen`
  - `/dashboard/secundaria/boletines`
- Estas rutas conservan el contexto de `seccion_id` secundaria activa y redirigen al modulo secundario existente con la vista correspondiente del boletin.
- El menu lateral incluye accesos separados para Primaria y Secundaria en Registro Escolar y Reportes.

## Actualizacion de asistencia secundaria

- `/dashboard/secundaria/asistencia` ahora es una pagina propia, no solo una redireccion al boletin.
- Replica la matriz mensual de Primaria con estados `P`, `A`, `E` y `T`.
- Usa identidad visual de Secundaria con acentos teal/slate/cyan/violet para diferenciarla de Primaria.
- Permite importacion masiva CSV con la misma logica matricial: una fila por fecha y columnas por numero de orden.
- El guardado usa busqueda + actualizacion/insercion para evitar borrados destructivos; las celdas vacias no eliminan registros historicos existentes en esta etapa.
