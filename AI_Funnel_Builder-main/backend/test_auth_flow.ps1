# SIMPLEST POSSIBLE TEST - NO EMOJIS, NO TRICKS
Write-Host "Testing API..." 

$baseUrl = "http://localhost:8000/api/v1"

# 1. Health
$health = iwr "$baseUrl/health/health" -UseBasicParsing
Write-Host "Health: " $health.StatusCode

# 2. Signup
$email = "test-simple@demo.com"
$body = @{email=$email; password="TestPass123!"; password_confirm="TestPass123!"; name="Test"; user_type="creator"} | ConvertTo-Json
$signup = iwr "$baseUrl/auth/signup" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
Write-Host "Signup: " $signup.StatusCode

# 3. Login
$loginBody = @{email=$email; password="TestPass123!"} | ConvertTo-Json
$login = iwr "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -UseBasicParsing
Write-Host "Login: " $login.StatusCode

if ($login.StatusCode -eq 200) {
    $tokens = $login.Content | ConvertFrom-Json
    $token = $tokens.access_token
    Write-Host "TOKEN: " $token.Substring(0,20)

    # Test protected
    $headers = @{"Authorization"="Bearer $token"}
    $me = iwr "$baseUrl/users/me" -Headers $headers -UseBasicParsing
    Write-Host "Users/me: " $me.StatusCode
}
