@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo [INFO] Starting JesusLetter Docker redeploy...

REM Ensure we run from the script directory
pushd %~dp0

REM Check if Docker daemon is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and retry.
    popd
    exit /b 1
)

REM Determine Docker Compose command (prefer v2: 'docker compose')
set "DC_CMD=docker compose"
%DC_CMD% version >nul 2>&1
if errorlevel 1 (
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker Compose is not available. Install Docker Compose v2 or v1.
        popd
        exit /b 1
    ) else (
        set "DC_CMD=docker-compose"
    )
)

REM Create .env file if it doesn't exist (minimal defaults)
if not exist ".env" (
    echo [INFO] Creating .env with defaults...
    > ".env" (
        echo NODE_ENV=production
        echo PORT=3001
        echo CORS_ORIGIN=http://localhost:3000
        echo JWT_SECRET=replace-me
        echo GEMINI_API_KEY=
        echo OPENAI_API_KEY=
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo LOG_LEVEL=info
        echo VITE_API_BASE_URL=http://localhost:3001/api
    )
    echo [WARN] Update API keys in .env before production use.
)

echo [INFO] Stopping existing containers...
%DC_CMD% down --remove-orphans

echo [INFO] Building images...
%DC_CMD% build

echo [INFO] Starting services in detached mode...
%DC_CMD% up -d
if errorlevel 1 (
    echo [ERROR] docker compose up failed. Showing last 100 lines of logs:
    %DC_CMD% logs --tail=100
    popd
    exit /b 1
)

echo [INFO] Waiting for backend health...
set "HEALTH_URL=http://localhost:3001/api/health"
for /l %%i in (1,1,30) do (
    powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri '%HEALTH_URL%' -TimeoutSec 2; if ($r.status -eq 'healthy') { exit 0 } else { exit 1 } } catch { exit 1 }"
    if not errorlevel 1 (
        echo [OK] Backend healthy at %HEALTH_URL%
        goto done
    )
    timeout /t 2 >nul
)

echo [WARN] Health check timed out. You can inspect logs via: %DC_CMD% logs -f

:done
echo [INFO] Frontend: http://localhost:3000/
echo [INFO] Backend:  %HEALTH_URL%
popd
exit /b 0