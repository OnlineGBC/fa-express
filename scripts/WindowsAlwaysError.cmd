whoami
dir /a
@echo off

set /a randval = %random% %% 100
echo setting randval to random
echo %randval%

REM The following command should always return a non-zero ERRORLEVEL
del random_filename.txt

set /a odd_or_even = %randval% %% 2
echo %odd_or_even%
echo Even number is 0 Odd number is 1
echo In a real scenario, we search for variable "percent ERRORLEVEL percent"

set /a ERRORLEVEL = 1
echo Return Code is %ERRORLEVEL% so we have a Fake error!
exit /b %ERRORLEVEL%

REM if %odd_or_even % EQU 1 (echo odd) else (echo even)
REM In a real scenario, we search for variable %ERRORLEVEL%
REM echo Text Appended.echo Text Appended.