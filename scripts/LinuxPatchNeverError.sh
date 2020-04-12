uname -a

sudo apt list --upgradable

echo
echo

# Line below always gives a Zero return code without any additional or possibly unnecessary output
ls > /dev/null  2>&1

ERRORLEVEL=$?
echo $ERRORLEVEL
exit $ERRORLEVEL
