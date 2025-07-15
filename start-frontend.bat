@echo off
echo Iniciando frontend del Sistema POA-PACC-Presupuesto...
echo.

cd /d "%~dp0frontend"

echo Verificando dependencias...
if not exist "node_modules\" (
    echo Instalando dependencias de Node.js...
    call npm install
)

echo.
echo Iniciando servidor de desarrollo...
echo El frontend estará disponible en http://localhost:5173
echo Para detener el servidor, presione Ctrl+C
echo.

call npm run dev

pause
