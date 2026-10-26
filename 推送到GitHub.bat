@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   推送代码到 GitHub
echo ============================================
echo.
echo 如果仓库还没建，先在浏览器打开：
echo   https://github.com/new?name=wechat-ai-sandbox^&visibility=public
echo 仓库名 wechat-ai-sandbox，选 Public，不要勾 README，点 Create repository。
echo.
echo 本脚本会推送到：
git remote get-url origin
echo.
echo 如果地址不对，按 Ctrl+C 退出，把正确地址告诉 AI 改。
echo.
pause

git push -u origin main
if errorlevel 1 goto :fail

echo.
echo ============================================
echo [成功] 代码已推送到 GitHub。
echo.
echo 下一步：
echo   1. 打开仓库 Settings - Secrets and variables - Actions
echo   2. 按 android\keystore\GitHub-Secrets.txt 添加 4 个 Secret
echo   3. 双击「发布新版本.bat」输入 0.1.0
echo ============================================
pause
exit /b 0

:fail
echo.
echo [失败] 推送没有成功。常见原因：
echo   - 仓库还没创建
echo   - 创建仓库时勾了 README（远端已有提交）
echo   - GitHub 登录窗口被关掉
echo 可以截图这个窗口发给 AI。
pause
exit /b 1
