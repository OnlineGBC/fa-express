const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Robotics Process Automation',
  });
});

router.get('/register', (req, res) => {
  res.render('auth/register', {message: req.flash('error')});
});

router.get('/login', (req, res) => {
  res.render('auth/login', {message: req.flash('error')});
});

router.get('/welcome', (req, res) => {
  res.render('auth/welcome', {name: req.user.email});
});

router.get('/favicon.ico', (req, res) => {
  res.statusCode = 200;
  res.end();
});

module.exports = router;
