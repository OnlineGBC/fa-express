const express = require("express");
const { automationActions } = require("../../container");
var scheduler = require('node-schedule-tz');
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
    reference,
    timeString,
    periodicString,
    p_value,
    p_context
  } = req.body;

  let periodicId = null;

  automationActions.setUid(req.user.id);

  // Inititate logs
  const taskId = await TaskManager.add(task, reference, req.user.id);

  if (periodicString) {
    const periodic = await automationActions.database.createPeriodic(periodicString,p_value,p_context);
    periodicId = periodic.id;
  }
  console.log("TaskId = " + taskId);
  let logIds = await createLogs(req.user.id);


  let theDate = new Date();
  if (!isImmediate) {
    isImmediate = true;
    if (timeString == "") {
      let theDate = new Date(scheduleAt);
      let minute = theDate.getMinutes();
      let hour = theDate.getHours();
      let day = theDate.getDate();
      let month = theDate.getMonth() + 1;
      let year = theDate.getFullYear();
      let cronString = `${minute} ${hour} ${day} ${month} *`;
      var task = scheduler.scheduleJob(cronString, async function () {
        console.log('starting task');
        await beginExecution();
        console.log("Removing task no. " + taskId);
        TaskManager.remove(taskId);
      });
    }
    else {

      // Handle periodic task

      var task = scheduler.scheduleJob("Job1", timeString, timezone, async function () {
        console.log('starting task');
        await beginExecution();
        console.log("Execution complete" + taskId);
        scheduleAt = task.nextInvocation().getTime();
        logIds = await createLogs(req.user.id);
      });
    }
    
    TaskManager.update(taskId,task);
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
        req,
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
        uid,
        periodicId,
        taskId
      );
      logIdsArray.push({
        machine: machineId,
        log
      });
      automationActions.logger.notifyListeners(log, uid);
    }
    return logIdsArray;
  }
});

module.exports = router;
