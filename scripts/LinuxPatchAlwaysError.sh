uname -a

sudo apt list --upgradable

echo
echo

# Line below forces a non zero return code
rm nonexistentfile7242t647.txt

ERRORLEVEL=$?
echo $ERRORLEVEL
exit $ERRORLEVEL
