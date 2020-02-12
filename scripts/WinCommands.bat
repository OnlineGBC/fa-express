@echo off
echo Name and Login information of this server is  
whoami
echo .
echo The SID information we are seeking is the following:
dir \users | findstr %1%
echo .
echo Basic contents are as follows:
dir /x



