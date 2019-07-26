ssh -n -tt -o StrictHostKeyChecking=no $1@$2 dir
ls -lart 
uname -a
