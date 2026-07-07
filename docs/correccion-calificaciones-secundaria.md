# Correccion de calificaciones de Secundaria

## Problema encontrado

El modulo de calificaciones de Secundaria estaba usando una estructura demasiado simple para el boletin: periodos P1, P2, P3 y P4, con calculos equivalentes a un promedio general. Esa logica no coincide con el ejemplo oficial revisado en `Registro 1er-grado.pdf`.

## Referencia del PDF oficial

El ejemplo oficial de Lengua Espanola muestra que la calificacion final no sale de un promedio simple de los cuatro periodos. El registro trabaja con competencias especificas y divide el calculo en dos grupos:

- Competencias C1 a C4: 70% de la calificacion.
- Competencias C5 a C7: 30% de la calificacion.

Cada competencia contempla:

- P1
- P2
- RP despues de P2
- P3
- P4
- RP despues de P4

## Formula del 70%

Se suman las calificaciones y RP de las primeras 4 competencias especificas y se multiplica por:

```text
0.70 / 16 = 0.04375
```

Ejemplo validado:

```text
1307 * 0.04375 = 57.18 = 57
```

## Formula del 30%

Se suman las calificaciones y RP de las ultimas 3 competencias especificas y se multiplica por:

```text
0.30 / 12 = 0.025
```

Ejemplo validado:

```text
1020 * 0.025 = 25.5 = 26
```

## Calificacion final

La calificacion final se calcula sumando ambos resultados:

```text
57 + 26 = 83
```

El minimo aprobatorio queda en 70 puntos:

- `>= 70`: Aprobado.
- `< 70`: Reprobado.
- Sin valores capturados: Pendiente.

## Implementacion

Se agrego `src/lib/secundariaCalificaciones.ts` como helper compartido para:

- Definir competencias C1 a C7.
- Definir periodos P1, P2, RP1, P3, P4 y RP2.
- Crear matrices vacias por estudiante.
- Normalizar periodos RP.
- Calcular suma del 70%, suma del 30%, resultado 70%, resultado 30%, final y situacion.
- Validar el ejemplo oficial.

Se ajustaron:

- `src/app/dashboard/secundaria/asignaturas/[slug]/page.tsx`
- `src/app/dashboard/secundaria/calificaciones-masivas/page.tsx`
- `src/app/dashboard/registro-secundaria/page.tsx`

## Supabase

No se creo migracion nueva y no se hizo ningun cambio destructivo.

Se reutilizo la tabla `calificaciones`, que ya permite `periodo text`, `competencia text`, `metadata`, `nivel`, `tipo_registro`, `es_recuperacion_pedagogica` y `grupo_recuperacion`.

El nuevo flujo guarda:

- `nivel = Secundario`
- `tipo_registro = secundaria_boletin_calificaciones`
- `competencia = C1 | C2 | C3 | C4 | C5 | C6 | C7`
- `periodo = P1 | P2 | RP1 | P3 | P4 | RP2`
- `es_recuperacion_pedagogica = true` en RP1 y RP2
- `metadata.resultado_70`
- `metadata.resultado_30`
- `metadata.final_area`
- `metadata.situacion_asignatura`

## Validacion del ejemplo

Se valido manualmente con los valores del ejemplo oficial:

```text
suma70 = 1307
resultado70 = 57
suma30 = 1020
resultado30 = 26
final = 83
```

El build tambien paso correctamente con `npm.cmd run build`.

## Pendiente

- Validar con el equipo academico si la recuperacion pedagogica debe capturarse siempre aunque el periodo tenga calificacion aprobatoria.
- Completar la vista imprimible del boletin con mayor fidelidad visual al PDF oficial.
- Revisar si la asistencia menor al 80% debe bloquear automaticamente la situacion final o solo emitir alerta.
