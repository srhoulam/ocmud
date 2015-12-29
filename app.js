var express = require('express');
//var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var db = require('./models');
var uuid = require('uuid');

var routes = require('./routes/index');
// var users = require('./routes/users');

var app = express();

// ensure environment variables are loaded
process.env.SESSION_SECRET || require('dotenv').load();

// apply middleware to express instance
app.use(logger(app.get('env') === 'development' ? 'dev' : 'combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret : process.env.SESSION_SECRET,
  store : new MongoStore({
    mongooseConnection : db.connection
  }),
  saveUnitialized : false,
  resave : false,
  genid : function() {
    return uuid.v4({
      rng : uuid.nodeRNG
    });
  }
}));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err.stack
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});


module.exports = app;
