const express = require('express');
const config = require('../config/config');
const nodemailer = require('nodemailer');
const { database, mailer } = require('../container');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
  //let user = await database.findUser('asd');
  let admin = req.user.admin;
  /* if (!req.user) {
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

router.get('/forgot-password', (req, res) => {
  return res.render("auth/forgot-password",{message:"",error:""});
})

router.post('/forgot-password', async (req,res) => {

  const email = req.body.email;
  let user = await database.findUser(email);
  let error = "";
  let message = "";

  if (!user) {
    return res.render('auth/forgot-password',{error:"No user exists with this email",message});
  }

  const token = jwt.sign({ id: user.id }, process.env.RESET_TOKEN_KEY, { expiresIn: '10m' });
  const emailAddress = user.email;
  const host = req.headers.host;

  user.reset_token = token;
  await user.save();

  const data = `<h3>Click on the link below to generate a new password</h3>
    <p><a href="http://${host}/reset-password/${token}" >Reset Password</a></p>`;
  const transporter = nodemailer.createTransport(config.smtp);
  const info = await transporter.sendMail({
    from: config.emailFrom, // sender address
    to: emailAddress, // list of receivers
    subject: 'Password reset', // Subject line
    html: data, // html body
  });
  return res.render('auth/forgot-password',{error,message:"An email has been sent to you with the reset link"});

})

router.get('/reset-password/:token', async (req, res) => {

  const reset_token = req.params.token;
  jwt.verify(reset_token, process.env.RESET_TOKEN_KEY, function (err, decoded) {
    if (err) {
      return res.status(401).json({ err });
    }
    else {
      return res.render('auth/reset-password',{message:'',reset_token});
    }
  });
})

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
