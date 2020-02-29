const express = require('express');
const { automationActions } = require('../../container');

const router = express.Router();

router.post('/', async (req, res) => {
  const {
    isImmediate = true,
    machineIds,
    scriptName,
    scheduleAt,
    emailAddress,
  } = req.body;

  try {
    await automationActions.runScript(scriptName, machineIds, isImmediate, {
      scheduleAt,
      emailAddress,
    });
    res.json({
      status: 'success',
    });
  } catch (error) {
    res.status(400)
      .json({
        status: 'error',
        error: error.message,
      });
  }
});

module.exports = router;
