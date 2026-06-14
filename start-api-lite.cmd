@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-api-lite.ps1" %*
exit /b %ERRORLEVEL%
