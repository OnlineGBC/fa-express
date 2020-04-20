const express = require('express');
const { checkSchema, validationResult } = require('express-validator/check');
const { dbConnection: databaseConnection } = require('../../container');

const router = express.Router();
const { database } = require('../../container');
const AutomationActionsRoute = require('./automationActions');
const SequentialActionsRoute = require('./sequentialActions');


function ipMatch(value) {
  const reg = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gm;
  return value.match(reg);
}

/**
 * For IP Matching validtion *
 */
const invalidIP = {
  errorMessage: 'Invalid IP Address',
  options: ipMatch,
};

/**
 * Crude schema for validation
 */
const schema = {
  HostName: {
    isLength: {
      errorMessage: 'HostName too short',
      // Multiple options would be expressed as an array
      options: { min: 2 },
    },
  },
  CMD_PREFIX: {
    optional: true,
  },
  IFN: {
    custom: invalidIP,
  },
  CFN: {
    custom: invalidIP,
  },
  OSType: {
    optional: true,
  },
  SID: {
    // not sure what rules are
  },
  DBTYPE: {
    optional: true,
  },
  AppType: {
    optional: true,
  },
  CUSTNAME: {
    isLength: {
      options: { min: 2 },
    },
  },
  LOCATION: {
    isLength: {
      options: { min: 2 },
    },
  },
};

router.use('/actions', AutomationActionsRoute);
router.use('/seqActions', SequentialActionsRoute);

/**
 * GET all from Automation table to send to browser to create UI table
 */
router.get('/', (req, res) => {
  database.findAllMachines()
    .then((allMachines) => {
      const mapped = allMachines.map((machine) => {
        const json = machine.toJSON();
        Object.keys(json)
          .forEach((key) => {
            if (json[key] === null) {
              json[key] = '';
            }
          });
        return json;
      });
      res.json({ data: mapped });
    })
    .catch(() => res.sendStatus(500));
});

/**
 * Create new Automation item
 */
router.post('/validate', checkSchema(schema), (req, res) => {
  console.log(req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422)
      .json({ errors: errors.array() });
  }
  res.sendStatus(200);
});

/**
 * Create new Automation item
 */
router.post('/', checkSchema(schema), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422)
      .json({ errors: errors.array() });
  }
  try {
    const data = { ...req.body };
    delete data.id;
    const fields = [];
    const values = [];
    Object.entries(data)
      .forEach(([key, value]) => {
        if (value === '') {
          value = null;
        }
        fields.push(key);
        values.push(value);
      });

    const sql = `INSERT INTO FA_RPA.Automation (${fields.join()}) VALUES (${fields
      .map(() => '?')
      .join()})`;

    databaseConnection.execute(sql, values, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500)
          .json({ err: err.message });
      } else {
        const id = result.insertId;
        data.id = id;
        // console.log(result);
        res.json(data);
      }
    });
  } catch (e) {
    // console.log(e);
    res.status(500)
      .json({ err: e.message });
  }
});

/**
 * Delete Automation table item
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  if (isNaN(id) || id < 1) {
    return res.sendStatus(400);
  }
  const sql = 'DELETE FROM FA_RPA.Automation WHERE id= ?';
  databaseConnection.execute(sql, [id], (err) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

/**
 * Update existing Automation table item
 */
router.put('/', checkSchema(schema), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422)
      .json({ errors: errors.array() });
  }
  const { body } = req;
  const fields = [];
  const values = [];
  Object.entries(body)
    .forEach(([key, value]) => {
      if (key === 'Order') {
        value = parseInt(value);
        console.log(`Order->${value}`);
      }
      fields.push(key);
      values.push(value);
    });
  values.push(body.id);
  const setClause = fields.map((field) => `${field} = ?`)
    .join();
  const sql = `UPDATE FA_RPA.Automation SET ${setClause} WHERE id = ?`;
  databaseConnection.execute(sql, values, (err) => {
    if (!err) {
      body.id = parseInt(body.id);
      res.json(body);
    } else {
      console.log(err);
      res.sendStatus(500);
    }
  });
});

/**
 * GET LoginIds from table
 */
router.get('/ids', (req, res) => {
  const sql = 'SHOW COLUMNS FROM FA_RPA.Automation';

  databaseConnection.execute(sql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500)
        .json({ err: err.message });
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

module.exports = router;
