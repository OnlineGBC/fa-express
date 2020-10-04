powershell "Get-Process | Get-Member | Out-Host"


set /a RCLEVEL = %ERRORLEVEL%
@echo %RCLEVEL%
exit /b %RCLEVEL%


