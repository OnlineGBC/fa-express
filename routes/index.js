const express = require('express');
const { database } = require('../container');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const router = express.Router();
const bcrypt = require('bcrypt');

passport.deserializeUser(async function (id, cb) {
  let user = await database.getUserById(id);
  return cb(null, user);
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
router.get('/', loggedIn, async (req, res) => {

  // Uncomment for development
  /* let user = await database.findUser('asd');
  if (!req.user) {
    req.login(user, function (err) {
      if (err) { return next(err); }
      return res.render('index', {
        title: 'Robotics Process Automation',
        //name:req.user.fname
        name: 'test',
        admin
      });
    });
  } */
  let admin = user.admin;
  res.render('index', {
    title: 'Robotics Process Automation',
    name:req.user.fname,
    admin
  });
});


router.get('/profile', loggedIn, async (req, res) => {
  let user = req.user;
  let message = req.session.error || '';
  res.render('profile', { user, message });
})

router.get('/register', (req, res) => {
  let message = req.session.error || '';
  res.render('auth/register', { message });
});

router.get('/login', (req, res) => {
  res.render('auth/login', { message: req.flash('error') });
});

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

router.post('/edit', loggedIn, async (req, res) => {
  email = req.body.email;

  old_password = req.body.old_password;
  password = req.body.password;
  c_password = req.body.c_password;

  if (old_password != '') {

    // Change to req.user.pass
    match_pass = req.user.password;
    console.log(match_pass);
    const match = await bcrypt.compare(old_password, match_pass);
    if (!match) {
      req.session.error = "Incorrect password";
      res.redirect('/profile');
      return;
    }
    else if ((password != c_password) && (old_password != '')) {
      req.session.error = "Passwords do not match";
      res.redirect('/profile');
      return;
    }
  }
  req.session.error = "";
  fname = req.body.fname;
  lname = req.body.lname;
  email = email;
  await database.updateUser(fname, lname, email, password, req.user.id);
  res.redirect('/profile');

});

router.get('/favicon.ico', (req, res) => {
  res.statusCode = 200;
  res.end();
});

module.exports = router;
