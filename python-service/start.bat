@echo off
echo ======================================================
echo   DEMARRAGE SERVICE PYTHON
echo ======================================================

cd /d "%~dp0"

if not exist venv\Scripts\activate.bat (
    echo ERREUR: Environnement virtuel non trouve
    pause
    exit /b 1
)

call venv\Scripts\activate

python -m uvicorn app.main:app --reload --port 5000

pause
