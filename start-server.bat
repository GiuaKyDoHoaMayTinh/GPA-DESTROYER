@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
title GPA Destroyer - server :3333

REM Vao thu muc chua file .bat (can CRLF - dung Notepad luu neu bat van chay sai)
cd /d "%~dp0"
if errorlevel 1 (
  echo Loi: khong doi duoc o dia/thu muc goc.
  pause
  exit /b 1
)

if not exist "server\package.json" (
  echo Khong tim thay server\package.json
  echo Dat start-server.bat ngang hang voi thu muc server - cung thu muc cha.
  echo Hien tai: "%CD%"
  echo Can co file: "%~dp0server\package.json"
  pause
  exit /b 1
)

cd /d "%~dp0server"
if errorlevel 1 (
  echo Loi: khong vao duoc thu muc server.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo Cai Node.js va dam bao npm co trong PATH.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo Khong tim thay node.
  pause
  exit /b 1
)

echo Node:
where node
node -v
node -e "const p=process.versions.node.split('.').map(Number); if(p[0]<22||(p[0]===22&&p[1]<5)){require('console').error('Can Node.js 22.5.0 tro len (co node:sqlite).'); process.exit(1);}"
if errorlevel 1 (
  echo https://nodejs.org/ - cai ban LTS hoac Current moi.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Lan dau: dang cai dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install that bai.
    pause
    exit /b 1
  )
)

echo Mo http://localhost:3333 sau khi server chay.
echo Nhan Ctrl+C de tat server.
echo.
call npm start
echo.
pause
endlocal
