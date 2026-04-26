$ErrorActionPreference = "Stop"

function Read-EnvFile($Path) {
  $envMap = @{}
  foreach ($raw in Get-Content -LiteralPath $Path) {
    $line = $raw.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { continue }
    $idx = $line.IndexOf("=")
    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()
    if (($value.StartsWith("'") -and $value.EndsWith("'")) -or ($value.StartsWith('"') -and $value.EndsWith('"'))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $envMap[$key] = $value
  }
  return $envMap
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$envMap = Read-EnvFile (Join-Path $root ".env.local")
$url = $envMap["DATABASE_POOLER_URL"]

if (-not $url -or $url -match "replace_me|PON_AQUI|YOUR-PASSWORD") {
  throw "DATABASE_POOLER_URL is empty or still has a placeholder."
}

$uri = [Uri]$url
if (-not ($uri.Host -like "*pooler.supabase.com" -or $uri.Port -eq 6543)) {
  throw "DATABASE_POOLER_URL does not look like Transaction pooler. Current host: $($uri.Host), port: $($uri.Port)."
}

$psqlCandidates = @(
  "C:\Program Files\PostgreSQL\18\bin\psql.exe",
  "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe"
)
$psql = $psqlCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $psql) {
  throw "psql.exe was not found. Install PostgreSQL client tools or adjust this script."
}

$migrationDir = Join-Path $root "supabase\migrations"
if (-not (Test-Path -LiteralPath $migrationDir)) {
  throw "Migration directory not found: $migrationDir"
}

$migrations = Get-ChildItem -LiteralPath $migrationDir -Filter "*.sql" | Sort-Object Name
if (-not $migrations) {
  throw "No migration files found in $migrationDir"
}

foreach ($migration in $migrations) {
  Write-Output "APPLYING_MIGRATION=$($migration.Name)"
  & $psql $url -v ON_ERROR_STOP=1 -q -f $migration.FullName
}

Write-Output "MIGRATIONS_APPLIED=$($migrations.Count)"
