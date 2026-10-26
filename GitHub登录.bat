@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   登录 GitHub（只需一次）
echo ============================================
echo.
echo 接下来会打开浏览器：
echo   1. 浏览器里的验证码通常已经复制到剪贴板，直接 Ctrl+V
echo   2. 点 Authorize / 授权
echo   3. 回到这个窗口，看到 Logged in 就成功了
echo.
pause
"C:\Program Files\GitHub CLI\gh.exe" auth login --web --git-protocol https --hostname github.com
echo.
echo ============================================
echo 如果上面显示 Logged in，回到 Qoder 回复「登录好了」。
echo ============================================
pause
