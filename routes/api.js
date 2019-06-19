const express = require('express');
const router = express.Router();
const { checkSchema , validationResult} = require('express-validator/check');


router.post('/automation/actions', (req, res)=>{
	const {action, items } = req.body;
	const errors =[];
	// array of object items sent with all available data shown in table
	// how to confirm for user response???
	// also assume this will be asynchronous in which case need to resolve array of promises??

	items.forEach(({id, IFN, CFN})=>{
		// if some condition add to errors array

		switch(action){
			case 'host_patch':

				break;
			case 'host_kernel':

				break;
			case 'app_start':

				break;

			case 'app_stop':

				break;

			default:
				console.log("BAD ACTION!")
		}
	});

	const status = errors.length ? 500 : 200;
	res.sendStatus(status);
});

/* GET users listing. */
router.get('/automation', function (req, res, next) {
	var sql = "SELECT * FROM FA_RPA.Automation ORDER BY id ASC";
	var protectedFields = ['LoginID'];
	db.query(sql, function (err, result, field) {
		if (!err) {
			result = result.map(item=> {
				protectedFields.forEach(field=> {
					delete item[field]
				});
				return item;
			});
		}
		res.json({data : result})

	});

});



const invalidIP = {
	errorMessage : 'Invalid IP Address',
	options : ipMatch
};

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
		//isIn:{
		//	options:['AIX','RHEL_Linux','SuSe_Linux','Windows','Ubuntu_Linux']
		//}
		custom : {
			options : (value)=> {
				return ['AIX', 'RHEL_Linux', 'SuSe_Linux', 'Windows', 'Ubuntu_Linux'].includes(value)
			}
		}

	},
	SID : {
		//isInt:true,
		//toInt:true
	},
	DBTYPE : {

		custom : {
			options : (value)=> {
				return ['ora', 'db2', 'mss', 'hdb', 'syb', 'sdb', 'non'].includes(value)
			}
		}
		//isIn:{
		//	options: ['ora','db2','mss','hdb','syb','sdb','non']
		//}
	},
	AppType : {

		custom : {
			options : (value)=> {
				return ['StandardABAPJava', 'APOwLC', 'BOBJ', 'CacheServer', 'ContentServer', 'ConvergentCharging', 'none'].includes(value)
			}
		}
		//isIn:{
		//	options:['StandardABAPJava','APOwLC','BOBJ','CacheServer','ContentServer','ConvergentCharging','none']
		//}
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

router.post('/automation', checkSchema(schema), (req, res)=> {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({errors : errors.array()});
	} else {
		//console.log("INSERT")

		try {
			const data = Object.assign({}, req.body);
			delete data.id;
			const fields = [], values = [];
			Object.entries(data).forEach(([key,value])=> {
				fields.push(key);
				values.push(value)
			});
			//values.push(body.id);
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
			console.log(e);
			res.status(500).json({err : e.message});
		}
	}
});

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
				res.json(body);
			} else {
				res.sendStatus(500);
			}
		});
	}
});

function ipMatch  (value) {
	const reg = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gm;
	return value.match(reg)
}

module.exports = router;
