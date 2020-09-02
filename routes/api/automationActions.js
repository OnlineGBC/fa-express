const express = require("express");
const { automationActions } = require("../../container");
var scheduler = require('node-schedule');
const TaskManager = require('../../src/TaskManager');

const router = express.Router();

router.post("/", async (req, res) => {
  req.connection.setTimeout(0);
  let {
    isImmediate = true,
    machineIds,
    scriptName,
    scheduleAt,
    emailAddress,
    timezone,
    folder,
    reference
  } = req.body;

  automationActions.setUid(req.user.id);

  // Inititate logs
  const logIds = await createLogs(req.user.id);

  let theDate = new Date();
  if (!isImmediate) {
    let theDate = new Date(scheduleAt);
    let minute = theDate.getMinutes();
    let hour = theDate.getHours();
    let day = theDate.getDate();
    let month = theDate.getMonth() + 1;
    let year = theDate.getFullYear();
    let cronString = `${minute} ${hour} ${day} ${month} *`;

    isImmediate = true;
    let taskId;

    var task = scheduler.scheduleJob(cronString, async function () {
      console.log('starting task');
      await beginExecution();
      console.log("Removing task no. " + taskId);
      TaskManager.remove(taskId);
    });

    taskId = await TaskManager.add(task, reference, logIds, req.user.id);
    console.log("TaskId = "+taskId);
  }
  else {
    beginExecution();
  }
  res.json({
    status: "success"
  });

  function beginExecution() {
    try {
      automationActions.runScript(
        scriptName,
        machineIds,
        isImmediate,
        {
          scheduleAt,
          emailAddress,
          timezone
        },
        folder,
        true,
        logIds
      );
      console.log('done');
    } catch (error) {
      console.log("Exception" + error);
      /* res.status(400).json({
        status: "error",
        error: error.message
      }); */
    }
  }

  async function createLogs(uid) {
    const logIdsArray = [];
    const now = Date.now();
    const scheduledAt = typeof scheduleAt != 'undefined' ? scheduleAt : null;

    for (var i = 0; i < machineIds.length; i++) {
      machineId = machineIds[i];
      let log = await automationActions.database.saveLog(
        machineId,
        null,
        now,
        scheduledAt,
        timezone,
        scriptName,
        uid
      );
      logIdsArray.push({
        machine: machineId,
        log
      });
      log.DateGenerated = log.DateGenerated + ' ' + log.TimeGenerated;
      log.DateScheduled = log.DateScheduled + ' ' + log.TimeScheduled;
      automationActions.logger.notifyListeners(log, uid);
    }
    return logIdsArray;
  }
});

module.exports = router;
