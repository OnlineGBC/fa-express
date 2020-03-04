const express = require('express');

const router = express.Router();
const { database } = require('../container');

/* GET users listing. */
router.get('/', (req, res) => {
  res.render('logs', {
    title: 'Robotics Process Automation',
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  database.logsModel.findOne({ where: { id } })
    .then((result) => {
      if (!result) {
        return res.redirect('/logs');
      }
      const content = result.content && result.content.toString('utf8');
      res.render('log-detail', {
        data: result,
        content,
      });
    });
});

module.exports = router;
