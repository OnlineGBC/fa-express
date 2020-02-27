const express = require('express');
const actionUtils = require('../../src/actionUtils');

const router = express.Router();

router.post("/", async (req, res) => {
  const {body, files} = req;
  const {fileName, extension, menuTitle, fileContents} = body;
  if (fileName && extension && menuTitle && (fileContents || files.file)) {
    try {
      const fileInfo = {};
      if (fileContents) {
        fileInfo.contents = fileContents;
      } else {
        fileInfo.filePath = files.file.tempFilePath;
      }
      await actionUtils.saveAction(fileName, extension, menuTitle, fileInfo);
      res.json({
        status: 'success',
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error.message,
      });
    }
  } else {
    res.status(400).json({
      status: 'error',
      error: 'invalid data',
    });
  }
});

router.get("/", async (req, res) => {
  const actions = await actionUtils.listActions();
  res.json(actions);
});

module.exports = router;
