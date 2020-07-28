require('dotenv').config();
const express = require('express');
const session = require('express-session');
var cookieParser = require('cookie-parser');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const index = require('./routes/index');
const users = require('./routes/users');
const log = require('./routes/log');
const api = require('./routes/api');
const auth = require('./routes/auth');
const flash = require('connect-flash');

require('./container');


const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(flash()); // Used for displaying auth messages



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cookieParser()) // required before session.
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}))

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/logs', express.static(path.join(__dirname, 'logs')));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: 'tmp',
  }),
);

app.use('/', index);
app.use('/users', users);
app.use('/logs', log);
app.use('/api', api);
app.use('/auth', auth);


app.use(logger('dev'));
// app.use(express.urlencoded({ extended: false }));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
