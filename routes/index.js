const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Robotics Process Automation',
  });
});

router.get('/favicon.ico', (req, res) => {
  res.statusCode = 200;
  res.end();
});

module.exports = router;
