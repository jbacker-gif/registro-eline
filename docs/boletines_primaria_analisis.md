# Analisis de boletines oficiales de primaria

Rama de trabajo: `staging`

## Alcance revisado

Se revisaron los seis PDFs oficiales anexados para 1ro a 6to de primaria. Todos tienen dos paginas y comparten la base del "Informe de aprendizaje": portada con datos del estudiante/centro, firmas por periodo, observaciones narrativas, desempeno por competencias, resumen de asistencia y leyenda de escala.

La primera implementacion debe enfocarse en 1er grado y luego reutilizar el modelo para los demas grados.

## Boletin de 1er grado

### Datos de portada

Campos visibles en el PDF:

- Ano escolar
- Seccion
- Numero de orden
- Nombre(s)
- Apellido(s)
- ID estudiante / numero de identificacion SIGERD
- Docente
- Centro educativo
- Codigo del centro
- Tanda
- Telefono del centro
- Distrito educativo
- Regional de educacion
- Provincia
- Municipio

Tambien incluye:

- Firma del padre, madre o tutor por periodo:
  - Ago-Sept-Oct
  - Nov-Dic-Ene
  - Feb-Mar
  - Abr-May-Jun
- Campo narrativo: informacion sobre el nivel de avance de los aprendizajes y apoyos necesarios.
- Firma del maestro(a) encargado(a) del grado.
- Firma del director(a) del centro educativo.

### Tabla academica

Asignaturas detectadas:

- Lengua Espanola
- Matematica
- Ciencias Sociales
- Ciencias de la Naturaleza
- Educacion Fisica
- Formacion Integral, Humana y Religiosa
- Educacion Artistica

Competencias:

- C1: Comunicativa
- C2: Pensamiento Logico, Creativo y Critico; Resolucion de Problemas; Cientifica y Tecnologica
- C3: Etica y Ciudadana; Desarrollo Personal y Espiritual; Ambiental y de la Salud

Estructura:

- Cada asignatura tiene P1, P2, P3 y P4 para C1, C2 y C3.
- Al final tiene calificacion final por competencia: C1, C2 y C3.
- No se observa columna de recuperacion pedagogica para 1er grado en el boletin oficial.

### Asistencia

El boletin requiere resumen por periodo:

- P1: asistencia y ausencia
- P2: asistencia y ausencia
- P3: asistencia y ausencia
- P4: asistencia y ausencia
- Porcentaje anual de asistencia
- Porcentaje anual de ausencia

La app ya registra asistencia diaria en `public.asistencia`, por lo que estos datos pueden calcularse sin crear tabla nueva.

## Comparacion con Supabase actual

Tablas existentes utiles:

- `public.estudiantes`
- `public.secciones`
- `public.colegios`
- `public.perfiles`
- `public.asignaturas`
- `public.calificaciones`
- `public.asistencia`

Campos que ya existen y sirven:

- `estudiantes.numero_orden`
- `estudiantes.nombres`
- `estudiantes.apellidos`
- `estudiantes.nombre_completo`
- `estudiantes.sexo`
- `estudiantes.fecha_nacimiento`
- `estudiantes.nacionalidad`
- `estudiantes.nombre_tutor`
- `estudiantes.telefono_contacto`
- `estudiantes.seccion_id`
- `secciones.grado`
- `secciones.identificador`
- `secciones.nivel`
- `secciones.ano_escolar`
- `secciones.tanda`
- `colegios.nombre`
- `colegios.distrito_educativo`
- `perfiles.nombre_completo`
- `calificaciones.periodo`
- `calificaciones.competencia`
- `calificaciones.nota`
- `asistencia.fecha`
- `asistencia.estado`

## Campos faltantes recomendados

Para reproducir fielmente la portada oficial del boletin de 1er grado faltan estos campos:

### En `public.estudiantes`

- `sigerd_id text`: ID estudiante / numero de identificacion SIGERD.

### En `public.colegios`

- `codigo_centro text`
- `telefono_centro text`
- `regional_educacion text`
- `provincia text`
- `municipio text`

`colegios.distrito_educativo` ya existe. `colegios.tanda` existe, pero para el boletin conviene priorizar `secciones.tanda`, porque la tanda puede variar por seccion.

### Opcional para observaciones

Si el sistema debe guardar las observaciones narrativas que aparecen en la portada, conviene crear una tabla nueva:

```sql
create table public.boletin_observaciones (
  id uuid primary key default extensions.uuid_generate_v4(),
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  seccion_id uuid not null references public.secciones(id) on delete cascade,
  user_id uuid not null references auth.users(id) default auth.uid(),
  periodo text not null,
  observacion text,
  creado_en timestamptz default timezone('utc'::text, now()),
  actualizado_en timestamptz default timezone('utc'::text, now())
);
```

No es obligatorio para generar el primer boletin si se deja el area de observaciones en blanco o como campo imprimible manual.

## Recomendacion para la primera fase

1. Agregar en staging una migracion/documento SQL para los campos faltantes.
2. Actualizar la pantalla de estudiantes para capturar `sigerd_id`.
3. Actualizar o crear pantalla de configuracion del centro para capturar codigo, telefono, regional, provincia y municipio.
4. Redisenar `src/app/dashboard/boletines/page.tsx` para imprimir el formato oficial de 1er grado.
5. Calcular asistencia por periodos desde `public.asistencia`.
6. Usar `secciones.ano_escolar`, `secciones.identificador`, `secciones.tanda` y `perfiles.nombre_completo` para completar la portada.

