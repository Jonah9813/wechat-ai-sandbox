@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   推送代码到 GitHub
echo ============================================
echo.
echo 先做这一步：
echo   1. 浏览器打开 https://github.com/new
echo   2. 仓库名填 wechat-ai-sandbox
echo   3. 选 Public（必须是公开仓库，自动更新才能读）
echo   4. 不要勾选 Add a README / .gitignore / license
echo   5. 点 Create repository
echo   6. 复制页面上以 .git 结尾的仓库地址
echo.
set /p REPO=把仓库地址粘贴到这里后回车：
if "%REPO%"=="" goto :fail

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 git init

git branch -M main
git remote remove origin >nul 2>&1
git remote add origin "%REPO%"

echo.
echo 正在推送（如果弹出登录窗口，按提示登录 GitHub）...
git push -u origin main
if errorlevel 1 goto :pushfail

echo.
echo ============================================
echo [成功] 代码已推送到 GitHub。
echo 下一步：在仓库 Settings - Secrets and variables - Actions
echo 添加 4 个签名 Secret（内容见 android\keystore\INFO.txt）。
echo 然后双击「发布新版本.bat」发布 v0.1.0。
echo ============================================
pause
exit /b 0

:pushfail
echo.
echo [失败] 推送没有成功。常见原因：
echo   - 仓库地址填错
echo   - 创建仓库时勾了 README，导致远端已有提交
echo   - 没有登录 GitHub
echo 可以截图这个窗口发给 AI。
pause
exit /b 1

:fail
echo.
echo [失败] 没有填写仓库地址。
pause
exit /b 1
