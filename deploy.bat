@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting JesusLetter deployment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker-compose is not installed. Please install docker-compose and try again.
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # Application Configuration
        echo APP_NAME=JesusLetter
        echo APP_VERSION=1.0.0
        echo NODE_ENV=production
        echo PORT=3001
        echo.
        echo # AI Service API Keys ^(Please update with your actual keys^)
        echo GEMINI_API_KEY=your-gemini-api-key-here
        echo OPENAI_API_KEY=your-openai-api-key-here
        echo.
        echo # Server Configuration
        echo CORS_ORIGIN=http://localhost:3000
        echo JWT_SECRET=your-jwt-secret-key-here
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # Logging
        echo LOG_LEVEL=info
        echo.
        echo # Frontend Configuration
        echo VITE_API_BASE_URL=http://localhost:3001/api
        echo VITE_APP_NAME=JesusLetter
        echo VITE_APP_VERSION=1.0.0
    ) > .env
    echo ⚠️  Please update the API keys in .env file before running the application
)

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose down --remove-orphans

REM Build and start containers
echo 🔨 Building and starting containers...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    echo ❌ Deployment failed. Check logs with: docker-compose logs
    exit /b 1
) else (
    echo ✅ Deployment successful!
    echo.
    echo 🌐 Frontend: http://localhost:3000
    echo 🔧 Backend API: http://localhost:3001/api
    echo ❤️  Health Check: http://localhost:3001/api/health
    echo.
    echo 📋 To view logs: docker-compose logs -f
    echo 🛑 To stop: docker-compose down
)