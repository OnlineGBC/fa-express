uname -a

sudo apt list --upgradable

echo .
echo .

# Line below forces a zero return code
ls >  /dev/null 2>&1


RCLEVEL=$?
echo Return code is  $RCLEVEL
exit $RCLEVEL

