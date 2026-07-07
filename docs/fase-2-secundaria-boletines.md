# Fase 2 Secundaria - Boletines de calificaciones

## Referencia oficial revisada

Se cambio la referencia funcional del modulo de Secundaria a los boletines oficiales:

- `Boletin 1er.pdf`
- `Boletin 2do.pdf`
- `Boletin 3ro.pdf`
- `Boletin 4to.pdf`
- `Boletin 5to.pdf`
- `Boletin 6to.pdf`

Los seis boletines tienen dos paginas:

- Pagina 1: datos generales, datos del centro, docente, observaciones, firma del padre/madre/tutor y periodos de reporte.
- Pagina 2: calificaciones de rendimiento, competencias fundamentales como marco de referencia, periodos P1-P4, promedio de competencias especificas, calificacion final, completiva, extraordinaria, evaluacion especial, situacion final por asignatura, resumen de asistencia, leyenda, situacion del estudiante, condicion final y firmas.

## Cambio frente a informes anteriores

Los informes de evaluacion usados anteriormente no quedan como flujo visible del usuario. La terminologia activa para Secundaria pasa a ser:

- `Boletin`
- `Boletin de Calificaciones`
- `Imprimir boletin`
- `Entrada de calificaciones del boletin`

La vista anterior de informe preliminar queda reemplazada en la interfaz por la vista de boletin.

## Estructura implementada

- Listado de estudiantes del Nivel Secundario.
- Accion `Calificaciones` para capturar la matriz oficial por asignatura: 7 competencias especificas con P1, P2, RP, P3, P4 y RP.
- Accion `Boletin` para visualizar/imprimir el boletin.
- Tabla por areas curriculares:
  - Lengua Espanola.
  - Lenguas Extranjeras - Ingles.
  - Lenguas Extranjeras - Frances.
  - Matematica.
  - Ciencias Sociales.
  - Ciencias de la Naturaleza.
  - Educacion Artistica.
  - Educacion Fisica.
  - Formacion Integral Humana y Religiosa.
  - Salida Optativa solo para 4to, 5to y 6to.
- Campos de calificacion:
  - Competencias C1 a C7.
  - P1, P2, RP1, P3, P4 y RP2 por competencia.
  - Resultado 70% para C1-C4.
  - Resultado 30% para C5-C7.
  - C.F.
  - C.E.C.
  - C.E. EX.
  - C.E.
  - Situacion final por asignatura.
- Resumen de asistencia por P1-P4 y porcentaje anual.
- Situacion del estudiante y condicion final.
- Observaciones y firmas.

## Ciclos

- 1ro, 2do y 3ro se tratan como Primer Ciclo del Nivel Secundario.
- 4to, 5to y 6to se tratan como Segundo Ciclo del Nivel Secundario.
- La salida optativa se muestra unicamente para segundo ciclo.

## Supabase

No se hizo ninguna accion destructiva ni se creo una migracion nueva en esta correccion.

Se reutilizan:

- `estudiantes`
- `secciones`
- `asignaturas`
- `calificaciones`
- `asistencia`
- `perfiles`
- `colegios`

Las calificaciones del boletin se guardan en `calificaciones` con:

- `nivel = Secundario`
- `tipo_registro = secundaria_boletin_calificaciones`
- `competencia = C1 | C2 | C3 | C4 | C5 | C6 | C7`
- `periodo = P1 | P2 | RP1 | P3 | P4 | RP2`
- `metadata` para resultado 70%, resultado 30%, C.F., completiva, extraordinaria, especial, situacion final, observaciones y condicion.

## Pendiente

- Convertir los PDF oficiales de Secundaria a JPG y agregarlos a `public/boletines-secundaria`.
- Superponer datos sobre las imagenes oficiales, igual que el patron actual de Primaria.
- Persistir observaciones/situacion/condicion aunque no haya calificaciones en una asignatura.
- Ajustar la vista imprimible para mostrar todos los campos C1-C7 y RP con mayor fidelidad al PDF.
- Completar integracion de asistencia secundaria por calendario oficial.
- Validar coordenadas exactas de impresion con los boletines oficiales.
