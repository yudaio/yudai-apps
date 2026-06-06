@echo off
chcp 65001 > nul
echo ============================================
echo   Face AI Studio 起動スクリプト
echo ============================================
echo.

REM ── プロキシ チェック・起動 ──
powershell -Command "$c=Get-NetTCPConnection -LocalPort 8080 -State Listen -EA SilentlyContinue; if($c){Write-Host '  プロキシ: すでに起動中' -ForegroundColor Green}else{Write-Host '  プロキシ: 起動します...' -ForegroundColor Cyan; Start-Process 'C:\Users\yamam\AppData\Local\Programs\Python\Python310\python.exe' -ArgumentList 'proxy.py' -WorkingDirectory 'C:\Users\yamam\Downloads\yudai-apps' -WindowStyle Normal}"
echo.

REM ── ブラウザを開く（少し待ってから） ──
echo   ブラウザを開きます: http://localhost:8080
timeout /t 2 /nobreak > nul
start http://localhost:8080

echo.
echo   初回の顔入れ替え・DeepFake実行時は
echo   inswapper_128.onnx (約170MB) を自動ダウンロードします。
echo.
pause
