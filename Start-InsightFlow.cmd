@echo off
setlocal
cd /d "%~dp0"
if exist "%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin\docker.exe" set "PATH=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin;%PATH%"
if exist "%ProgramFiles%\Docker\Docker\resources\bin\docker.exe" set "PATH=%ProgramFiles%\Docker\Docker\resources\bin;%PATH%"
where docker >nul 2>nul
if errorlevel 1 goto failed
docker info >nul 2>nul
if not errorlevel 1 goto ready
echo Starting Docker Desktop. Please wait...
powershell -NoProfile -Command "$dockerExe=Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'; if (!(Test-Path -LiteralPath $dockerExe)) { $dockerExe=Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe' }; Start-Process -FilePath $dockerExe -WindowStyle Hidden"
if errorlevel 1 goto failed
for /l %%i in (1,1,60) do (
  docker info >nul 2>nul
  if not errorlevel 1 goto ready
  timeout /t 2 /nobreak >nul
)
goto failed
:ready
call pnpm.cmd db:start
if errorlevel 1 goto failed
call pnpm.cmd db:migrate
if errorlevel 1 goto failed
node -e "fetch('http://localhost:3000',{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
if not errorlevel 1 (
  echo A web server is already running at http://localhost:3000
  pause
  exit /b 0
)
call pnpm.cmd build
if errorlevel 1 goto failed
echo Starting the web server in the background...
powershell -NoProfile -Command "$projectDir=(Get-Location).Path; Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList '--use-env-proxy','node_modules/next/dist/bin/next','start','--hostname','127.0.0.1' -WorkingDirectory $projectDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectDir 'insightflow-server.log') -RedirectStandardError (Join-Path $projectDir 'insightflow-server-error.log')"
if errorlevel 1 goto failed
node -e "(async()=>{for(let i=0;i<30;i++){try{const r=await fetch('http://localhost:3000',{signal:AbortSignal.timeout(2000)});if(r.ok)process.exit(0)}catch{}await new Promise(r=>setTimeout(r,500))}process.exit(1)})()"
if errorlevel 1 goto failed
echo Open http://localhost:3000 in your browser.
echo Local confirmation emails: http://localhost:54324
echo The web server runs in the background. You may close this window.
pause
exit /b 0
:failed
echo Startup failed. Check the message above. Do not delete Docker volumes.
pause
exit /b 1
