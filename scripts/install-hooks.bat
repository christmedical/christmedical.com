@echo off
REM
REM Idempotent script to install git hooks (Windows)
REM

setlocal enabledelayedexpansion

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "PROJECT_ROOT=%SCRIPT_DIR%\.."
set "HOOKS_SOURCE_DIR=%SCRIPT_DIR%\git-hooks"
set "GIT_HOOKS_DIR=%PROJECT_ROOT%\.git\hooks"

REM Check if we're in a git repository
if not exist "%PROJECT_ROOT%\.git" (
    echo [91m❌ Error: Not a git repository[0m
    exit /b 1
)

REM Create .git/hooks directory if it doesn't exist
if not exist "%GIT_HOOKS_DIR%" mkdir "%GIT_HOOKS_DIR%"

echo [94m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo [94m  Installing Git Hooks[0m
echo [94m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo.

REM Function to install a hook
call :install_hook pre-commit
call :install_hook pre-push

echo.
echo [92m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo [92m  Git hooks installation complete![0m
echo [92m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m

exit /b 0

:install_hook
set "hook_name=%~1"
set "source_file=%HOOKS_SOURCE_DIR%\%hook_name%"
set "target_file=%GIT_HOOKS_DIR%\%hook_name%"

if not exist "%source_file%" (
    echo [93m⚠️  Warning: Source hook file not found: %source_file%[0m
    exit /b 1
)

REM Check if hook already exists
if exist "%target_file%" (
    fc /b "%source_file%" "%target_file%" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [94m✓[0m Hook [92m%hook_name%[0m already installed and up-to-date
        exit /b 0
    ) else (
        echo [93m⚠️  Hook %hook_name% exists but differs. Updating...[0m
    )
) else (
    echo [94m→[0m Installing hook [92m%hook_name%[0m
)

REM Copy the hook
copy /Y "%source_file%" "%target_file%" >nul

echo [92m✓[0m Hook [92m%hook_name%[0m installed successfully
exit /b 0
