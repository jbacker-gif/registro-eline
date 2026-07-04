# Modulo de estudiantes por nivel

## Referencia visual

Se tomo como referencia el HTML `listado-estudiantes.html` compartido por el usuario: encabezado institucional, ciclo escolar visible, docente titular, cantidad de matriculados, barra de busqueda, tabla limpia, avatares con iniciales, estados tipo badge y columna de tutor/contacto.

## Primaria

Se actualizo `/dashboard/estudiantes?seccion_id=...` para que funcione como listado academico de estudiantes por seccion de Primaria.

La vista muestra:

- Centro educativo y ciclo escolar.
- Titulo de seccion con nivel explicito: `grado de Primaria - Seccion`.
- Docente titular y cantidad de alumnos matriculados.
- Busqueda por nombre, apellido, matricula o tutor.
- Tabla con estudiante, edad, numero de orden, matricula, estado, promedio, tutor/contacto y acciones.
- Acciones existentes de nuevo estudiante, importacion CSV, plantilla, editar, retirar/reactivar y eliminar.

Se agrego una validacion funcional para evitar abrir una seccion secundaria dentro del modulo de Primaria.

La paleta visual quedo ajustada a blanco institucional con acentos azul/sky para evitar una apariencia demasiado beige. En la limpieza posterior se elimino la linea secundaria repetida debajo del titulo principal, dejando solo centro, ciclo, titulo, docente y matricula total.

## Secundaria

Se actualizo la pestana `Listado` de `/dashboard/registro-secundaria` con una vista equivalente, pero con identidad visual verde/emerald y contexto propio del nivel.

La vista muestra:

- Centro educativo y ciclo escolar.
- Titulo de seccion con nivel explicito: `grado de Secundaria - Seccion`.
- Ciclo de secundaria y modalidad cuando aplica.
- Docente titular y cantidad de alumnos matriculados.
- Busqueda por nombre, matricula, RNE o tutor.
- Tabla con estudiante, matricula, estado, promedio, tutor/contacto, condicion y acciones: ver, editar, calificaciones y boletin.

La identidad visual secundaria se ajusto a blanco con acentos teal/slate para diferenciarla de Primaria sin saturar la pantalla. Tambien se retiro la franja superior recargada de Secundaria: titulo general, selector superior, tarjetas resumen, filtros y pestanas previas. El modulo ahora inicia directamente con el encabezado limpio del listado.

## Componentes y datos reutilizados

Se reutilizaron las tablas existentes:

- `estudiantes`
- `secciones`
- `responsables_estudiante`
- `calificaciones`
- `perfiles`
- `colegios`

No se crearon tablas nuevas ni se realizaron acciones destructivas en Supabase.

Se agregaron utilidades compartidas en `src/lib/registroEscolar.ts` para normalizar la presentacion:

- Iniciales del estudiante.
- Edad desde fecha de nacimiento.
- Matricula visible.
- Tutor y telefono principal.
- Estado visible.
- Promedio mostrable.

## Pendientes

- Crear una pantalla de detalle dedicada para estudiante, separada del drawer/formulario.
- Definir permisos finos para ocultar editar/eliminar segun rol.
- Revisar si el promedio debe calcularse por asignatura, periodo o promedio final oficial del MINERD.
- Sustituir el JSX antiguo oculto del listado de Primaria por una limpieza definitiva cuando se estabilice la nueva vista.
