@echo off
setlocal
cd /d "%~dp0"
title Quizzhub - serveur local
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -c "import fastapi, uvicorn, sqlalchemy, pymysql, dotenv" >nul 2>&1
  if not errorlevel 1 goto launch
)
where uv >nul 2>&1
if not errorlevel 1 (
  if not exist ".venv\Scripts\python.exe" uv venv .venv
  uv pip install --python ".venv\Scripts\python.exe" -r requirements.txt
  if errorlevel 1 goto error
  goto launch
)
python -m venv .venv
if errorlevel 1 goto error
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto error
:launch
echo.
echo Quizzhub : http://127.0.0.1:8000
echo Gardez cette fenetre ouverte. Ctrl+C pour arreter.
".venv\Scripts\python.exe" lancer.py
if errorlevel 1 goto error
exit /b 0
:error
echo.
echo Demarrage impossible. Consultez le message ci-dessus et README.md.
echo Python 3.10 minimum et une connexion Internet sont requis a la premiere installation.
pause
exit /b 1
