#!/bin/bash
 
#   This program does the key exchange amongst all the servers
#   Run from any ONE of the servers

if [ "$1" != "" ]
then 
    FILENAME=$1
else
    echo "Please, specify the filename"
    exit 1
fi

#  Keep track of timestamp which is useful for renaming files
timestamp=$(date +%F-%I%M%S )

# Clean out any temporary files from previous runs
  if [ -f $FILENAME.AppHostOnly ]; then
    rm $FILENAME.AppHostOnly*
  fi

# Save PWD and change directory to .ssh directory
  saved_dir="$PWD"

#  Temporarily copy the current system's authorized_keys to the current directory
   cp ~/.ssh/authorized_keys ./

# Now uploading the authorized_keys file to all the hosts
    while read LINE
      do
        if [ "$LINE" != "" ]; then
          AppHost=$(echo $LINE | cut -d "," -f1)
	  LoginID=$(echo $LINE | cut -d "," -f2)
	  IFN=$(echo $LINE | cut -d "," -f4) 
          echo Now uploading the authorized_keys file to $AppHost
          scp -o StrictHostKeyChecking=no  $saved_dir/authorized_keys $LoginID@$IFN:/home/$LoginID/.ssh/.
          echo
        fi
    done < $FILENAME

# Clean out any temporary files from previous runs
    rm $FILENAME.AppHostOnly* >/dev/null 2>&1 &
    rm /tmp/*.pub  >/dev/null 2>&1 &
    rm ./authorized_keys

echo  The SSO between servers is now done.  Please test by running test-SSO.sh from the server, per the SOP instructions




