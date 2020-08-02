const express = require('express');

const router = express.Router();
const { database } = require('../container');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');



passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  async function (email, password, cb) {
    let user = await database.findUser(email);
    if (user) {
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        console.log('Logged in');

        return cb(null, user);
      }
      else {
        console.log('Invalid password');
        return cb(null, false, { message: "Invalid credentials" });
      }
    }
    else {
      console.log("User not exists");
      return cb(null, false, { message: "Invalid credentials" });
    }
  }
));

passport.serializeUser(function (user, cb) {
  //console.log("USER "+user);
  cb(null, user.id);
});

passport.deserializeUser(async function (id, cb) {
  console.log("deserializing");
  let user = await database.getUserById(id);
  return cb(null,user);
});



router.use(passport.initialize());
router.use(passport.session());

router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
  }),
  function (req, res) {
    console.log(req.user.email);
    res.redirect('/');
  }
)

router.post('/register',
  async function (req, res) {

    email = req.body.email;
    let userExists = await database.findUser(email);

    if (!userExists) {
      password = req.body.password;
      user = database.createUser(email, password);

      // redirect to homepage
      res.redirect('/login');
    }
    else {
      res.redirect('/register');
    }
  }
);

module.exports = router;
