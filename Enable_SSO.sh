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

# Start reading the lines and check for IFN
# If .pub file does not exist, create it and copy it using scp;  else, just copy it

    while read LINE
      do
        if [ "$LINE" != "" ]; then
          AppHost=$(echo $LINE | cut -d "," -f1)
	  LoginID=$(echo $LINE | cut -d "," -f2)
	  IFN=$(echo $LINE | cut -d "," -f4) 
          echo Downloading public key for $AppHost
          ssh -n -tt -o StrictHostKeyChecking=no $LoginID@$IFN "echo -e 'n' | ssh-keygen -b 2048 -t rsa -f /home/$LoginID/.ssh/id_rsa -q -P '' "
          scp -o StrictHostKeyChecking=no $LoginID@$IFN:/home/$LoginID/.ssh/id_rsa.pub /tmp/$AppHost.pub
          echo
        fi
    done < $FILENAME

# Save PWD and change directory to .ssh directory
  saved_dir="$PWD"
  cd ~/.ssh

# Before downloading to authorized_keys, make sure to delete older authorized_keys versions and rename the current file to avoid large files and duplicate entries
  if [ -f authorized_keys  ]; then
    rm authorized_keys.20*
    mv authorized_keys authorized_keys.$timestamp  
  fi

#  Now merging all public keys to one common authorized_keys file, change back to original PWD
  cd "$saved_dir"
  echo Now merging all public keys to one common authorized_keys file
    while read LINE
      do
        if [ "$LINE" != "" ]; then
          AppHost=$(echo $LINE | cut -d "," -f1)
          cat /tmp/$AppHost.pub >> authorized_keys
          echo
        fi
    done < $FILENAME

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




