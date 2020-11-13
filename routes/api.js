const express = require('express');
const moment = require('moment-timezone');
const csv = require('csv-parser');
const fs = require('fs');
const AutomationRouter = require('./api/automation');
const ActionRouter = require('./api/action');
const { database } = require('../container');
const TaskManager = require('../src/TaskManager');
var scheduler = require('node-schedule');
const { Sequelize } = require('sequelize');

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
    attributes: ['id', 'uid', 'ref_num', 'CFN', 'IFN', 'SID', 'CustName', 'HostName',
      [Sequelize.fn('concat', Sequelize.col('DateGenerated'), ' ', Sequelize.col('TimeGenerated')), 'DateGenerated'],
      [Sequelize.fn('concat', Sequelize.col('DateScheduled'), ' ', Sequelize.col('TimeScheduled')), 'DateScheduled'],
      'ScriptName',
      'Status',
      'periodic'
    ],
    order: [['id', 'DESC']],
    where: {
      uid: req.user.id
    }
  })
    .then((result) => {
      res.json({ data: result });
    });
});

router.get('/getUid', (req, res) => {
  res.json(req.user.id);
});

router.get('/jobs', (req, res) => {
  Logs = database.logsModel;
  Jobs = database.jobsModel;
  Jobs.belongsTo(Logs, { targetKey: 'ref_num', foreignKey: 'id' })

  Jobs.findAll({
    attributes: { exclude: ['uid'] },
    order: [['id', 'DESC']],
    include: [{
      model: Logs,
      attributes: { exclude: ['content'] },
      where: {
        Status: {[Sequelize.not] : 'completed'}
      }
    }],
    where: {
      uid: req.user.id,
    }
  })
    .then((result) => {
      res.json(result);
    });
});

router.post('/reschedule', async (req, res) => {

  const { id, scheduleAt, timezone } = req.body;

  let theDate = new Date(scheduleAt);
  let minute = theDate.getMinutes();
  let hour = theDate.getHours();
  let day = theDate.getDate();
  let month = theDate.getMonth() + 1;
  let year = theDate.getFullYear();
  let cronString = `${minute} ${hour} ${day} ${month} *`;

  console.log("Rescheduling Job");
  const task = TaskManager.get(id);
  task.reschedule(cronString);

  console.log("Updating Logs");
  await database.updateLogTime(id, scheduleAt, timezone);
  res.json({ status: 200 });
})

router.post('/cancelJob', async (req, res) => {
  const { id } = req.body;
  console.log(id);
  console.log(TaskManager.tasks);
  const task = TaskManager.get(id);
  console.log("Cancelling Task");
  try {
    task.cancel();
    console.log("Task has been cancelled");
    await TaskManager.remove(id);
    res.json({ status: 200 });
  }
  catch (error) {
    console.log(error);
    res.sendStatus(404);
  }
})

router.post('/periodic', async (req,res) => {
  const {id} = req.body;
  console.log(id);
  const {details} = await database.periodicModel.findOne({
    where: {
      id
    },
  });
  res.json(details);
})
module.exports = router;
