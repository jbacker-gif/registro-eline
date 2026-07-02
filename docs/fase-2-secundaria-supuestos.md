# Fase 2 Secundaria - Supuestos

- El modulo debe convivir con primaria usando las mismas tablas base.
- `secciones.nivel` distingue primaria y secundaria sin duplicar entidades.
- 1ro a 3ro de Secundaria pertenecen al `Primer ciclo general` y no usan modalidad.
- 4to a 6to pertenecen al segundo ciclo y deben usar una modalidad: `Academica`, `Tecnico-Profesional` o `Artes`.
- La salida optativa solo aplica inicialmente a 4to, 5to y 6to.
- Las competencias especificas se guardan como `C1` a `C7` en la tabla existente `calificaciones` y se describen en `secundaria_competencias_catalogo`.
- El minimo aprobatorio del nivel secundario es 70, segun los informes extraidos.
- Los datos demo no se insertan automaticamente para no crear datos en cuentas de usuarios sin confirmacion.
- La vista de informe actual es preliminar y no reemplaza aun la plantilla oficial completa.
- No se modificaron datos reales existentes; los cambios en Supabase fueron aditivos.
