@echo off
chcp 65001 > nul
echo AI画像生成 Studio を起動しています...
echo.

REM SD WebUIが起動しているか確認
powershell -Command "try { $r = Invoke-WebRequest 'http://127.0.0.1:7860/sdapi/v1/options' -TimeoutSec 3 -UseBasicParsing; Write-Host 'SD WebUI: オンライン' -ForegroundColor Green } catch { Write-Host 'SD WebUI: オフライン (必要な場合は別途起動してください)' -ForegroundColor Yellow }"
echo.

REM ブラウザを開く
echo ブラウザを開きます: http://localhost:8080
start http://localhost:8080

REM proxy.py を起動（Ctrl+C で停止）
echo proxy.py を起動中...
"C:\Users\yamam\AppData\Local\Programs\Python\Python310\python.exe" proxy.py
