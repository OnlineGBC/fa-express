whoami
dir /a
@echo off

set /a randval = %random% %% 100
echo %randval%

set /a odd_or_even = %randval% %% 2
echo %odd_or_even%
echo Even number is 0 Odd number is 1
echo In a real scenario, we search for variable "percent ERRORLEVEL percent"
echo
echo

REM set /a ERRORLEVEL = 0
REM echo Return Code is %ERRORLEVEL% so we have no Errors!

REM exit /b %ERRORLEVEL%

REM if %odd_or_even % EQU 1 (echo odd) else (echo even)
REM In a real scenario, we search for variable %ERRORLEVEL%

set /a ERRORLEVEL = 0
exit /b %ERRORLEVEL%