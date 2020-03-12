const express = require("express");
const actionUtils = require("../../src/actionUtils");

const router = express.Router();

router.post("/", async (req, res) => {
  const { body, files } = req;
  const { fileName, extension, menuTitle, fileContents, folder } = body;
  if (fileName && extension && menuTitle && (fileContents || files.file)) {
    try {
      const fileInfo = {};
      if (fileContents) {
        fileInfo.contents = fileContents;
      } else {
        fileInfo.filePath = files.file.tempFilePath;
      }
      await actionUtils.saveAction(
        fileName,
        extension,
        menuTitle,
        fileInfo,
        folder
      );
      res.json({
        status: "success"
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: error.message
      });
    }
  } else {
    res.status(400).json({
      status: "error",
      error: "invalid data"
    });
  }
});

router.get("/", async (req, res) => {
  const actions = await actionUtils.listActions();
  res.json(actions);
});

router.post("/createsubfolder", async (req, res) => {
  const foldername = req.body.name || "";
  if (foldername == "") return res.json({ status: 0 });

  if (actionUtils.createSubFolder(foldername)) return res.json({ status: 1 });
  return res.json({ status: 0 });
});

router.post("/updatename", async (req, res) => {
  const { filePath, fileName, menuName, type } = req.body;
  const result = await actionUtils.updateFileName(filePath, fileName, menuName, type);
  if (result) return res.json({ status: 1 });
  return res.json({ status: 0 });
});

router.post("/updatefoldename", async (req, res) => {
  const { folderName, folder } = req.body;
  const result = await actionUtils.updateFolderName(folderName, folder);
  if (result) return res.json({ status: 1 });
  return res.json({ status: 0 });
});

router.delete("/deletefile", async (req, res) => {
  const { filePath } = req.body;
  const result = await actionUtils.deleteFile(filePath);
  if (result) return res.json({ status: 1 });
  return res.json({ status: 0 });
});

module.exports = router;
