# ParentShopee — start both servers in separate windows
Write-Host "Starting ParentShopee..." -ForegroundColor Cyan

# Kill anything on 3001 and 5173 first
Get-NetTCPConnection -LocalPort 3001, 5173 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-Process node, python -ErrorAction SilentlyContinue |
  ForEach-Object { taskkill /PID $_.Id /F /T 2>$null }
Start-Sleep -Seconds 2

# Backend — new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\ravin\Claude\ParentShopee\backend'; python -m uvicorn main:app --host 0.0.0.0 --port 3001" -WindowStyle Normal

# Frontend — new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\ravin\Claude\ParentShopee\frontend'; npm run dev" -WindowStyle Normal

Write-Host "Backend  -> http://localhost:3001  (API + Swagger docs at /docs)" -ForegroundColor Green
Write-Host "Frontend -> http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Close the two opened terminal windows to stop the servers." -ForegroundColor Yellow
