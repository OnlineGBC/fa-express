/*const express = require('express');
const app = express();
const { spawn } = require('child_process');

app.get('/', function (req, res) {
	const child = spawn('TestFile.sh', {shell:true});
	child.stdout.on('data', (chunk) => {
		console.log('Data->'+chunk);
	});
	child.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
	res.send('ASD');
});
app.set('view engine', 'jade');

var server = app.listen(process.env.PORT || 8080, function() {
	console.log("Listening to port: "+process.env.PORT);
});

*/
/*var util  = require('util'),
process = require('child_process'),
ls    = process.exec('TestFile.sh');

ls.stdout.on('data', function (data) {
   console.log(data.toString());
   ls.stdin.write('Test\n');
});*/
const { spawn } = require('child_process');
const { exec } = require('child_process');
const shell = require('shelljs');


const { stdout, stderr, code } = shell.exec('TestFile.sh', { silent: true })
console.log(stdout+'.....'+stderr+'......'+code);
//var command = shell.sh('TestFile.sh');
/*var output  = [];
command.stdout.on('data', function(chunk) {
	console.log('asd'+chunk);
	output.push(chunk);
}); 

command.on('close', function(code) {
	console.log('closed');
});*/

/*const testscript = exec('TestFile.sh /');

testscript.stdout.on('data', function(data){
    console.log(data);
    // sendBackInfo();
});

testscript.stderr.on('data', function(data){
    console.log(data);
    // triggerErrorStuff();
});*/