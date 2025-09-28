@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Set backup directory with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=!dt:~0,8!_!dt:~8,6!"
set "backup_dir=C:\Users\jose6\Desktop\JesusLetter_backup_!timestamp!"

echo ========================================
echo JesusLetter Project Backup Tool
echo ========================================
echo Backup target: !backup_dir!
echo Start time: %date% %time%
echo ========================================

:: Create backup directory
mkdir "!backup_dir!"
if errorlevel 1 (
    echo Error: Cannot create backup directory
    pause
    exit /b 1
)

:: Copy project files
echo Copying project files...

:: Copy root files
copy "package.json" "!backup_dir!\" >nul 2>&1
copy "package-lock.json" "!backup_dir!\" >nul 2>&1
copy "vite.config.js" "!backup_dir!\" >nul 2>&1
copy "capacitor.config.ts" "!backup_dir!\" >nul 2>&1
copy "README.md" "!backup_dir!\" >nul 2>&1
copy "docker-compose.yml" "!backup_dir!\" >nul 2>&1
copy "nginx.conf" "!backup_dir!\" >nul 2>&1
copy "deploy.bat" "!backup_dir!\" >nul 2>&1
copy "deploy.sh" "!backup_dir!\" >nul 2>&1
copy "Dockerfile.backend" "!backup_dir!\" >nul 2>&1
copy "Dockerfile.frontend" "!backup_dir!\" >nul 2>&1
copy ".env.example" "!backup_dir!\" >nul 2>&1
copy ".gitignore" "!backup_dir!\" >nul 2>&1
copy ".dockerignore" "!backup_dir!\" >nul 2>&1

:: Copy directories
echo Copying src directory...
xcopy "src" "!backup_dir!\src" /E /I /Q >nul 2>&1

echo Copying server directory...
xcopy "server" "!backup_dir!\server" /E /I /Q >nul 2>&1

echo Copying public directory...
xcopy "public" "!backup_dir!\public" /E /I /Q >nul 2>&1

:: Create backup info file
echo Creating backup info...
(
echo JesusLetter Project Backup
echo ==========================
echo Backup time: %date% %time%
echo Source: %cd%
echo Target: !backup_dir!
echo.
echo Included files and directories:
echo - Configuration files (package.json, vite.config.js, etc.)
echo - src/ (frontend source code)
echo - server/ (backend source code)
echo - public/ (static assets)
echo - Docker files
echo - Deploy scripts
echo.
echo Excluded files:
echo - node_modules/
echo - dist/
echo - .git/
echo - temporary files
) > "!backup_dir!\BACKUP_INFO.txt"

echo ========================================
echo Backup completed!
echo Backup location: !backup_dir!
echo Completion time: %date% %time%
echo ========================================

:: Ask if user wants to open backup directory
set /p "open_folder=Open backup directory? (y/n): "
if /i "!open_folder!"=="y" (
    explorer "!backup_dir!"
)

pause