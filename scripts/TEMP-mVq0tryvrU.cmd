whoami
dir /s

# This will give a non-zero errorlevel
dele random_file123.txt

REM set /a RCLEVEL = %ERRORLEVEL%
REM @echo %RCLEVEL%
REM exit /b %RCLEVEL%


set /a RCLEVEL = %ERRORLEVEL%
@echo %RCLEVEL%
exit /b %RCLEVEL%


