@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe
echo Done. You can now run run_app.bat again.
pause
