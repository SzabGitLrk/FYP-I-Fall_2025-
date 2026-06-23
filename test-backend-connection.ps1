# Test Backend Connection Script

Write-Host "Testing FyndBox Backend Connection..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend port is listening
Write-Host "Test 1: Checking if port 3002 is listening..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr "3002"
if ($portCheck) {
    Write-Host "✓ Port 3002 is LISTENING" -ForegroundColor Green
} else {
    Write-Host "✗ Port 3002 is NOT listening" -ForegroundColor Red
    Write-Host "  Please start the backend server with: npm run start:dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Try to connect to backend
Write-Host "Test 2: Attempting to connect to backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/users/me" -Method Get -Headers @{"Accept"="application/json"} -ErrorAction Stop
    Write-Host "✓ Backend is responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Backend is responding correctly (401 Unauthorized - expected without token)" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend connection failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Check proxy configuration
Write-Host "Test 3: Checking Vite proxy configuration..." -ForegroundColor Yellow
$viteConfig = Get-Content "fyndbox-frontend\vite.config.ts" -Raw
if ($viteConfig -match "target.*3002") {
    Write-Host "✓ Vite proxy is configured for port 3002" -ForegroundColor Green
} else {
    Write-Host "⚠ Vite proxy configuration not found or incorrect" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Check frontend .env
Write-Host "Test 4: Checking frontend environment..." -ForegroundColor Yellow
$frontendEnv = Get-Content "fyndbox-frontend\.env" -Raw
if ($frontendEnv -match "VITE_API_URL.*3002") {
    Write-Host "✓ Frontend .env has correct VITE_API_URL" -ForegroundColor Green
} else {
    Write-Host "⚠ VITE_API_URL not set to port 3002" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Connection test complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the backend is running but image upload still fails:" -ForegroundColor Yellow
Write-Host "1. Restart the backend server (Ctrl+C, then npm run start:dev)" -ForegroundColor White
Write-Host "2. Clear browser cache and reload" -ForegroundColor White
Write-Host "3. Check browser console (F12) for detailed errors" -ForegroundColor White
