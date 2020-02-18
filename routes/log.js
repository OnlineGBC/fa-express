const express = require("express");
const router = express.Router();
const model = require("../model");

/* GET users listing. */
router.get("/", function(req, res, next) {
  res.render("logs", {
    title: "Robotics Process Automation"
  });
});

router.get("/:id", function(req, res, next) {
  const id = req.params.id;
  model.Logs.findOne({ where: { id: id } }).then(function(result) {
    let bytesView = new Uint8Array(result.content);
    let content = unescape(new TextDecoder().decode(bytesView));
    res.render("log-detail", {
      data: result,
      content: content
    });
  });
});
module.exports = router;
