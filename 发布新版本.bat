@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   发布新版本（触发 GitHub Actions 出 APK）
echo ============================================
echo.

git status --porcelain | findstr . >nul
if not errorlevel 1 (
  echo [提示] 还有未提交的改动。请先提交，再发布。
  echo 可以运行：git add . ^&^& git commit -m "你的说明"
  pause
  exit /b 1
)

set /p VERSION=输入版本号（不要带 v，例如 0.1.1）：
if "%VERSION%"=="" goto :fail

git tag "v%VERSION%" >nul 2>&1
if errorlevel 1 (
  echo [失败] 这个版本 tag 已经存在，或创建失败。换一个版本号。
  pause
  exit /b 1
)

echo 推送 main 和 tag v%VERSION% ...
git push origin main
if errorlevel 1 goto :pushfail
git push origin "v%VERSION%"
if errorlevel 1 goto :pushfail

echo.
echo ============================================
echo [成功] 已发布 v%VERSION%。
echo 到 GitHub 仓库的 Actions 页面看构建进度；
echo 构建完成后，Release 里会出现 APK。
echo 手机 App 下次启动会自动提示更新。
echo ============================================
pause
exit /b 0

:pushfail
echo.
echo [失败] 推送失败，检查网络/GitHub 登录后重试。
pause
exit /b 1

:fail
echo.
echo [失败] 没有输入版本号。
pause
exit /b 1
