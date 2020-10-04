const express = require('express');
const router = express.Router();
const { database } = require('../container');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
var twoFactor = require('node-2fa');
const jwt = require('jsonwebtoken');


passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
  async function (req, email, password, cb) {
    let user = await database.findUser(email);
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      const key = req.body.key;
      const secret = user.otp_key;

      if (match && twoFactor.verifyToken(secret, key)) {
        console.log('Logged in');
        return cb(null, user);
      }
      else {
        console.log('Invalid credentials');
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
  return cb(null, user);
});



router.use(passport.initialize());
router.use(passport.session());

router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
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
      c_password = req.body.c_password;

      if (password != c_password) {
        req.session.error = "Passwords do not match";
        res.redirect('/register');
        return;
      }

      let newSecret = twoFactor.generateSecret({ name: 'OnlineGBC', account: email });
      req.session.fname = req.body.fname;
      req.session.lname = req.body.lname;
      req.session.key = newSecret;
      req.session.email = email;
      req.session.password = password;
      req.session.save();
      res.render('auth/2fa', { data: newSecret });
    }
    else {
      req.session.error = "User already exists";
      res.redirect('/register');
    }
  }
);

router.get('/two-factor', function (req, res) {
  let message = req.session.message || '';
  res.render('auth/2fa', { data: req.session.key, message });
})

router.post('/two-factor', function (req, res) {
  let key = req.body.key;
  let secret = req.session.key.secret;
  let email = req.session.email;
  let password = req.session.password;
  let fname = req.session.fname;
  let lname = req.session.lname;

  if (twoFactor.verifyToken(secret, key)) {
    user = database.createUser(email, password, secret, fname, lname);
    res.redirect('/login');
  }
  else {
    req.session.message = 'Invalid Code. Please try again';
    res.redirect('two-factor')
  }

})

router.post('/reset-password', (req, res) => {

  const { password, c_password,token } = req.body;

  jwt.verify(token, process.env.RESET_TOKEN_KEY, async function (err, decoded) {
    if (err) {
      return res.status(401).json({ error: err });
    }
    else {
      const user = await database.userModel.findOne({ where: { reset_token:token } });
      if (!user) {
        return res.status(401).json({ error: "Invalid token" });
      }
      else {
        if (password != c_password) {
          res.render('auth/reset-password', { message: "Passwords do not match",reset_token:token });
        }
        else {
          bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, async function (err, hash) {
              if (!err) {
                user.password = hash;
                user.reset_token = null;
                await user.save();
                res.redirect('/login');
              }
            });
          });
        }
      }
    }
  });
})

module.exports = router;
