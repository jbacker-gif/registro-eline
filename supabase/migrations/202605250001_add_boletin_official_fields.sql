-- Adds fields required by the official primary learning report.
-- Nullable by design so the migration is safe for existing records.

alter table public.estudiantes
  add column if not exists sigerd_id text;

alter table public.colegios
  add column if not exists codigo_centro text,
  add column if not exists telefono_centro text,
  add column if not exists regional_educacion text,
  add column if not exists provincia text,
  add column if not exists municipio text;

