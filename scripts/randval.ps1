$randval = Get-Random -Minimum 0 -Maximum 10

echo $randval

#Our goal is to check if $odd_or_even is an Even, Odd or Whole number
$odd_or_even = $randval % 2
echo $odd_or_even 

echo "Even number is 0 Odd number is 1"
echo "In a real scenario, we search for variable percent errorlevel percent"




# IF ($odd_or_even -eq 0)
# {
# Write-Host Even
# }

# IF ($odd_or_even -eq 1)
# {
# Write-Host Odd
# }

# IF ($odd_or_even -ne 1 -and $odd_or_even -ne 0)
# {
# Write-Host Not Whole
# }






