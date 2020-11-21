const express = require("express");
const { automationActions } = require("../../container");
var scheduler = require('node-schedule-tz');
const TaskManager = require('../../src/TaskManager');

const router = express.Router();

router.post("/", async (req, res) => {
  req.connection.setTimeout(0);

  let {
    rows,
    isImmediate = true,
    scheduleAt,
    emailAddress = '',
    timezone = '',
    continueOnErrors,
    reference,
    timeString,
    periodicString
  } = req.body;


  function compare(a, b) {
    if (a.Order_Exec < b.Order_Exec) {
      return -1;
    }
    if (a.Order_Exec > b.Order_Exec) {
      return 1;
    }
    return 0;
  }



  // Rows sorted according to order
  sortedRows = rows.sort(compare);

  // Array containing set of same order_Exec
  let orderArray = Array();
  let orderSet = Array();
  let start = 0;
  let periodicId = null;

  automationActions.setUid(req.user.id);

  const taskId = await TaskManager.add(task, reference, req.user.id);

  if (periodicString) {
    const periodic = await automationActions.database.createPeriodic(periodicString);
    periodicId = periodic.id;
  }
  console.log("TaskId = " + taskId);

  // Inititate logs
  let logIds = await createLogs(req.body, req.user.id);

  for (let i = 0; i < sortedRows.length; i++) {
    if (sortedRows[i].Order_Exec > start) {
      if (start > 0) {
        orderArray.push(orderSet);
      }
      // Reset the array when order number changes
      orderSet = Array();
      start = sortedRows[i].Order_Exec;
    }
    orderSet.push(sortedRows[i]);
    if (i == sortedRows.length - 1) {
      orderArray.push(orderSet);
    }
  }

  orderNum = 1;

  //Remove below after test and uncomment up
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
        await beginExecution(0);
        console.log("Removing task no. " + taskId);
        TaskManager.remove(taskId);
      });
    }
    else {
      // Handle periodic task
      var task = scheduler.scheduleJob("Job1", timeString, timezone, async function () {
        console.log('starting task');
        await beginExecution(0);
        console.log("Execution complete" + taskId);
        logIds = await createLogs(req.body,req.user.id);
      });
    }

    TaskManager.update(taskId,task);

  }
  else {
    beginExecution(0);
  }
  res.json({
    status: "success"
  });

  //beginExecution(0);

  async function beginExecution(index) {
    let rows = orderArray[index];
    let rowsPlaceholder = rows;
    errorCode = false;

    index++;
    rows.forEach(async function (row, row_i) {
      console.log('starting with:' + row.id);

      scriptName = row.scriptName;
      machineIds = [row.id];
      folder = row.folderKey;
      machineLogId = row.logId;

      try {
        console.log("Entered try & catch");
        let returnCode = await automationActions.runScript(
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
          logIds,
          machineLogId
        );

        console.log('Successfull results for ' + row.id);
        row.errorCode = returnCode;
        row.status = 'completed';

        //Check if all rows are completed before proceeding with next group of order
        allStatus = true;
        console.log("Global Error Status = " + errorCode);

        rowsPlaceholder.forEach(function (tempRow, theIndex) {
          if (!('status' in tempRow)) {
            console.log("changing status");
            allStatus = false;
          }
        });

        rowsPlaceholder.some(function (tempRow, theIndex) {
          console.log("ROW GROUP -> ");
          console.log("ROW GROUP INDEX -> " + theIndex + " row ID = " + tempRow.id);

          if (('errorCode' in tempRow) && (tempRow.errorCode != 0) && (typeof tempRow.errorCode != 'undefined')) {
            errorCode = true;
            filteredRow = rows.filter(obj => {
              return obj.id === tempRow.id
            })
            filteredRow[0].errorCode = undefined;
            console.log('RRunniign the loop for index ' + theIndex);
          }
          return errorCode;
        })
        console.log("Schedule AT = " + scheduleAt);
        //Stop execution if error is returned
        if (errorCode && !continueOnErrors) {
          console.log('Found an error. Stopping script execution');
          for (index; index < orderArray.length; index++) {
            let leftRows = orderArray[index];
            leftRows.forEach(async function (row) {
              createLog(row, isImmediate, {
                scheduleAt,
                emailAddress,
                timezone
              },
                logIds);
            })
          };
          /* res.json({
            status: "failed"
          }); */
          return;
        }
        else if (allStatus) {
          console.log("All status is true");
          isImmediate = true;
          if (index < orderArray.length) {
            errorCode = false;
            beginExecution(index);
          }
          else {
            console.log("Returning after successful execution");
            /* res.json({
              status: "success"
            }); */ // Send response after all scripts have run. Otherwise HTTP_HEADERS_SENT will be thrown
            return;
          }
        }

      } catch (error) {
        if (continueOnErrors) {
          console.log('Found Errors. Skipping to next set of rows');
          beginExecution(index);
        }
        /* res.status(400).json({
          status: "error",
          error: error.message
        }); */
      }
      isImmediate = true;
    })
  }
});


async function createLogs(data, uid) {
  let {
    scheduleAt,
    timezone = '',
  } = data;
  const logIdsArray = [];
  const now = Date.now();
  const scheduledAt = typeof scheduleAt != 'undefined' ? scheduleAt : null;

  for (var i = 0; i < sortedRows.length; i++) {
    machineId = sortedRows[i].id;
    let scriptName = sortedRows[i].scriptName;
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

    sortedRows[i].logId = log.id;
    automationActions.logger.notifyListeners(log, automationActions.getUid());
  }
  return logIdsArray;
}

async function createLog(theRow, isImmediate, options, logIds) {

  let id = theRow.id;
  let scriptName = theRow.scriptName;
  let log = logIds.filter(logs => (id == logs.machine && theRow.logId == logs.log.dataValues.id))[0].log;
  const now = Date.now();
  let runAt;
  let emailAddress = options.emailAddress;
  if (!isImmediate) {
    const { scheduleAt } = options;
    // if (
    //   typeof scheduleAt !== "number" ||
    //   !new Date(scheduleAt).getTime() ||
    //   scheduleAt < Date.now()
    // ) {
    //   throw new Error("Invalid scheduleAt parameter");
    // }
    runAt = scheduleAt;
  }
  if (!runAt) {
    runAt = now;
  }
  const immediate = runAt === now;
  const scheduledAt = options.hasOwnProperty('scheduleAt') ? options.scheduleAt : null;

  log.dataValues.status = 'error';
  log.dataValues.uId = Math.floor(Math.random() * Math.floor(300));
  automationActions.logger.notifyListeners(log, automationActions.getUid());
  if (emailAddress) {
    automationActions.mailer.sendMail(`The script ${scriptName} could not be executed because a previous step in the process had a Warning/Error. Please check`, emailAddress).catch(console.error);
  }
}

module.exports = router;
