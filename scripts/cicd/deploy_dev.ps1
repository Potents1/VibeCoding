param(
    [Parameter(Mandatory = $true)]
    [string]$ArtifactZip,
    [Parameter(Mandatory = $true)]
    [string]$DeployRoot,
    [Parameter(Mandatory = $true)]
    [string]$ReleaseId
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ArtifactZip)) {
    throw "Artifact zip not found: $ArtifactZip"
}

$deployRootResolved = [System.IO.Path]::GetFullPath($DeployRoot)
$releasesDir = Join-Path $deployRootResolved "releases"
$currentDir = Join-Path $deployRootResolved "current"
$backupDir = Join-Path $deployRootResolved "backup"
$releaseDir = Join-Path $releasesDir $ReleaseId
$metaDir = Join-Path $deployRootResolved "meta"
$currentMarker = Join-Path $metaDir "current_release.txt"
$historyMarker = Join-Path $metaDir "release_history.log"

New-Item -ItemType Directory -Force -Path $deployRootResolved | Out-Null
New-Item -ItemType Directory -Force -Path $releasesDir | Out-Null
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path $metaDir | Out-Null

if (Test-Path -LiteralPath $releaseDir) {
    Remove-Item -Recurse -Force -LiteralPath $releaseDir
}
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

Expand-Archive -Path $ArtifactZip -DestinationPath $releaseDir -Force

if (Test-Path -LiteralPath $currentDir) {
    $backupCurrent = Join-Path $backupDir ("current-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
    New-Item -ItemType Directory -Force -Path $backupCurrent | Out-Null
    robocopy $currentDir $backupCurrent /E /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -gt 7) {
        throw "Backup copy failed with robocopy code: $LASTEXITCODE"
    }
    Remove-Item -Recurse -Force -LiteralPath $currentDir
}

New-Item -ItemType Directory -Force -Path $currentDir | Out-Null
robocopy $releaseDir $currentDir /E /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -gt 7) {
    throw "Current deployment copy failed with robocopy code: $LASTEXITCODE"
}

Set-Content -Path $currentMarker -Value $ReleaseId -Encoding UTF8
Add-Content -Path $historyMarker -Value ("{0} {1}" -f (Get-Date -Format "s"), $ReleaseId)

Write-Host "Deployment completed."
Write-Host "DeployRoot: $deployRootResolved"
Write-Host "ReleaseId: $ReleaseId"
Write-Host "CurrentDir: $currentDir"
