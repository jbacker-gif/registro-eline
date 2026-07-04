# Fase 2 Secundaria - Supuestos

- El modulo debe convivir con primaria usando las mismas tablas base.
- `secciones.nivel` distingue primaria y secundaria sin duplicar entidades.
- 1ro a 3ro de Secundaria pertenecen al `Primer ciclo general` y no usan modalidad.
- 4to a 6to pertenecen al segundo ciclo y deben usar una modalidad: `Academica`, `Tecnico-Profesional` o `Artes`.
- La salida optativa solo aplica inicialmente a 4to, 5to y 6to.
- El flujo visible de boletines guarda calificaciones en la tabla existente `calificaciones` con `competencia = BOLETIN`.
- El minimo aprobatorio del nivel secundario se mantiene en 70.
- Los datos demo no se insertan automaticamente para no crear datos en cuentas de usuarios sin confirmacion.
- La vista visible actual es `Boletin de Calificaciones`; el informe preliminar anterior queda no activo.
- No se modificaron datos reales existentes; los cambios en Supabase fueron aditivos.
- RP no se muestra en el boletin visible actual; el boletin oficial trabaja P1, P2, P3 y P4.
- Las materias por nivel se organizan en `asignaturas_nivel_config` sin borrar el catalogo historico `asignaturas`.
- Las rutas primarias solo deben usar secciones de Primaria.
- Los PDF de boletines secundarios aun deben convertirse a JPG para replicar exactamente el patron visual de Primaria.
