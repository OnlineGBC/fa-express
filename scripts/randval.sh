randval=$(( ( RANDOM % 10 )  + 1 ))

if [ $((randval%2)) -eq 0 ]
then
  randval=0  
else
  randval=1 
fi

echo $randval


 
