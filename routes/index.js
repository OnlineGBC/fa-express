const express = require('express');

const { database } = require('../container');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const router = express.Router();


passport.deserializeUser(async function (id, cb) {
  console.log("deserializing");
  let user = await database.getUserById(id);
  return cb(null,user);
});



router.use(passport.initialize());
router.use(passport.session());


function loggedIn(req, res, next) {
  if (req.user) {
      next();
  } else {
      res.redirect('/login');
  }
}

/* GET home page. */
router.get('/', loggedIn, (req, res) => {
  res.render('index', {
    title: 'Robotics Process Automation',
    name:req.user.fname
  });
});

router.get('/register', (req, res) => {
  let message = req.session.error || '';
  res.render('auth/register', {message});
});

router.get('/login', (req, res) => {
  res.render('auth/login', {message: req.flash('error')});
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
router.get('/favicon.ico', (req, res) => {
  res.statusCode = 200;
  res.end();
});

module.exports = router;
