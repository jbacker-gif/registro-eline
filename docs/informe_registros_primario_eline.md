# Informe de analisis: Registros oficiales de Primaria y oportunidades para ELINE

## Alcance revisado

Se analizaron los registros oficiales anexados para 1ro, 2do, 3ro, 4to, 5to y 6to grado del Nivel Primario. Los documentos comparten una estructura base, pero cambian en volumen y en algunos apartados curriculares.

Resumen por grado:

- 1ro: 142 paginas.
- 2do: 142 paginas.
- 3ro: 130 paginas.
- 4to: 114 paginas.
- 5to: 114 paginas.
- 6to: 114 paginas.

La diferencia principal es que 1ro, 2do y 3ro incluyen componentes adicionales asociados al proceso de alfabetizacion inicial. De 4to a 6to el registro es mas compacto y se concentra en evaluacion por competencias, asistencia, acta final y seguimiento.

## Estructura comun del registro oficial

Los seis registros contienen estos bloques funcionales:

1. Datos generales del centro educativo.
2. Datos generales del maestro o la maestra.
3. Resumen de matricula inicial al 15 de octubre.
4. Datos generales de estudiantes.
5. Datos relativos al padre, madre, tutor o tutora.
6. Control mensual de asistencia y puntualidad.
7. Resumen anual de asistencia.
8. Resumen de inscritos e inscritas de la seccion.
9. Orientaciones de evaluacion del Nivel Primario.
10. Especificacion de aspectos trabajados.
11. Registro de evaluacion por competencias.
12. Reporte de estudiantes con ajustes individualizados.
13. Acta de rendimiento de fin de ano escolar.
14. Registro de experiencias directas.
15. Registro de acompanantes a la practica pedagogica.

## Cobertura actual de ELINE

ELINE ya digitaliza partes importantes del registro:

- Perfil del maestro y datos del centro educativo.
- Creacion de secciones por grado, tanda y ano escolar.
- Registro/importacion de estudiantes.
- Asistencia diaria con estados P, A, E y T.
- Calificaciones por asignatura, periodo y competencias.
- Boletines/informes de aprendizaje por estudiante y por seccion.
- Plantillas CSV para carga masiva.

Esto coloca a ELINE en una buena base: ya cubre los datos mas repetitivos y los procesos que mas consumen tiempo al docente.

## Brechas detectadas

### 1. Datos del centro y maestro incompletos frente al registro

El registro oficial solicita mas campos de los que hoy se capturan en Perfil:

- Direccion del centro, paraje, zona, sector.
- Director o directora del centro.
- Datos ampliados del docente: direccion, sexo, fecha de nacimiento, estado civil, nacionalidad, cedula, anos de servicio, titulo, area de especializacion y estudios actuales.
- Posibles reemplazantes responsables del grado.

Implementacion sugerida:

- Ampliar Perfil con secciones plegables: Centro educativo, Docente responsable y Reemplazantes.
- Reutilizar estos datos para generar portada y registros oficiales.

### 2. Ficha del estudiante incompleta

ELINE ya maneja datos basicos, SIGERD, nacimiento, tutor y telefono. El registro oficial pide mas detalle:

- Libro, folio y edad.
- Parentesco de la persona con quien vive.
- Direccion donde reside.
- Nuevo inscrito, retirado y fechas.
- Condicion inicial: aplazado, promovido, repitente, reentrante.
- NEAE, enfermedades, alergias, medicamentos.
- Contacto de emergencia.

Implementacion sugerida:

- Convertir Estudiantes en una ficha completa por tabs: Identidad, Escolaridad, Salud/NEAE, Tutor y Emergencia.
- Mantener la tabla actual como vista rapida.
- Agregar importacion CSV extendida, sin romper la plantilla simple actual.

### 3. Datos del padre, madre, tutor o tutora

El registro permite asentar mas de un responsable por estudiante y campos como:

- Nombre y apellido.
- Parentesco.
- Cedula.
- Telefono.
- Profesion u oficio.
- Nivel educativo alcanzado.

Implementacion sugerida:

- Crear tabla `responsables_estudiante`.
- Permitir uno o varios responsables por estudiante.
- Marcar responsable principal para reportes.

### 4. Asistencia: ELINE cubre el nucleo, pero faltan reportes oficiales

ELINE ya registra P, A, E y T. El registro oficial pide:

- Mes.
- Dias trabajados.
- Totales diarios.
- Resumen mensual por estudiante.
- Resumen anual de asistencia.
- Porcentaje de presencia, ausencia y excusa para acta final.

Implementacion sugerida:

- Agregar pantalla "Resumen anual de asistencia".
- Calcular automaticamente dias trabajados excluyendo bloqueados/fines de semana.
- Generar exportable PDF/impresion con el formato del registro.

### 5. Resumen de matricula e inscritos

El registro incluye resumen inicial al 15 de octubre y resumen de inscritos e inscritas de la seccion.

Implementacion sugerida:

- Dashboard estadistico de seccion:
  - Total inscritos.
  - Activos.
  - Retirados.
  - Nuevos inscritos.
  - Masculino/Femenino.
  - Nacionalidad.
  - Condicion inicial.
- Congelar corte al 15 de octubre para reportes oficiales.

### 6. Especificacion de aspectos trabajados

Este bloque documenta contenidos/aspectos trabajados por periodo o area.

Implementacion sugerida:

- Crear modulo "Planificacion / Aspectos trabajados".
- Registrar por seccion, asignatura, periodo y fecha.
- Permitir copiar aspectos entre secciones o anos escolares.
- Exportar por area al formato del registro.

### 7. Evaluacion por competencias

ELINE ya tiene una matriz por competencias C1, C2 y C3. Hay diferencias por ciclo:

- 1ro y 2do: recuperacion final vinculada al proceso de alfabetizacion inicial.
- 3ro a 6to: recuperacion pedagogica por periodo y recuperacion especial.
- 4to a 6to incluyen mas areas curriculares y estructura con recuperaciones mas completa.

Implementacion sugerida:

- Mantener el modelo actual de C1, C2, C3.
- Agregar reglas por grado:
  - 1ro/2do: alfabetizacion inicial y recuperacion final.
  - 3ro/6to: recuperacion pedagogica por periodo y especial.
- Generar acta final automaticamente desde calificaciones y asistencia.

### 8. Informe individual de alfabetizacion inicial

Presente especialmente en 1ro, 2do y 3ro. Este componente no esta cubierto por ELINE.

Implementacion sugerida:

- Crear modulo "Alfabetizacion inicial".
- Registrar indicadores por estudiante y periodo.
- Generar informe individual para 1ro, 2do y 3ro.
- Relacionarlo con Lengua Espanola y con la situacion final del estudiante.

### 9. Ajustes individualizados / NEAE

El registro tiene reporte de estudiantes con necesidades especificas de apoyo educativo, dificultades y ajustes curriculares.

Implementacion sugerida:

- Crear modulo "Ajustes individualizados".
- Campos: estudiante, necesidad/dificultad, ajuste realizado, periodo, responsable, seguimiento.
- Mostrar alerta discreta en asistencia/calificaciones para estudiantes con NEAE.

### 10. Acta de rendimiento final

El acta final cruza:

- Estudiantes.
- Calificacion final por area.
- Recuperacion final/especial.
- Porcentajes de asistencia, ausencia y excusa.
- Situacion final: promovido, aplazado, reprobado.
- Observaciones.

Implementacion sugerida:

- Crear "Acta final" por seccion.
- Prellenar desde calificaciones y asistencia.
- Permitir revision manual de situacion final y observaciones.
- Exportar a PDF/impresion.

### 11. Experiencias directas y acompanamiento pedagogico

El registro incluye espacios narrativos para:

- Experiencias directas.
- Acompanantes a la practica pedagogica: fecha, hora, nombre, cargo, firma, propositos, comentarios y acuerdos.

Implementacion sugerida:

- Modulo "Bitacora docente".
- Entradas por fecha, tipo, participantes, proposito, acuerdos y evidencias.
- Exportable como anexo del registro.

## Priorizacion recomendada

### Fase 1: Alto impacto y baja complejidad

1. Ampliar ficha de estudiantes.
2. Resumen anual de asistencia.
3. Resumen de matricula/seccion.
4. Mostrar reportes imprimibles basicos.

Impacto: reduce llenado manual inmediato y aprovecha datos que ELINE ya captura.

### Fase 2: Registro oficial parcial

1. Generador de registro por seccion en PDF.
2. Acta final automatizada.
3. Aspectos trabajados por asignatura/periodo.
4. Reglas de recuperacion por grado.

Impacto: convierte a ELINE en una herramienta de cierre de periodo y cierre de ano escolar.

### Fase 3: Diferenciadores fuertes

1. Alfabetizacion inicial para 1ro, 2do y 3ro.
2. Ajustes individualizados NEAE.
3. Bitacora de experiencias directas.
4. Acompanamiento pedagogico.

Impacto: acerca ELINE al registro oficial completo y agrega valor pedagogico, no solo administrativo.

## Recomendacion tecnica

Antes de generar el registro completo en PDF, conviene fortalecer la base de datos con estas entidades:

- `responsables_estudiante`
- `salud_estudiante`
- `neae_ajustes`
- `aspectos_trabajados`
- `actas_finales`
- `experiencias_directas`
- `acompanamientos_pedagogicos`
- `alfabetizacion_inicial`

Tambien conviene crear una capa de "reportes oficiales" que no mezcle la captura de datos diaria con la impresion final. La captura debe seguir siendo rapida y simple; el reporte puede ser mas detallado y formal.

## Conclusion

ELINE ya cubre el nucleo operativo mas importante del registro: secciones, estudiantes, asistencia, calificaciones y boletines. La mejora mas estrategica no es intentar digitalizar las 114-142 paginas de golpe, sino avanzar por modulos que automaticen lo repetitivo y produzcan reportes oficiales.

La ruta recomendada es:

1. Completar ficha de estudiante y responsables.
2. Generar resumen anual de asistencia y matricula.
3. Crear acta final automatizada.
4. Agregar aspectos trabajados y alfabetizacion inicial.
5. Finalmente, generar el registro oficial completo por grado/seccion.
