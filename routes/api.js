const express = require('express');
const router = express.Router();
const { checkSchema, validationResult } = require('express-validator/check');
const util = require('util');
const exec = require('child_process').exec;
var cron = require('node-cron');
const moment = require('moment-timezone');
const nodemailer = require("nodemailer");
const { config, email } = require('../config/smtpconfig');
const csv = require('csv-parser');
const fs = require('fs');

// Handle CSV file upload
router.post('/upload', (req, res) => {
	file = req.files.file;
	data = [];
	columns = [];
	console.log(file.tempFilePath);
	fs.createReadStream(file.tempFilePath)
		.pipe(csv())
		.on('headers', (headers) => {
			columns = headers;
		})
		.on('data', (row) => {
			console.log('got a row');
			data.push(row);
		})
		.on('end', () => {
			// fs.unlink(file.tempFilePath, function (err) {
			// 	if (err) throw err;
			// 	console.log('File deleted!');
			// }); 
			console.log('CSV file successfully processed');
			console.log(data);
			res.json({columns,data});
		});
});


router.post('/automation/actions', (req, res) => {

	const { action, item, formData } = req.body;

	// destructure the item object properties into individual variables
	// All properties shown in table are availble here
	const { HostName, LoginID, IFN, CFN, filename, index } = item;
	const { ref_num, schedule, date, time, format, zone } = formData;

	//return;
	/*LoginID = 'asd';
	HostName = '192.168.1.1';
	IFR = 'IFN';
	CFR = 'CFN';*/

	/************** Concatenate varibles in string example *****/
	const exampleString = `ssh -n -tt -o LoginID=${LoginID},HostName=${HostName}`;
	console.log('******Concatention EXAMPLE ********');
	console.log('Example String = ', exampleString);
	console.log('/*********************************');
	/************************************************************/

	// not sure if string can be started for all cases here or not
	// if not remove what's in the quotes
	let actionString = 'ssh -n ... ';
	// only 4 action names avaialble

	switch (action) {
		case 'host_patch':
			// build the patch string needed (pseudo exmples)
			actionString += IFN + '/' + CFN;
			break;
		case 'host_kernel':
			// kernel string

			break;
		case 'app_start':
			// create start string
			break;

		case 'app_stop':
			// create stop string
			break;

		default:
			// shouldn't need this but let front end know
			// when bad action provided
			return res.status(400).json({ error: 'BAD ACTION!' });

	}

	if (schedule != 'immediate') {

		timeArray = time.split(':');
		hours = parseInt(timeArray[0]);
		minutes = parseInt(timeArray[1]);
		dateArray = date.split('/');
		day = parseInt(dateArray[1]);
		month = parseInt(dateArray[0]);
		if ((hours > -1 && hours < 13) && (minutes > -1 && minutes < 60)) {
			console.log(hours);
			if (hours === 12) {
				hours = 0;
			}
			if (format == 'pm') {
				hours = parseInt(hours, 10) + 12;
			}
			console.log(minutes + ' ' + hours + ' ' + day + ' ' + month);
			var task = cron.schedule(`${minutes} ${hours} ${day} ${month} *`, () => {
				//			var task = cron.schedule(`* * * * *`, () => {
				console.log('Task started');
				runCommand(item, actionString, req.app);
				task.destroy();
			}, {
				scheduled: true,
				timezone: zone
			});
			task.start();
			res.json({ status: 'scheduled' });
		}
		else {
			error = 'The time format is incorrect';
			res.status(500).json({ error: error });
		}
	}
	else {
		runCommand(item, actionString, req.app);
		res.json({ status: 'success' });
	}

});

/**
 * Run Shell Command
 */

function runCommand(data, actionString, app) {

	io = app.get('socketio');

	// for local test only changing to a simple `dir` command
	// comment out following line in production
	// For Linux based systems
	//actionString = 'sh ./scripts/TestFile.sh ' + LoginID + ' ' + IFN;

	//For windows based system
	actionString = 'dir';

	const { HostName, LoginID, IFN, CFN, filename, index } = data;

	exec(actionString, (err, stdout, stderr) => {

		if (err) {
			console.error(err);
		}

		// Dispatch mail
		sendMail(stdout).catch(console.error);

		const fs = require('fs');
		//fs.writeFile("./logs/"+filename, IFN, function(err) {
		fs.writeFile("./logs/" + filename, stdout.stdout, function (err) {
			if (err) {
				return console.log(err);
			}
			stdout.file = filename;
			// console.log(stdout);
			io.sockets.emit('log', { stdout: stdout, index: index });
			console.log("The file was saved!");
			return;
		});
	});
}

async function sendMail(data) {

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport(config);

	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: 'FUN-SWAlert@onlinegbc.com', // sender address
		to: email, // list of receivers
		subject: "Logs for recent actions performed", // Subject line
		html: `<pre>${data}</pre>` // html body
	});

	console.log("Message sent: %s", info.messageId);
}

/**
 * GET all from Automation table to send to browser to create UI table
 */
router.get('/automation', function (req, res, next) {
	var sql = "SELECT * FROM FA_RPA.Automation ORDER BY id ASC";

	db.query(sql, function (err, result, field) {
		if (!err) {

			result.forEach(item => {
				Object.keys(item).forEach(k => {
					// table plugin doesn't like `null` as values
					if (item[k] == null) {
						item[k] = ''
					}
				});
			});
			res.json({ data: result });
		} else {
			res.sendStatus(500)
		}

	});

});

/**
 * For IP Matching validtion *
 */
const invalidIP = {
	errorMessage: 'Invalid IP Address',
	options: ipMatch
};

/**
 * Crude schema for validation
 */
const schema = {
	HostName: {
		isLength: {
			errorMessage: 'HostName too short',
			// Multiple options would be expressed as an array
			options: { min: 2 }
		}
	},
	CMD_PREFIX: {
		optional: true
	},
	IFN: {
		custom: invalidIP
	},
	CFN: {
		custom: invalidIP
	},
	OSType: {
		optional: true
	},
	SID: {
		// not sure what rules are
	},
	DBTYPE: {

		optional: true
	},
	AppType: {
		optional: true
	},
	CUSTNAME: {
		isLength: {
			options: { min: 2 }
		}
	},
	LOCATION: {
		isLength: {
			options: { min: 2 }
		}
	}
}


/**
 * Create new Automation item
 */
router.post('/validate', checkSchema(schema), (req, res) => {
	
	console.log(req.body);
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	} else {
		res.sendStatus(200);
	}
});


/**
 * Create new Automation item
 */
router.post('/automation', checkSchema(schema), (req, res) => {

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	} else {

		try {
			const data = Object.assign({}, req.body);
			delete data.id;
			const fields = [], values = [];
			Object.entries(data).forEach(([key, value]) => {
				if(value == ''){
					value = null;
				}
				fields.push(key);
				values.push(value)
			});

			const sql = `INSERT INTO FA_RPA.Automation (${fields.join()}) VALUES (${fields.map(() => '?').join()})`;

			db.execute(sql, values, function (err, result, fields) {
				if (err) {
					console.log(err);
					res.status(500).json({ err: err.message });
				} else {
					const id = result.insertId;
					data.id = id;
					//console.log(result);
					res.json(data);
				}
			});
		} catch (e) {
			//console.log(e);
			res.status(500).json({ err: e.message });
		}
	}
});

/**
 * Delete Automation table item
 */
router.delete('/automation/:id', (req, res) => {
	const id = req.params.id;
	if (isNaN(id) || id < 1) {
		return res.sendStatus(400);
	} else {
		const sql = "DELETE FROM FA_RPA.Automation WHERE id= ?";
		db.execute(sql, [id], (err, result) => {
			if (err) {
				console.log(err);
				res.sendStatus(500);
			} else {
				res.sendStatus(200);
			}
		});
	}

});

/**
 * Update existing Automation table item
 */
router.put('/automation', checkSchema(schema), (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	} else {
		const body = req.body;
		const fields = [], values = [];
		Object.entries(body).forEach(([key, value]) => {
			if (key == 'Order') {
				value = parseInt(value);
				console.log("Order->" + value);
			}
			fields.push(key);
			values.push(value)
		});
		values.push(body.id);
		const setClause = fields.map(field => `${field} = ?`).join();
		const sql = `UPDATE FA_RPA.Automation SET ${setClause} WHERE id = ?`;
		db.execute(sql, values, (err, results, fields) => {
			if (!err) {
				body.id = parseInt(body.id);
				res.json(body);
			} else {
				console.log(err);
				res.sendStatus(500);
			}
		});
	}
});

/**
 * GET LoginIds from table
 */
router.get('/automation/ids', function (req, res, next) {

	const sql = `SHOW COLUMNS FROM FA_RPA.Automation`;

	db.execute(sql, function (err, result, fields) {
		if (err) {
			console.log(err);
			res.status(500).json({ err: err.message });
		} else {
			res.json({ data: result });
		}
	});

	// var sql = "SELECT DISTINCT LoginID from fa_rpa.automation";

	// db.query(sql, function (err, result, field) {
	// 	if (!err) {
	// 		res.json({data : result});
	// 	} else {
	// 		res.sendStatus(500)
	// 	}

	// });

});



/**
 * Task Scheduler
 */

/**
* Create new Automation item
*/
router.post('/schedule', (req, res) => {

	try {
		const data = Object.assign({}, req.body);
		const fields = [], values = [];
		Object.entries(data).forEach(([key, value]) => {
			fields.push(key);
			values.push(value)
		});

		time = data.time.split(':');
		hours = parseInt(time[0]);
		minutes = parseInt(time[1]);

		if ((hours > -1 && hours < 13) && (minutes > -1 && minutes < 60)) {
			if (data.format == 'pm') {
				hours = parseInt(hours, 10) + 12;
			}
			var task = cron.schedule(`${minutes} ${hours} * * *`, () => {
				console.log('Task started');
				task.destroy();
			}, {
				scheduled: true
			});

			task.start();
		}
		else {
			error = 'Your time format is incorrect';
			res.status(500).json({ error: error });
		}

	} catch (e) {
		//console.log(e);
		res.status(500).json({ err: e.message });
	}
});

router.get('/timezones', (req, res) => {
	const fs = require('fs');
	let rawdata = fs.readFileSync('public/assets/timezones.json');
	let timezones = JSON.parse(rawdata);
	output = {};
	for (zone in timezones) {
		output[zone] = moment.tz(zone).format('z Z') + ` (${zone})`;
	}
	return res.json(output);
});


function ipMatch(value) {
	const reg = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gm;
	return value.match(reg)
}

module.exports = router;
