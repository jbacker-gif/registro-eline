param(
  [ValidateSet("linked", "local", "db-url")]
  [string]$Target = "linked",

  [ValidateSet("supabase-cli", "pg-dump")]
  [string]$DumpTool = "supabase-cli",

  [string]$DbUrl = $env:SUPABASE_DB_URL,
  [string]$DbHost = $env:SUPABASE_DB_HOST,
  [string]$DbPort = $env:SUPABASE_DB_PORT,
  [string]$DbName = $env:SUPABASE_DB_NAME,
  [string]$DbUser = $env:SUPABASE_DB_USER,
  [string]$DbPassword = $env:SUPABASE_DB_PASSWORD,
  [string]$Schema = "public",
  [string]$OutputDir = "supabase/backups",

  [switch]$SkipRoles,
  [switch]$SkipData,
  [switch]$UseCopy
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $ProjectRoot

function Invoke-Supabase {
  param([string[]]$Arguments)

  $supabase = Get-Command "supabase" -ErrorAction SilentlyContinue
  if ($supabase) {
    & $supabase.Source @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Supabase CLI fallo con codigo $LASTEXITCODE al ejecutar: supabase $($Arguments -join ' ')"
    }
    return
  }

  $npx = Get-Command "npx.cmd" -ErrorAction SilentlyContinue
  if (-not $npx) {
    $npx = Get-Command "npx" -ErrorAction SilentlyContinue
  }

  if (-not $npx) {
    throw "No se encontro Supabase CLI ni npx. Instala Supabase CLI o ejecuta este script en un entorno con Node/npm."
  }

  & $npx.Source --yes supabase@latest @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Supabase CLI fallo con codigo $LASTEXITCODE al ejecutar: npx --yes supabase@latest $($Arguments -join ' ')"
  }
}

function Join-Args {
  param([string[]]$Left, [string[]]$Right)
  return @($Left + $Right)
}

function Invoke-ExternalCommand {
  param(
    [string]$Executable,
    [string[]]$Arguments,
    [string]$Password
  )

  $previousPgPassword = $env:PGPASSWORD
  if (-not [string]::IsNullOrWhiteSpace($Password)) {
    $env:PGPASSWORD = $Password
  }

  & $Executable @Arguments
  $exitCode = $LASTEXITCODE

  if ($null -eq $previousPgPassword) {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
  } else {
    $env:PGPASSWORD = $previousPgPassword
  }

  if ($exitCode -ne 0) {
    $safeArguments = @()
    foreach ($argument in $Arguments) {
      if ($argument -eq $DbUrl) {
        $safeArguments += "<SUPABASE_DB_URL>"
      } else {
        $safeArguments += $argument
      }
    }

    throw "$Executable fallo con codigo $exitCode al ejecutar: $Executable $($safeArguments -join ' ')"
  }
}

function Get-SchemaArgs {
  $args = @()
  foreach ($schemaName in ($Schema -split ",")) {
    $trimmed = $schemaName.Trim()
    if (-not [string]::IsNullOrWhiteSpace($trimmed)) {
      $args += @("--schema", $trimmed)
    }
  }

  return $args
}

function Get-PgDumpPath {
  $pgDump = Get-Command "pg_dump.exe" -ErrorAction SilentlyContinue
  if (-not $pgDump) {
    $pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
  }

  if ($pgDump) {
    return $pgDump.Source
  }

  $candidatePaths = @(
    "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
  )

  foreach ($candidatePath in $candidatePaths) {
    if (Test-Path $candidatePath) {
      return $candidatePath
    }
  }

  return $null
}

function Get-ProjectRefHint {
  $envFile = Join-Path $ProjectRoot ".env.local"
  if (-not (Test-Path $envFile)) {
    return $null
  }

  $envText = Get-Content -Raw $envFile
  if ($envText -match "NEXT_PUBLIC_SUPABASE_URL=https://([^.]+)\.supabase\.co") {
    return $Matches[1]
  }

  return $null
}

function Get-EnvFileValue {
  param([string]$Name)

  $envFile = Join-Path $ProjectRoot ".env.local"
  if (-not (Test-Path $envFile)) {
    return $null
  }

  foreach ($line in Get-Content $envFile) {
    if ($line -match "^\s*$([regex]::Escape($Name))\s*=\s*(.+?)\s*$") {
      return $Matches[1].Trim('"').Trim("'")
    }
  }

  return $null
}

if ([string]::IsNullOrWhiteSpace($DbUrl)) {
  $DbUrl = Get-EnvFileValue "SUPABASE_DB_URL"
}

if ([string]::IsNullOrWhiteSpace($DbHost)) {
  $DbHost = Get-EnvFileValue "SUPABASE_DB_HOST"
}

if ([string]::IsNullOrWhiteSpace($DbPort)) {
  $DbPort = Get-EnvFileValue "SUPABASE_DB_PORT"
}

if ([string]::IsNullOrWhiteSpace($DbName)) {
  $DbName = Get-EnvFileValue "SUPABASE_DB_NAME"
}

if ([string]::IsNullOrWhiteSpace($DbUser)) {
  $DbUser = Get-EnvFileValue "SUPABASE_DB_USER"
}

if ([string]::IsNullOrWhiteSpace($DbPassword)) {
  $DbPassword = Get-EnvFileValue "SUPABASE_DB_PASSWORD"
}

switch ($Target) {
  "linked" {
    $projectRefFile = Join-Path $ProjectRoot "supabase/.temp/project-ref"
    if (-not (Test-Path $projectRefFile)) {
      $projectRef = Get-ProjectRefHint
      $linkCommand = if ($projectRef) {
        "npx --yes supabase@latest link --project-ref $projectRef"
      } else {
        "npx --yes supabase@latest link --project-ref <project-ref>"
      }

      throw "El proyecto no esta enlazado con Supabase. Ejecuta desde el root del proyecto: $linkCommand"
    }

    $targetArgs = @("--linked")
  }
  "local" { $targetArgs = @("--local") }
  "db-url" {
    $hasDbParts = -not [string]::IsNullOrWhiteSpace($DbHost) -and
      -not [string]::IsNullOrWhiteSpace($DbUser) -and
      -not [string]::IsNullOrWhiteSpace($DbPassword)

    if ([string]::IsNullOrWhiteSpace($DbUrl) -and -not $hasDbParts) {
      throw "Para Target=db-url debes pasar -DbUrl, definir SUPABASE_DB_URL, o definir SUPABASE_DB_HOST/SUPABASE_DB_USER/SUPABASE_DB_PASSWORD."
    }
    $targetArgs = @("--db-url", $DbUrl)
  }
}

if ($DumpTool -eq "pg-dump" -and $Target -ne "db-url") {
  throw "DumpTool=pg-dump requiere Target=db-url y una cadena de conexion en -DbUrl o SUPABASE_DB_URL."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $OutputDir $timestamp
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$schemaFile = Join-Path $backupDir "schema.sql"
$rolesFile = Join-Path $backupDir "roles.sql"
$dataFile = Join-Path $backupDir "data.sql"
$manifestFile = Join-Path $backupDir "manifest.json"

Write-Host "Creando backup de Supabase en $backupDir"

if ($DumpTool -eq "supabase-cli") {
  Invoke-Supabase (Join-Args @("db", "dump") ($targetArgs + @("--schema", $Schema, "--file", $schemaFile)))

  if (-not $SkipRoles) {
    Invoke-Supabase (Join-Args @("db", "dump") ($targetArgs + @("--role-only", "--file", $rolesFile)))
  }

  if (-not $SkipData) {
    $dataArgs = $targetArgs + @("--data-only", "--schema", $Schema, "--file", $dataFile)
    if ($UseCopy) {
      $dataArgs += "--use-copy"
    }
    Invoke-Supabase (Join-Args @("db", "dump") $dataArgs)
  }
} else {
  $pgDump = Get-PgDumpPath
  if (-not $pgDump) {
    throw "No se encontro pg_dump. Instala PostgreSQL client tools o usa DumpTool=supabase-cli con Docker Desktop."
  }

  $schemaArgs = Get-SchemaArgs
  $connectionArgs = if (-not [string]::IsNullOrWhiteSpace($DbHost)) {
    $resolvedDbPort = if ([string]::IsNullOrWhiteSpace($DbPort)) { "5432" } else { $DbPort }
    $resolvedDbName = if ([string]::IsNullOrWhiteSpace($DbName)) { "postgres" } else { $DbName }
    @("--host", $DbHost, "--port", $resolvedDbPort, "--username", $DbUser, "--dbname", $resolvedDbName)
  } else {
    @($DbUrl)
  }

  Invoke-ExternalCommand $pgDump (@("--schema-only") + $schemaArgs + @("--file", $schemaFile) + $connectionArgs) $DbPassword

  if (-not $SkipRoles) {
    $rolesNote = @"
Roles no exportados en modo pg-dump.
Supabase administra la mayoria de roles del proyecto. Si tienes roles personalizados, exportalos manualmente desde un entorno con pg_dumpall o usa DumpTool=supabase-cli con Docker Desktop.
"@
    Set-Content -Encoding UTF8 -Path $rolesFile -Value $rolesNote
  }

  if (-not $SkipData) {
    Invoke-ExternalCommand $pgDump (@("--data-only") + $schemaArgs + @("--file", $dataFile) + $connectionArgs) $DbPassword
  }
}

$manifest = [ordered]@{
  createdAt = (Get-Date).ToString("o")
  target = $Target
  schema = $Schema
  files = [ordered]@{
    schema = "schema.sql"
    roles = if ($SkipRoles) { $null } else { "roles.sql" }
    data = if ($SkipData) { $null } else { "data.sql" }
  }
  notes = "No subas esta carpeta al repositorio: puede contener datos sensibles."
}

$manifest | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 -Path $manifestFile

foreach ($expectedFile in @($schemaFile, $rolesFile, $dataFile)) {
  if (($expectedFile -eq $rolesFile -and $SkipRoles) -or ($expectedFile -eq $dataFile -and $SkipData)) {
    continue
  }

  if (-not (Test-Path $expectedFile)) {
    throw "El backup no se completo: falta el archivo esperado $expectedFile"
  }
}

Write-Host "Backup completado:"
Write-Host "  $backupDir"
