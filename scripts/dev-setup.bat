@echo off
REM
REM Development setup script for Christ Medical (Windows)
REM This script is idempotent - safe to run multiple times
REM

setlocal enabledelayedexpansion

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "PROJECT_ROOT=%SCRIPT_DIR%\.."

REM Banner
echo.
echo [96m╔═══════════════════════════════════════════════════════╗[0m
echo [96m║                                                       ║[0m
echo [96m║     [95mChrist Medical - Development Setup[96m          ║[0m
echo [96m║                                                       ║[0m
echo [96m╚═══════════════════════════════════════════════════════╝[0m
echo.

REM Check if we're in a git repository
if not exist "%PROJECT_ROOT%\.git" (
    echo [91m❌ Error: Not a git repository[0m
    echo [93mPlease run this script from the project root directory[0m
    exit /b 1
)

echo [94m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo [94m  Step 1: Checking Git Hooks[0m
echo [94m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo.

REM Run the hook installation script
if exist "%SCRIPT_DIR%\install-hooks.bat" (
    call "%SCRIPT_DIR%\install-hooks.bat"
    set HOOKS_EXIT_CODE=!errorlevel!
    
    if !HOOKS_EXIT_CODE! equ 0 (
        echo.
        echo [92m✓[0m Git hooks check complete
    ) else (
        echo.
        echo [91m❌[0m Git hooks installation failed
        exit /b 1
    )
) else (
    echo [91m❌ Error: install-hooks.bat not found[0m
    exit /b 1
)

echo.
echo [94m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo [94m  Step 2: Verifying Setup[0m
echo [94m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo.

REM Verify hooks are installed
set HOOKS_INSTALLED=0
if exist "%PROJECT_ROOT%\.git\hooks\pre-commit" (
    echo [92m✓[0m pre-commit hook is installed
    set /a HOOKS_INSTALLED+=1
) else (
    echo [91m❌[0m pre-commit hook is missing
)

if exist "%PROJECT_ROOT%\.git\hooks\pre-push" (
    echo [92m✓[0m pre-push hook is installed
    set /a HOOKS_INSTALLED+=1
) else (
    echo [91m❌[0m pre-push hook is missing
)

echo.
echo [96m╔═══════════════════════════════════════════════════════╗[0m
if !HOOKS_INSTALLED! equ 2 (
    echo [96m║  [92m✓ Setup Complete - All checks passed![96m              ║[0m
) else (
    echo [96m║  [91m❌ Setup Incomplete - Some checks failed[96m            ║[0m
)
echo [96m╚═══════════════════════════════════════════════════════╝[0m
echo.

REM Summary
echo Summary:
echo   • Git hooks installed: [92m!HOOKS_INSTALLED!/2[0m
echo.
echo [93mNote:[0m This script is idempotent. You can run it multiple times safely.
echo.

if !HOOKS_INSTALLED! equ 2 (
    exit /b 0
) else (
    exit /b 1
)
