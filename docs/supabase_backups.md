# Backups de Supabase

Este proyecto incluye un script para crear backups logicos de la base de datos de Supabase con `supabase db dump`.

## Requisitos

- Tener Node/npm disponible.
- Tener el proyecto enlazado con Supabase (`supabase link --project-ref <project-ref>`) o definir `SUPABASE_DB_URL`.
- Tener acceso a la clave o password de la base remota si la CLI la solicita.

Si la CLI de Supabase no esta instalada globalmente, el script usa `npx --yes supabase@latest`.

Para este proyecto, el ref detectado desde `.env.local` es `gaitpdremkesyvsyddhn`. Puedes enlazarlo con:

```powershell
npx --yes supabase@latest link --project-ref gaitpdremkesyvsyddhn
```

En Windows, `supabase db dump` puede requerir Docker Desktop. Si no quieres depender de Docker para el backup diario, usa el modo `pg-dump` con PostgreSQL client tools instalado y una cadena de conexion en `SUPABASE_DB_URL`.

## Crear un backup

Backup del proyecto remoto enlazado:

```powershell
npm run backup:supabase
```

Backup con una URL de Postgres:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-supabase.ps1 -Target db-url -DbUrl "<postgres-url>"
```

Backup sin Docker usando `pg_dump`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-supabase.ps1 -Target db-url -DumpTool pg-dump -DbUrl "<postgres-url>"
```

Para dejar la URL disponible para la tarea programada:

```powershell
setx SUPABASE_DB_URL "<postgres-url>"
```

Tambien puedes guardarla en `.env.local`:

```env
SUPABASE_DB_URL="postgresql://postgres.<project-ref>:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

Backup local:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-supabase.ps1 -Target local
```

Por defecto se crean tres archivos dentro de `supabase/backups/<fecha>/`:

- `schema.sql`: estructura de la base.
- `roles.sql`: roles personalizados.
- `data.sql`: datos del esquema `public`.
- `manifest.json`: resumen del backup.

La carpeta `supabase/backups/` esta ignorada por git porque puede contener datos sensibles.

## Opciones utiles

Cambiar esquema:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-supabase.ps1 -Schema "public,storage"
```

Omitir datos:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-supabase.ps1 -SkipData
```

Omitir roles:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-supabase.ps1 -SkipRoles
```

Usar `COPY` para exportar datos:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-supabase.ps1 -UseCopy
```

## Restauracion

Para restaurar en otro proyecto, revisa primero los archivos generados y restaura en este orden:

1. `roles.sql`
2. `schema.sql`
3. `data.sql`

Segun la documentacion de Supabase, al restaurar en un proyecto nuevo las tablas pueden heredar privilegios por defecto del destino. Antes de restaurar el esquema, revisa si necesitas revocar privilegios por defecto en el esquema `public`.

## Automatizacion

En Windows, puedes usar el Programador de tareas para ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File C:\ruta\al\proyecto\scripts\backup-supabase.ps1
```

Guarda los backups en una ubicacion segura y con retencion definida. No uses el repositorio git como almacenamiento de backups.
