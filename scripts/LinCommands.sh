echo Name of this server is  $(uname -n)
echo .
echo The SID information we are seeking is the following:
cat /etc/passwd | grep $1   
echo .
echo Basic contents are as follows:
dir
echo .; echo .; echo These steps are now COMPLETE!

