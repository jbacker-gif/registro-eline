# ELINE: informe técnico y plan de implementación de suscripciones
Fecha de revisión: 13 de septiembre de 2026  
Estado: diagnóstico y planificación; implementación funcional pendiente  
Repositorio: jbacker-gif/registro-eline  
Rama de entrega: codex/eline-plan-produccion-suscripciones  
Base: staging, commit b11b56f5dc2d067cd9b1a38ed2fdb00d6aeed79a

## 1. Dictamen ejecutivo

Mantener Supabase y Next.js para el lanzamiento previsto en octubre de 2026. No hay evidencia económica suficiente para justificar una migración de plataforma antes de medir el uso de producción. La meta comercial indicada por ADSP es llegar a 500 cuentas al finalizar diciembre, con referencia de RD$399 por mes. Las 17 cuentas de beta no equivalen a clientes de pago.

La infraestructura y la facturación a los maestros son dos sistemas diferentes: Free/Pro y Micro/Small corresponden a proveedores; Gratis/Mensual/Trimestral/Anual corresponden a ELINE. Este plan cubre ambos.

Se detectan cuatro prioridades antes del lanzamiento comercial:
1. Asegurar alojamiento comercial: el equipo conectado de Vercel está en Hobby, limitado a uso personal no comercial. Debe presupuestarse Pro o un alojamiento comercial alternativo antes del uso comercial; una beta de negocio no queda automáticamente exceptuada.
2. Completar los permisos y límites de suscripción en la base de datos y en las operaciones del servidor.
3. Integrar cuidadosamente las diferencias entre staging y main.
4. Verificar restauración de respaldos y rendimiento con cuentas sintéticas.

Los cálculos anteriores de US$25/35 cubrían únicamente Supabase. Con Vercel Pro de un asiento, los presupuestos base combinados pasan a US$20, US$45 o US$55 según el escenario detallado más adelante. Son bases de facturación, no topes garantizados.

## 2. Evidencia verificada y alcance

| Componente | Hallazgo |
|---|---|
| Supabase | RegistroEscolarApp, proyecto gaitpdremkesyvsyddhn; organización AD Soluciones Profesionales, plan Free confirmado en esta conversación |
| Base de datos | PostgreSQL 17; región us-west-2; 23.325.843 bytes, aproximadamente 23,3 MB, medidos nuevamente el 13/09 |
| Cuentas | 17 cuentas de Auth; 1 fila de suscripción, Mensual e inactiva; no demuestra ingresos cobrados |
| Datos académicos | En la medición anterior del mismo día: 343 estudiantes, 17 secciones, 4 centros, 15.899 asistencias y 9.795 calificaciones |
| Archivos | 4 objetos, 5.929.046 bytes según metadatos, en la medición anterior del mismo día |
| Vercel | Equipo jbacker-gifs-projects, plan Hobby; proyecto registro-eline enlazado a este repositorio |
| Configuración | Framework Next.js; Node 24.x en Vercel; staging declara Next.js 16.2.2, React 19.2.4 y supabase-js ^2.101.1 |
| Despliegue | Último despliegue devuelto por el conector: READY, target production, desde main, commit 752f78ab80239934861a4d7f1114fb5eae827f00, 17/07/2026 UTC |
| Dominios | adsp.com.do y www.adsp.com.do aparecen asignados al proyecto |
| Errores | Consulta de errores agrupados de Vercel de las últimas 24 horas: sin resultados |
| Ramas | main y staging divergen: staging tiene 9 commits propios y carece de 15 commits de main |

READY describe el despliegue técnico, no la preparación comercial del producto. La ausencia de errores en la consulta no demuestra ausencia de fallos: no conocemos el tráfico de la ventana ni tenemos una prueba funcional completa. No se inspeccionaron valores secretos ni registros personales para elaborar el informe. El repositorio consultado es privado.

No se dispone de medición completa de egress, usuarios activos mensuales, CPU, memoria o factura real. No se ejecutaron pruebas de carga, restauraciones ni transacciones de compra. El informe es una revisión dirigida de infraestructura, políticas, configuración y archivos clave de staging; no certifica toda la aplicación ni que las funciones de staging estén en producción.

## 3. Planes comerciales encontrados en staging

Fuente: src/app/suscripciones/page.tsx y tabla public.suscripciones.

| Plan | Precio publicado | Equivalente mensual | Oferta publicada |
|---|---:|---:|---|
| Gratis | RD$0 | RD$0 | 1 sección, 15 estudiantes, acceso básico |
| Mensual | RD$399/mes | RD$399 | Secciones y estudiantes ilimitados; funciones avanzadas |
| Trimestral | RD$1.100/3 meses | RD$366,67 | Beneficios del Mensual y reportes/acompañamiento |
| Anual | RD$3.990/año | RD$332,50 | Beneficios del Trimestral y acceso anticipado/soporte |

La activación publicada es manual vía WhatsApp. Se propone conservarla en la primera versión para evitar construir una pasarela antes de validar ventas. El informe no envía mensajes ni activa suscripciones.

El ahorro trimestral frente a tres mensualidades es 8,10%; el anual frente a doce es 16,67%. Por tanto, RD$399 es una referencia de ingreso por cliente mensual, no el promedio garantizado si se venden planes largos.

Pendiente de decisión comercial: precisar cuáles funciones son básicas y avanzadas, alcance real del soporte, tratamiento de períodos vencidos, reglas para cuentas beta y si el límite gratuito se cuenta por año escolar. Propuesta inicial: 1 sección y 15 estudiantes por cuenta en total, sumando primaria y secundaria, para evitar que duplicar niveles evada el límite. No se cambia el precio ni la oferta de “ilimitados” sin una decisión comercial explícita; un límite técnico de tamaño de lote no debe convertirse en un límite oculto de estudiantes.

## 4. Brechas técnicas

### 4.1 Suscripciones y permisos — prioridad alta

En src/app/dashboard/layout.tsx se consulta la suscripción desde el navegador. Solo se redirige si existe una fila sin error y está inactiva o vencida. Una fila ausente o un error dejan continuar; no se consulta el plan ni fecha_inicio. El vencimiento usa la fecha del dispositivo.

El panel src/app/dashboard/admin/page.tsx permite administración manual y usa app_metadata para el rol. La tabla tiene políticas de escritura restringidas a administradores, lo cual es una base útil. Sin embargo, user_id admite nulos, la unión también puede hacerse por correo y no existe historial de pagos en la migración revisada. No debe confundirse “activa” con “pago verificado”.

Las políticas vigentes consultadas de estudiantes, secciones, asistencia y calificaciones verifican propiedad y relaciones, pero no plan, vigencia ni cupo. La consulta de information_schema.triggers no devolvió disparadores para estudiantes, secciones y suscripciones. En estas capas revisadas no está acreditado el cumplimiento de la oferta gratuita ni el bloqueo comercial de escritura. Ocultar botones o redirigir una página no protege las llamadas directas a la API.

### 4.2 Rendimiento — optimizar antes de comprar más capacidad

El asesor de Supabase devolvió:
- 11 claves foráneas sin índice de cobertura; incluyen asistencia por usuario/sección y calificaciones por usuario.
- 21 advertencias de evaluación de funciones de autenticación en políticas RLS.
- 10 índices sin uso registrado.
- 1 advertencia de políticas permisivas múltiples en store_products.

No eliminar índices automáticamente por falta de uso en beta. Evaluar consultas reales con EXPLAIN y probar índices individuales o compuestos según los filtros. Mantener idénticas reglas de autorización al optimizar RLS; no aplicar reemplazos masivos a ciegas.

### 4.3 Seguridad y recuperación

El asesor de seguridad informó protección contra contraseñas filtradas desactivada. Revisar disponibilidad por plan y configuración. Este hallazgo no sustituye pruebas de aislamiento entre maestros.

Ya existe documentación de respaldos y scripts/backup-supabase.ps1. La documentación indica datos del esquema public por defecto: esto no demuestra recuperación completa de Auth ni de los archivos binarios de Storage. Verificar alcance real del script, conexión apta para dumps, cifrado, retención y restauración con identidades y relaciones. Un script existente no prueba que una tarea esté programada o que haya copias utilizables.

## 5. Presupuesto corregido

Tarifas consultadas el 13/09/2026. Un asiento de despliegue de Vercel incluido; los maestros son clientes de ELINE, no asientos de Vercel.

| Escenario | Supabase/mes | Vercel/mes | Base total/mes | 3 meses a configuración constante |
|---|---:|---:|---:|---:|
| Inicio comercial austero: Supabase Free + Vercel Pro | US$0 | US$20 | US$20 | US$60 |
| ELINE Micro en organización Pro; unapa-web separado en Free | US$25 | US$20 | US$45 | US$135 |
| Ambos proyectos Micro en la misma organización Pro | US$35 | US$20 | US$55 | US$165 |
| ELINE Small solo en Pro; unapa-web separado en Free | US$30 | US$20 | US$50 | US$150 |
| ELINE Small + unapa-web Micro en la misma organización Pro | US$40 | US$20 | US$60 | US$180 |

Supabase Pro: suscripción de US$25 más cómputo y menos US$10 de crédito de cómputo. Micro aproximadamente US$10 y Small US$15 mensuales; facturación por horas. Vercel Pro: US$20 base con un asiento y crédito de uso. Los créditos de ambas empresas no se transfieren entre sí.

Excluye impuestos, cambio de divisa, cobros por consumo adicional, dominio, correo transaccional, almacenamiento de respaldos, comisiones de pago, trabajo técnico y servicios de IA. No puede presentarse la tabla como factura exacta. El escalado Micro → Small → Medium no está ligado automáticamente a un número de maestros.

Separar organizaciones puede ahorrar unos US$10/mes de cómputo adicional, sujeto a los requisitos de transferencia. No supone crear automáticamente un tercer proyecto gratuito: las cuotas gratuitas de proyectos también se aplican a la cuenta. Para pruebas, utilizar Supabase local con datos sintéticos o un entorno separado autorizado; una rama Git no aísla una base Supabase.

## 6. Ingresos y punto de cobertura

| Cuentas que pagan | Todas Mensual: ingreso mensual | Todas Trimestral: equivalente mensual | Todas Anual: equivalente mensual |
|---|---:|---:|---:|
| 25 | RD$9.975 | RD$9.166,67 | RD$8.312,50 |
| 100 | RD$39.900 | RD$36.666,67 | RD$33.250 |
| 500 | RD$199.500 | RD$183.333,33 | RD$166.250 |

Los equivalentes distribuyen el precio entre meses y no representan cobros mensuales de planes prepagados. La mezcla real, cuentas gratuitas, morosidad y cancelaciones reducen la previsión.

Fórmula para cubrir solo infraestructura: redondear hacia arriba [costo mensual total en USD × tasa DOP/USD aplicada al pago ÷ ingreso neto mensual por maestro]. Incorporar impuestos del proveedor y otros costos; no se fija una tasa cambiaria no verificada.

Calendario ilustrativo de altas: octubre 150 cuentas, noviembre 325 acumuladas y diciembre 500. No es una previsión validada de ventas ni implica que todas paguen el mes completo. Medir conversión de Gratis a pago, ingreso cobrado y renovaciones desde el lanzamiento.

## 7. Plan de implementación en la rama

Rama documental creada desde staging: codex/eline-plan-produccion-suscripciones. Mantener main como producción. El flujo del repositorio exige revisar Preview antes de fusionar a main. No se ha fusionado ni implementado código funcional en esta entrega.

| Fase | Trabajo concreto | Archivos o componentes previstos | Criterio de aceptación |
|---|---|---|---|
| 0. Preparar base, 1–2 días | Integrar main en una rama de integración; resolver diferencias de portada, tienda, secundaria y suscripciones; verificar variables por entorno sin exponer valores | docs/STAGING_WORKFLOW.md; configuración Preview; archivos en conflicto | Se conserva la web actual y funcionan rutas de primaria/secundaria; Preview usa datos de prueba |
| 1. Catálogo, 1–2 días | Centralizar precios y capacidades; reutilizar en portada, suscripciones y administración | Nuevo src/lib/planes.ts; src/app/suscripciones/page.tsx; panel admin | Los cuatro planes coinciden con la oferta publicada; no se inventan funciones o descuentos |
| 2. Modelo comercial, 2–3 días | Canonizar user_id; agregar historial de eventos/pagos manuales; validar importes, estados y vigencias | Nueva migración Supabase; tipos compartidos | Renovación idempotente; historial con administrador y fecha; cuentas duplicadas/nulas reconciliadas sin asignar pagos erróneos |
| 3. Cumplimiento, 2–4 días | Resolver acceso en servidor/base; límites gratuitos atómicos; cubrir importación y API directa | RLS y funciones controladas; operaciones de estudiantes/secciones; dashboard/layout.tsx | Dos altas concurrentes no exceden el cupo; vencimiento efectivo sin depender del reloj del navegador |
| 4. Cobro manual y experiencia, 1–2 días | Reutilizar admin; vista “Mi plan”; comprobación manual de pago, renovación y vencimiento | Panel admin; nueva vista de cuenta | Solo administrador activa pago; maestro consulta su plan; no hay activación automática por pulsar WhatsApp |
| 5. Optimización y respaldo, 2–3 días | Medir consultas, índices y RLS; validar dumps y restauración; métricas agregadas | Migraciones; scripts de backup; manual operativo | Aislamiento preservado; restauración ensayada; medición antes/después documentada |
| 6. Validación y salida, 2–3 días | Pruebas funcionales y carga; alojamiento comercial; revisión de Preview y liberación gradual | Pruebas; checklist; configuración de proveedores | Puertas de lanzamiento satisfechas y reversión preparada |

Estimación orientativa: 11–19 días laborables de ejecución secuencial, sujeta al esfuerzo de integración y los defectos encontrados. La fecha de octubre debe condicionarse a los criterios de salida, sin prometer un día exacto.

### Diseño propuesto para las suscripciones

- Catálogo versionado de cuatro planes; precio cobrado y duración guardados en cada evento para que futuros cambios no alteren el historial.
- Una identidad canónica user_id, vinculada a Auth. Resolver registros por correo solo en conciliación administrativa validada, no como mecanismo permanente de titularidad.
- Suscripción con estados explícitos: gratuita, activa, vencida y suspendida; fecha de inicio y fin del período. “Pendiente de pago” pertenece a la solicitud de pago y no concede acceso pagado.
- Tabla de pagos manuales con moneda DOP, importe, referencia única, estado, administrador confirmante y fecha; historial de cambios inmutable para el maestro.
- Nueva cuenta: plan Gratis explícito o resolución segura equivalente. Si falla la lectura del estado, no conceder privilegios pagados; mostrar un error recuperable.
- Tiempo autoritativo del servidor. Definir vigencia en America/Santo_Domingo; incluir último día pactado y probar fines de mes/año bisiesto. Renovación anticipada se acumula desde el fin vigente; vencida se inicia en la fecha acordada de reactivación. Repetir confirmación no duplica períodos.
- Propuesta al vencer: conservar datos y permitir consulta/exportación propia; restringir nuevas escrituras pagadas. La suspensión administrativa necesita una regla distinta según motivo. Esta propuesta debe acordarse antes de modificar el bloqueo actual.
- Limitar Gratis en servidor/base con transacción y bloqueo por cuenta para evitar carreras. Cubrir altas, importaciones, cambios de propietario y reactivación de registros archivados; no borrar datos para encajar en el plan.
- Los permisos comerciales complementan la propiedad actual. Nunca sustituir aislamiento por una mera comprobación de usuario autenticado.
- No usar user_metadata editable para roles. Toda función privilegiada debe tener justificación, acceso mínimo y comprobaciones de identidad; preferir ejecución con permisos del usuario.
- La clave service_role no debe llegar al navegador. Los cambios de rol requieren gestión de sesiones y credenciales vigentes.
- Nueva migración creada con CLI, probada en local y versionada; ninguna migración de ensayo sobre la base utilizada por maestros.

## 8. Validaciones obligatorias de la implementación futura

| Prueba | Resultado esperado |
|---|---|
| Maestro A contra datos de B, por interfaz y API | Lectura/escritura ajenas rechazadas |
| Maestro cambia plan/rol/fecha/pago directamente | Rechazado; sin escalada de privilegios |
| Gratis: sección 2 o estudiante 16 | Rechazo consistente, también en importación y dos peticiones simultáneas |
| Cuenta sin fila, error de consulta, fecha futura | Sin acceso pagado accidental; error explicable |
| Suscripción vencida con sesión abierta | Se aplica regla de servidor sin esperar recarga o cambiar reloj |
| Renovación duplicada, anticipada y fin de mes | Importes/períodos correctos y sin duplicados |
| Beta con más de 15 estudiantes | Datos preservados; política de transición explícita |
| Primaria y secundaria | Mismo criterio comercial; notas, asistencias y boletines conservan comportamiento académico |
| Backup restaurado en entorno aislado | Relaciones, identidades y archivos recuperables; RLS y permisos revisados |
| Carga sintética de 500 cuentas | Ensayos de 25, 50 y 100 usuarios simultáneos, no 500 conexiones obligatorias |

Metas iniciales propuestas para carga: p95 menor de 2 segundos en operaciones interactivas normales, errores menores del 1%, ninguna pérdida de escritura ni acceso cruzado. Medir cargas masivas y reportes aparte. Ejecutar en entorno aislado, con subida gradual y condiciones de parada; estas metas aún no se han probado.

## 9. Operación y escalado

Revisión semanal al iniciar: cuentas registradas y activas, suscripciones cobradas, datos nuevos, base/disco, egress por servicio, errores, p95 y respaldo reciente. Contabilizar el consumo compartido de tienda y otros proyectos cuando corresponda.

Umbrales operativos propuestos, no límites oficiales adicionales: revisar al 70% y preparar cambio al 85% de una cuota; para 500 MB de Free, 350 y 425 MB aproximadamente. Aplicar también a transferencia y archivos. Mantener alertas tempranas; no esperar al bloqueo.

Pasar Supabase a Pro cuando los respaldos/continuidad requeridos o el consumo lo justifiquen y financiarlo con cobros reales. Aumentar cómputo solo después de optimizar consultas y verificar presión persistente de CPU/memoria o latencia. Configurar presupuesto y acciones de gasto de Vercel; un corte automático puede detener el servicio. Spend Cap de Supabase tampoco debe interpretarse como techo universal de toda la factura.

Antes de liberar: respaldo comprobado, migración aditiva compatible, revisión de Preview, decisión de alojamiento comercial y validación de todos los casos críticos. Liberar primero a un grupo pequeño de maestros. Ante incidentes, revertir aplicación al despliegue anterior y conservar esquema aditivo; no eliminar tablas ni restaurar una copia sobre datos recientes sin evaluar pérdidas.

## 10. Decisiones pendientes y entregado

Decisiones de negocio a cerrar al comenzar la fase 1: capacidades exactas de “avanzadas”; trato de cuentas beta; período de cortesía si existe; alcance del soporte; regla de vencimiento/suspensión; catálogo definitivo y método de conciliación de pagos.

Decisiones operativas: Vercel Pro u otro alojamiento comercial, separación de unapa-web, ubicación/retención de respaldos y responsable de revisión semanal. Preparar configuración revisable antes de contratar o transferir recursos.

Entregado: informe y backlog en rama documental basada en staging, con evidencia de conectores y código. No se contrataron planes, transfirieron proyectos, modificaron políticas ni activaron cobros. No se ejecutó una prueba funcional o de carga: los criterios anteriores son trabajo futuro.

## 11. Fuentes y trazabilidad

Fuentes de proyecto: conectores de Supabase (organización, SQL agregado, políticas y asesores); Vercel (equipo, proyecto, despliegues, errores de 24 h); GitHub (árbol, comparación de ramas y archivos citados).

- [Código base revisado](https://github.com/jbacker-gif/registro-eline/tree/b11b56f5dc2d067cd9b1a38ed2fdb00d6aeed79a).
- [Comparación main y staging](https://github.com/jbacker-gif/registro-eline/compare/main...staging).
- [Planes de Supabase](https://supabase.com/pricing).
- [Facturación por organización](https://supabase.com/docs/guides/platform/billing-on-supabase).
- [Transferencias entre organizaciones](https://supabase.com/docs/guides/platform/project-transfer).
- [Respaldos](https://supabase.com/docs/guides/platform/backups).
- [Vercel Hobby: uso no comercial](https://vercel.com/docs/plans/hobby).
- [Vercel Pro: tarifa y consumo](https://vercel.com/docs/plans/pro-plan).
- [Claves foráneas sin índice](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).
- [Evaluación de autenticación en RLS](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan).
- [Políticas permisivas múltiples](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies).
- [Protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
