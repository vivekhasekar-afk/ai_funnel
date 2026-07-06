Write-Host "🔍 DISCOVERING API ROUTES..." -ForegroundColor Cyan
$baseUrl = "http://localhost:8000"

$testPaths = @(
    "/auth/signup",
    "/auth/login",
    "/users/me",
    "/funnels",
    "/api/auth/signup",
    "/api/auth/login",
    "/v1/auth/signup",
    "/v1/auth/login"
)

foreach ($path in $testPaths) {
    try {
        $resp = Invoke-WebRequest -Uri "$baseUrl$path" -UseBasicParsing -ErrorAction Stop -TimeoutSec 2
        Write-Host "✅ 200/201: $path" -ForegroundColor Green
    } catch {
        $code = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "TIMEOUT" }
        Write-Host "  $code`: $path" -ForegroundColor Gray
    }
}

Write-Host "`n📱 OPEN BROWSER: http://localhost:8000/docs" -ForegroundColor Yellow
