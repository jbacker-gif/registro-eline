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
- Las acciones del listado secundario se separaron en `Ver`, `Editar`, `Evaluacion` e `Informe`.

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
