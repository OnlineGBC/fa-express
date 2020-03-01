const express = require('express');
const moment = require('moment-timezone');
const csv = require('csv-parser');
const fs = require('fs');
const AutomationRouter = require('./api/automation');
const ActionRouter = require('./api/action');
const { database } = require('../container');

const router = express.Router();

router.use('/automation', AutomationRouter);
router.use('/action', ActionRouter);

// Handle CSV file upload
router.post('/upload', (req, res) => {
  const { file } = req.files;
  const data = [];
  let columns;
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
      console.log('CSV file successfully processed');
      console.log(data);
      res.json({
        columns,
        data,
      });
    });
});

/**
 * Task Scheduler
 */
router.get('/timezones', (req, res) => {
  const rawData = fs.readFileSync('public/assets/timezones.json');
  const timezones = Object.keys(JSON.parse(rawData));
  const mapped = timezones.map((timezone) => {
    return {
      hours: moment.tz(timezone)
        .format('Z'),
      timezone,
      text: `${moment.tz(timezone)
        .format('z Z')} (${timezone})`,
    };
  });
  return res.json(mapped);
});

router.get('/logs/', (req, res) => {
  database.logsModel.findAll({
    order: [['id', 'DESC']],
  })
    .then((result) => {
      res.json({ data: result });
    });
});

module.exports = router;
