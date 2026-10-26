@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

set "LOG=%~dp0安装依赖日志.txt"
set "NPM=npm"
if exist "C:\Program Files\nodejs\npm.cmd" set "NPM=C:\Program Files\nodejs\npm.cmd"

echo ============================================
echo   安装手机打包依赖（Capacitor）
echo ============================================
echo.
echo 使用：%NPM%
echo 日志：%LOG%
echo 第一次安装可能需要 1-3 分钟，请不要关窗口。
echo.

call "%NPM%" install --no-audit --no-fund > "%LOG%" 2>&1
set "EXITCODE=%ERRORLEVEL%"

echo ------------- 安装输出 -------------
type "%LOG%"
echo ----------------------------------
echo.

if not "%EXITCODE%"=="0" (
  echo [失败] npm install 返回 %EXITCODE%
  echo 请把窗口里的报错或 %LOG% 发给 AI。
  pause
  exit /b %EXITCODE%
)

if exist "node_modules\@capacitor\core\package.json" (
  echo [完成] Capacitor 依赖已安装。
  echo 回到 Qoder 回复「装好了」。
) else (
  echo [异常] npm 返回成功，但没找到 @capacitor/core。
  echo 请把 %LOG% 发给 AI。
)
pause
