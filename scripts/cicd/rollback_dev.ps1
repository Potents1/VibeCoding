param(
    [Parameter(Mandatory = $true)]
    [string]$DeployRoot
)

$ErrorActionPreference = "Stop"

$deployRootResolved = [System.IO.Path]::GetFullPath($DeployRoot)
$metaDir = Join-Path $deployRootResolved "meta"
$historyMarker = Join-Path $metaDir "release_history.log"
$currentDir = Join-Path $deployRootResolved "current"
$releasesDir = Join-Path $deployRootResolved "releases"
$currentMarker = Join-Path $metaDir "current_release.txt"

if (-not (Test-Path -LiteralPath $historyMarker)) {
    throw "No release history found at $historyMarker"
}

$lines = Get-Content -Path $historyMarker | Where-Object { $_.Trim() -ne "" }
if ($lines.Count -lt 2) {
    throw "Not enough history to rollback (need at least 2 releases)"
}

$previous = ($lines[-2] -split "\s+")[-1]
if (-not $previous) {
    throw "Failed to parse previous release id from history"
}

$previousReleaseDir = Join-Path $releasesDir $previous
if (-not (Test-Path -LiteralPath $previousReleaseDir)) {
    throw "Previous release directory missing: $previousReleaseDir"
}

if (Test-Path -LiteralPath $currentDir) {
    Remove-Item -Recurse -Force -LiteralPath $currentDir
}
New-Item -ItemType Directory -Force -Path $currentDir | Out-Null
robocopy $previousReleaseDir $currentDir /E /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -gt 7) {
    throw "Rollback copy failed with robocopy code: $LASTEXITCODE"
}

Set-Content -Path $currentMarker -Value $previous -Encoding UTF8
Add-Content -Path $historyMarker -Value ("{0} rollback_to:{1}" -f (Get-Date -Format "s"), $previous)

Write-Host "Rollback completed to release: $previous"
