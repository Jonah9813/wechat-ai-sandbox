@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "LOG=%~dp0手机工程日志.txt"
set "NPM=npm"
if exist "C:\Program Files\nodejs\npm.cmd" set "NPM=C:\Program Files\nodejs\npm.cmd"
set "BASH=bash"
if exist "C:\Program Files\Git\bin\bash.exe" set "BASH=C:\Program Files\Git\bin\bash.exe"
set "PY=python"
where python >nul 2>nul || set "PY=py"

echo 日志：%LOG%
type nul > "%LOG%"

echo [1/7] 安装依赖
if exist "node_modules\@capacitor\core\package.json" (
  echo 依赖已存在，跳过>> "%LOG%"
) else (
  call "%NPM%" install --no-audit --no-fund >> "%LOG%" 2>&1
  if errorlevel 1 goto :fail
)

echo [2/7] 生成 Android 工程
if exist "android\app\build.gradle" (
  echo android 已存在，跳过 cap add>> "%LOG%"
) else (
  call npx --yes cap add android >> "%LOG%" 2>&1
  if errorlevel 1 goto :fail
)

echo [3/7] 拷入原生插件并修改 Manifest / Gradle
call node scripts\prepare-android.mjs >> "%LOG%" 2>&1
if errorlevel 1 goto :fail

echo [4/7] 生成启动图标
call "%PY%" scripts\make_launcher_icons.py >> "%LOG%" 2>&1
if errorlevel 1 goto :fail

echo [5/7] 生成签名（只需一次）
if exist "android\keystore\release.keystore" (
  echo 签名已存在，跳过>> "%LOG%"
) else (
  call "%BASH%" scripts/make-keystore.sh >> "%LOG%" 2>&1
  if errorlevel 1 goto :fail
)

echo [6/7] 构建网页资源
call "%NPM%" run build >> "%LOG%" 2>&1
if errorlevel 1 goto :fail

echo [7/7] 同步到 Android
call npx cap sync android >> "%LOG%" 2>&1
if errorlevel 1 goto :fail

type "%LOG%"
echo.
echo ============================================
echo [完成] Android 工程已准备好。
echo 回到 Qoder 回复「工程好了」。
echo ============================================
pause
exit /b 0

:fail
type "%LOG%"
echo.
echo ============================================
echo [失败] 请把上面的输出或 %LOG% 发给 AI。
echo ============================================
pause
exit /b 1
