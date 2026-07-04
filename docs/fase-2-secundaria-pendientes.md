# Fase 2 Secundaria - Pendientes

## Funcionales

- Persistir datos demo reales por usuario si se desea una semilla de staging.
- Calcular condicion final por asignatura y promocion global del grado.
- Agregar filtros adicionales por tanda y salida optativa.
- Integrar responsables secundarios multiples si el formato final lo requiere.
- Persistir observaciones, situacion y condicion final aunque no existan calificaciones por asignatura.

## Visuales

- Convertir los boletines oficiales de Secundaria a JPG y agregarlos como plantillas.
- Superponer datos sobre las imagenes oficiales, siguiendo el patron de Primaria.
- Agregar indicadores visuales para pendientes, reprobados, transferidos y retirados.

## Validacion

- Validar RNE, pasaporte o cedula segun reglas institucionales.
- Validar que las calificaciones sean 0-100 y que la aprobacion minima sea 70.
- Validar campos obligatorios por grado y ciclo.
- Verificar con usuarios reales la nomenclatura PC, C.F., C.E.C., C.E. EX y C.E. en la captura digital.

## Reportes

- Boletin individual oficial.
- Reporte de promocion del grado.
- Reporte de asistencia y puntualidad.
- Resumen por asignatura y periodo.

## PDF oficiales

- Mapear coordenadas exactas de cada boletin de calificaciones.
- Confirmar si los registros de 4to, 5to y 6to tienen salidas optativas especificas por centro.
- Revisar paginas finales de promocion y firmas para una reproduccion completa.
# Actualizacion de redisenio

- Validar en navegador la nueva separacion del Dashboard general.
- Revisar con usuarios si `Seccion activa para Primaria` es suficientemente claro.
- Revisar con usuarios si los selectores separados de Primaria y Secundaria evitan la confusion entre grados iguales.
- Crear submodulos secundarios separados para asistencia, conducta y reportes oficiales.
- Completar la pantalla propia de Asistencia secundaria; el acceso ya existe en el modulo, pero aun debe desarrollarse el formato funcional completo.
- Mejorar la entrada de calificaciones secundaria con persistencia independiente de observaciones y condicion final.

## Modulo de estudiantes

- Crear una vista de detalle dedicada para estudiante en lugar de depender solo del formulario/drawer.
- Definir permisos por rol para mostrar u ocultar edicion y eliminacion.
- Revisar si el promedio del listado debe salir de una tabla de cierre oficial o seguir calculandose desde `calificaciones`.
- Limpiar el JSX antiguo oculto del listado de Primaria cuando se valide la nueva pantalla en uso real.
