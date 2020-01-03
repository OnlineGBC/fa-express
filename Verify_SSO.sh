#!/bin/bash

function specify_filename()
{
  if [ "$1" != "" ]
  then
    FILENAME=$1
  else
    echo "Please specify the filename"
    exit 1
  fi
}


function clean_temp_files()
{
# Clean out any temporary files from previous runs
   rm *AppHostOnly*  &> /dev/null
   rm *BLANK* &> /dev/null
   rm dummy.tmp &> /dev/null 
}

function execute_SSO_test()
{
echo Please Wait  . . .
date | sed s'/[: ]/_/g' | tee dummy.tmp
date_w_underscore=$(<dummy.tmp)
echo Starting test from $LOCATION, at "$date_w_underscore"  | tee -a /tmp/"$LOCATION"_TestConnection."$date_w_underscore".log
echo   | tee -a /tmp/"$LOCATION"_TestConnection."$date_w_underscore".log

  while read LINE; do
    if [ "$LINE" != "" ]; then
        AppHost=$(echo $LINE | cut -d "," -f1)
        LoginID=$(echo $LINE | cut -d "," -f2)
        IFN=$(echo $LINE | cut -d "," -f3)
        CFN=$(echo $LINE | cut -d "," -f4)
        HOSTIP=$IFN
        IPTYPE=IFN
	echo; echo;

        scp -o StrictHostKeyChecking=no -o PasswordAuthentication=no testAll.sh  $LoginID@$HOSTIP:/tmp/. 2>&1  | tee -a /tmp/"$LOCATION"_TestConnection."$date_w_underscore".log
        echo 'You must get a SUCCESSFUL message to AppHost' $AppHost 'with' $IPTYPE 'IP' $HOSTIP ' and without WARNINGS.  Else, assume failure, press Ctrl-C to test again and/or check further!'    2>&1  | tee -a /tmp/"$LOCATION"_TestConnection."$date_w_underscore".log
        ssh -n -tt -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o PasswordAuthentication=no $LoginID@$HOSTIP 'chmod 775 /tmp/testAll.sh; /tmp/testAll.sh'  $AppHost $IFN $CFN $IPTYPE $HOSTIP  2>&1  | tee -a /tmp/"$LOCATION"_TestConnection."$date_w_underscore".log  
    fi
  done < $FILENAME1
}
                               
# MAIN PROGRAM
       
export TERM=xterm

specify_filename $1 
 
#  Clean previous files
clean_temp_files

#  Remove all blank or empty lines, white spaces, left and right trims, etc.
sed 's/^ *//; s/ *$//; /^$/d; /^\s*$/d'  $FILENAME     > $FILENAME.NO_BLANKS
FILENAME1=$FILENAME.NO_BLANKS

#Clean up file
    while read LINE; do
      AppHost=$(echo $LINE | cut -d "," -f1)
      LoginID=$(echo $LINE | cut -d "," -f2)
      IFN=$(echo $LINE | cut -d "," -f4)
      CFN=$(echo $LINE | cut -d "," -f5)
      SITE_LOCATED=$(echo $LINE | cut -d "," -f12)
      echo $AppHost,$LoginID,$IFN,$CFN,$SITE_LOCATED  '  '  >> $FILENAME1.NO_BLANKS.AppHostOnly
    done < $FILENAME1

sort $FILENAME1.NO_BLANKS.AppHostOnly |uniq > $FILENAME1.NO_BLANKS.AppHostOnly.Unique.txt
FILENAME1=$FILENAME1.NO_BLANKS.AppHostOnly.Unique.txt

#  Test to check if this is running in DataCenter or some other device
  LOCATION="Desktop"
  execute_SSO_test $1
  clean_temp_files
  echo Log files of this test may be checked in /tmp/"$LOCATION"_TestConnection."$date_w_underscore".log

 
