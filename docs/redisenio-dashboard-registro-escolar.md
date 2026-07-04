# Redisenio Dashboard y Registro Escolar

## Inconsistencias encontradas

- El Dashboard usaba una unica `ultimaSeccionActiva`, sin distinguir Primaria de Secundaria.
- Varias pantallas primarias recibian cualquier `seccion_id` y asumian que era Primaria.
- Las secciones se mostraban como `2do "A"` sin indicar nivel educativo.
- El catalogo `asignaturas` era comun y no tenia configuracion por nivel o grado.
- El modulo de Secundaria venia de una referencia de informe de evaluacion que luego fue reemplazada por boletines oficiales.

## Por que se mezclaban Primaria y Secundaria

- El contexto activo era global y no por nivel.
- Las rutas primarias dependian solo de `seccion_id`.
- Las materias no tenian metadatos de nivel, ciclo o grado.

## Cambios realizados

- El Dashboard ahora separa resumen, accesos y materias por nivel.
- Las rutas primarias usan `ultimaSeccionPrimaria`.
- Secundaria no depende de la seccion primaria activa.
- El Dashboard mantiene selectores separados: una seccion activa para Primaria y otra para Secundaria.
- El modulo de Primaria queda organizado en cinco accesos: `Estudiantes`, `Asistencia`, `Notas`, `Reporte` y `Boletines`.
- Se eliminaron las tarjetas de pendientes del resumen porque no aportaban una accion distinta frente a los totales principales.
- El modulo secundario ahora replica la estructura funcional de Primaria: Estudiantes, Asistencia, Notas y Reportes.
- Se agrego entrada directa a calificaciones de Secundaria con materias secundarias y apertura directa del formato de boletin.
- Las etiquetas de seccion ahora muestran nivel, grado, seccion, tanda, ano escolar y modalidad cuando aplica.
- La entrada visible de Secundaria muestra P1, P2, P3 y P4 para el boletin de calificaciones.
- Las notas nuevas escriben contexto en `calificaciones`: `nivel`, `ano_escolar`, `tipo_registro = secundaria_boletin_calificaciones` y metadata.
- El listado de estudiantes por seccion se redisenio para Primaria y Secundaria con identidad visual diferenciada, busqueda y datos academicos visibles.

## Supabase

- Se agrego `asignaturas_nivel_config` para separar materias de Primaria y Secundaria.
- Se agrego `secundaria_registro_formatos` para describir el formato oficial operativo por grado/asignatura.
- Se agregaron columnas aditivas en `calificaciones` para nivel, ano escolar, tipo de registro y RP.
- No se borraron tablas, columnas ni datos.

## Pendiente

- Validar visualmente en navegador local cuando el entorno Node deje de quedarse colgado.
- Capturar indicadores de logro, contenidos trabajados, estrategias y observaciones por periodo.
- Crear reportes secundarios oficiales con plantilla fiel por grado.
- Convertir los boletines secundarios oficiales a JPG y superponer datos como en Primaria.
- Revisar asistencia secundaria como submodulo propio.
- Convertir el acceso `Asistencia` de Secundaria en una pantalla propia, separada de la asistencia primaria.
- Crear detalle individual dedicado del estudiante para ambos niveles y separar permisos de edicion/eliminacion por rol.

## Recomendaciones

- Toda ruta nueva debe declarar nivel educativo.
- Evitar usar `ultimaSeccionActiva` para Secundaria.
- Las materias nuevas deben entrar por `asignaturas_nivel_config`.
- Todo reporte debe incluir `nivel`, `grado`, `seccion_id`, `ano_escolar` y `tipo_registro`.
