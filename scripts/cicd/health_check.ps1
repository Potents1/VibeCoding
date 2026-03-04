param(
    [Parameter(Mandatory = $false)]
    [string]$Url = "http://127.0.0.1:5000/health",
    [Parameter(Mandatory = $false)]
    [int]$Attempts = 12,
    [Parameter(Mandatory = $false)]
    [int]$DelaySeconds = 5
)

$ErrorActionPreference = "Stop"

for ($i = 1; $i -le $Attempts; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 8
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Write-Host "Health check passed on attempt $i: HTTP $($response.StatusCode)"
            exit 0
        }
    } catch {
        Write-Host "Health check attempt $i failed: $($_.Exception.Message)"
    }
    Start-Sleep -Seconds $DelaySeconds
}

throw "Health check failed after $Attempts attempts for $Url"
