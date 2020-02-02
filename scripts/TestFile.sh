ssh -n -tt -o StrictHostKeyChecking=no $1@$2 dir
ssh -n -tt -o StrictHostKeyChecking=no $1@$2 ls -lart 
ssh -n -tt -o StrictHostKeyChecking=no $1@$2 uname -a
