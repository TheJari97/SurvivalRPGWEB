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

$migration = Join-Path $root "supabase\migrations\20260426153500_initial_schema.sql"
if (-not (Test-Path -LiteralPath $migration)) {
  throw "Migration file not found: $migration"
}

& $psql $url -v ON_ERROR_STOP=1 -q -f $migration
Write-Output "MIGRATION_APPLIED=YES"
