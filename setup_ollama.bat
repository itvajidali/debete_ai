@echo off
echo Pulling Mistral model for Ollama...
ollama pull mistral
echo.
echo Model pulled! 
echo Ensure Ollama is running (it usually runs in the system tray).
echo You can now run run_app.bat to start the debate app.
pause
