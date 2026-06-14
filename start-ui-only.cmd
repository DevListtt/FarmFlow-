@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-ui-only.ps1" %*
exit /b %ERRORLEVEL%
