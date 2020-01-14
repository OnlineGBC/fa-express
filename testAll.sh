#!/bin/bash 

export AppHost=$1   
export IFN=$2
export CFN=$3
export IPTYPE=$4
export HOSTIP=$5

echo 'Connection to AppHost ' $AppHost ' with ' $IPTYPE ' IP ' $HOSTIP ' SUCCESSFUL'
uname -a > unamestr; unamestr1=`cat unamestr`; unamestr2=$(echo $unamestr1 | cut -d " " -f2) 
# AppHost_lowercase=$( echo "$AppHost" | tr   '[:upper:]'  '[:lower:]' )
# AppHost_lc_no_space="$(echo -e "${AppHost_lowercase}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
echo Current Host is $unamestr2, AppHost is $AppHost, CFN is $CFN and IFN is $IFN

  if [[ $AppHost != $unamestr2 ]]
  then
    echo WARNING!!!! There is a host-IP mismatch!!!! Please check more closely and fix as required!   2>&1  | tee -a /tmp/TestConnection."$date_w_underscore".log
  fi


