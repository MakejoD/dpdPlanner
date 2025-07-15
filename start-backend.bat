@echo off
echo Iniciando servidor backend del Sistema POA-PACC-Presupuesto...
echo.

cd /d "%~dp0backend"

echo Verificando dependencias...
if not exist "node_modules\" (
    echo Instalando dependencias de Node.js...
    call npm install
)

echo.
echo Iniciando servidor en puerto 3001...
echo Para detener el servidor, presione Ctrl+C
echo.

node src/server.js

pause
