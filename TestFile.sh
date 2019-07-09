echo $1
echo $2
ssh -n -tt -o StrictHostKeyChecking=no $1@$2 dir
