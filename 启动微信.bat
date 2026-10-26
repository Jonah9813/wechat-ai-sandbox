@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title 微信 AI 沙盒

where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 20 或更高版本。
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 首次运行，正在安装依赖，请稍候...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请检查网络后重试。
        pause
        exit /b 1
    )
)

rem 先探测最多 4 轮（每轮 3 秒超时），避免重复双击或服务正在启动时误判
powershell -NoProfile -Command "$ok = $false; for ($i = 0; $i -lt 4; $i++) { try { $r = Invoke-RestMethod -Uri 'http://localhost:5180/api/health' -TimeoutSec 3; if ($r.ok) { $ok = $true; break } } catch {}; Start-Sleep -Milliseconds 600 }; if ($ok) { exit 0 } else { exit 1 }"
if not errorlevel 1 goto :ready
goto :start

:ready
echo 服务已在运行，正在打开浏览器...
start "" "http://localhost:5180/chats"
exit /b 0

:start
echo 正在启动微信 AI 沙盒...
echo 浏览器会在服务就绪后自动打开，关闭本窗口即可停止服务。
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 120;$i++){try{$r=Invoke-RestMethod -Uri 'http://localhost:5180/api/health' -TimeoutSec 1; if($r.ok){Start-Process 'http://localhost:5180/chats'; break}}catch{}; Start-Sleep -Milliseconds 500}"

call npm run dev
if errorlevel 1 (
    echo.
    echo [错误] 服务启动失败。常见原因：5180 端口被其他程序占用，或依赖没有装好。
    echo 请把上面的报错内容截图发给开发者。
    pause
)
endlocal
