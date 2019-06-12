const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const index = require('./routes/index');
const users = require('./routes/users');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

'use strict';

const mysqlx = require('@mysql/xdevapi');

const options = {
  host: 'localhost',
  port: 33060,
  password: '1qaz@WSX',
  user: 'rpaauto',
  schema: 'FA_RPA' // an error is thrown if it does not exist
};


//  Set up the MySQL Connection
var mysql2      = require('mysql2');
var connection = mysql2.createConnection({
    host     : 'localhost',
    database : 'FA_RPA',
    user     : 'rpaauto',
    password : '1qaz@WSX',
});


app.use(logger('dev'));
// app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


// Make our MySQL connection accessible to our router
  app.use(function(req,res,next){
     req.connection = connection;
     next();
});

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// connection.query('SELECT * FROM FA_RPA.Automation where HostName="USBD11ENT1019"', function (error, results, fields) {
connection.query('SELECT * FROM FA_RPA.Automation', function (error, results, fields) {
    if (error)
        throw error;

    results.forEach(result => {
        console.log(result);
    });
});

connection.end();


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
