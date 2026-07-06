Get-ChildItem app/schemas/*.py | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Remove json_encoders with lambdas
    $content = $content -replace ',?\s*json_encoders=\{[^}]+\}', ''
    
    # Fix default_factory lambdas for lists
    $content = $content -replace 'default_factory\s*=\s*lambda:\s*\[[^\]]+\]', 'default_factory=list'
    
    # Fix ConfigDict syntax errors
    $content = $content -replace 'ConfigDict\(\s*,\s*\)', 'ConfigDict(from_attributes=True)'
    $content = $content -replace 'ConfigDict\(\s*,\s*', 'ConfigDict('
    $content = $content -replace ',\s*\)', ')'
    
    $content | Set-Content $_.FullName -Encoding UTF8
}

Write-Host "✅ Removed ALL lambdas!" -ForegroundColor Green
