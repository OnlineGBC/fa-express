const express = require('express');
const router = express.Router();
const { checkSchema , validationResult} = require('express-validator/check');
const util = require('util');
const exec = util.promisify(require('child_process').exec);


router.post('/automation/actions', (req, res)=> {
	io = req.app.get('socketio');
	const {action, item } = req.body;

	// destructure the item object properties into individual variables
	// All properties shown in table are availble here
	const {HostName, LoginID, IFN, CFN, filename, index} = item;
	/*LoginID = 'asd';
	HostName = '192.168.1.1';
	IFR = 'IFN';
	CFR = 'CFN';*/

	/************** Concatenate varibles in string example *****/
	const exampleString = `ssh -n -tt -o LoginID=${LoginID},HostName=${HostName}`;
	console.log('******Concatention EXAMPLE ********' );
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
			return res.status(400).json({error : 'BAD ACTION!'});

		}
		// for local test only changing to a simple `dir` command
		// comment out following line in production
		actionString = 'dir';
		// now execute the string command in the promisified `exec()`
		exec('sh TestFile.sh '+ LoginID+' '+IFN).then(stdout=> {
			// here. its gone
		// DEMO  only, probably don't need to log this
		
		const fs = require('fs');
		//fs.writeFile("./logs/"+filename, IFN, function(err) {
		fs.writeFile("./logs/"+filename, stdout.stdout, function(err) {
			if(err) {
				return console.log(err);
			}
			stdout.file = filename;
			io.sockets.emit('log',{stdout:stdout.stdout,index:index});
			console.log("The file was saved!");
		}); 


			// let me check at my side
		// if there is any output than can be tested to it here
		// create proper logic and then uncomment the follwing

		/*if(stdout !== 'success'){
		 // this throw is in a javascript promise and will get caught in the next `catch()` block
			 throw new Error('fail')
			}*/

		// all good so return positive response to front end
		res.sendStatus(200);

	}).catch(stderr=> res.sendStatus(422).json({error : stderr}))


	});

/**
 * GET all from Automation table to send to browser to create UI table
 */
 router.get('/automation', function (req, res, next) {
 	var sql = "SELECT * FROM FA_RPA.Automation ORDER BY id ASC";

 	db.query(sql, function (err, result, field) {
 		if (!err) {

 			result.forEach(item=> {
 				Object.keys(item).forEach(k=> {
					// table plugin doesn't like `null` as values
					if (item[k] == null) {
						item[k] = ''
					}
				});
 			});
 			res.json({data : result});
 		} else {
 			res.sendStatus(500)
 		}

 	});

 });

/**
 * For IP Matching validtion *
 */
 const invalidIP = {
 	errorMessage : 'Invalid IP Address',
 	options : ipMatch
 };

/**
 * Crude schema for validation
 */
 const schema = {
 	HostName : {
 		isLength : {
 			errorMessage : 'HostName too short',
			// Multiple options would be expressed as an array
			options : {min : 2}
		}
	},
	CMD_PREFIX : {
		optional : true
	},
	IFN : {
		custom : invalidIP
	},
	CFN : {
		custom : invalidIP
	},
	OSType : {
		custom : {
			options : (value)=> {
				return ['AIX', 'RHEL_Linux', 'SuSe_Linux', 'Windows', 'Ubuntu_Linux'].includes(value)
			}
		}
	},
	SID : {
		// not sure what rules are
	},
	DBTYPE : {

		custom : {
			options : (value)=> {
				return ['ora', 'db2', 'mss', 'hdb', 'syb', 'sdb', 'non'].includes(value)
			}
		}
	},
	AppType : {
		custom : {
			options : (value)=> {
				return ['StandardABAPJava', 'APOwLC', 'BOBJ', 'CacheServer', 'ContentServer', 'ConvergentCharging', 'none'].includes(value)
			}
		}
	},
	CUSTNAME : {
		isLength : {
			options : {min : 2}
		}
	},
	LOCATION : {
		isLength : {
			options : {min : 2}
		}
	}
}

/**
 * Create new Automation item
 */
 router.post('/automation', checkSchema(schema), (req, res)=> {
 	const errors = validationResult(req);
 	if (!errors.isEmpty()) {
 		return res.status(422).json({errors : errors.array()});
 	} else {

 		try {
 			const data = Object.assign({}, req.body);
 			delete data.id;
 			const fields = [], values = [];
 			Object.entries(data).forEach(([key,value])=> {
 				fields.push(key);
 				values.push(value)
 			});

 			const sql = `INSERT INTO FA_RPA.Automation (${fields.join()}) VALUES (${fields.map(()=>'?').join()})`;

 			db.execute(sql, values, function (err, result, fields) {
 				if (err) {
 					console.log(err);
 					res.status(500).json({err : err.message});
 				} else {
 					const id = result.insertId;
 					data.id = id;
					//console.log(result);
					res.json(data);
				}
			});
 		} catch (e) {
			//console.log(e);
			res.status(500).json({err : e.message});
		}
	}
});

/**
 * Delete Automation table item
 */
 router.delete('/automation/:id', (req, res)=> {
 	const id = req.params.id;
 	if (isNaN(id) || id < 1) {
 		return res.sendStatus(400);
 	} else {
 		const sql = "DELETE FROM FA_RPA.Automation WHERE id= ?";
 		db.execute(sql, [id], (err, result)=> {
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
 router.put('/automation', checkSchema(schema), (req, res)=> {

 	const errors = validationResult(req);
 	if (!errors.isEmpty()) {
 		return res.status(422).json({errors : errors.array()});
 	} else {
 		const body = req.body;

 		const fields = [], values = [];
 		Object.entries(body).forEach(([key,value])=> {
 			fields.push(key);
 			values.push(value)
 		});
 		values.push(body.id);
 		const setClause = fields.map(field=> `${field} = ?`).join();
 		const sql = `UPDATE FA_RPA.Automation SET ${setClause} WHERE id = ?`;
 		db.execute(sql, values, (err, results, fields)=> {
 			if (!err) {
 				body.id = parseInt(body.id);
 				res.json(body);
 			} else {
 				res.sendStatus(500);
 			}
 		});
 	}
 });

 function ipMatch(value) {
 	const reg = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gm;
 	return value.match(reg)
 }

 module.exports = router;
