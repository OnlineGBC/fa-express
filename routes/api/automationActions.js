const express = require("express");
const { automationActions } = require("../../container");

const router = express.Router();

router.post("/", async (req, res) => {
  req.connection.setTimeout(0);
  const {
    isImmediate = true,
    machineIds,
    scriptName,
    scheduleAt,
    emailAddress,
    timezone,
    folder
  } = req.body;

  // Inititate logs
  const now = Date.now();
  const logIds = await createLogs();
  try {
    await automationActions.runScript(
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
      generatedAt
    );
    console.log('done');
    res.json({
      status: "success"
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      error: error.message
    });
  }

  async function createLogs() {
    const logIdsArray = [];
    const scheduledAt = typeof scheduleAt != 'undefined' ? scheduleAt : null;

    for (var i = 0; i < machineIds.length; i++) {
      machineId = machineIds[i];
      let log = await automationActions.database.saveLog(
        machineId,
        null,
        now,
        scheduledAt,
        timezone,
        scriptName
      );
      logIdsArray.push({
        machine: machineId,
        log
      });
      automationActions.logger.notifyListeners(log);
    }
    return logIdsArray;
  }
});

module.exports = router;
