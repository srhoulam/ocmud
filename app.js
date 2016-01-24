var express = require('express');
//var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var session = require('express-session');
var sessionStore = require('./lib/sessionStore');
var uuid = require('uuid');
var passport = require('./lib/passport');
var cors = require('cors');

var app = express();

/** DOC
 *
 *  The purpose of the express portion of this application
 *      is for the authentication request. The rest will be
 *      handled via socket.io
 *
 */

// ensure environment variables are loaded
process.env.SESSION_SECRET || require('dotenv').load();

// apply middleware to express instance
app.use(logger(app.get('env') === 'development' ? 'dev' : 'combined'));
app.use(cors({
    origin : '*', // for now
    credentials : true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    name : "ocmud.sid",
    secret : process.env.SESSION_SECRET,
    store : sessionStore,
    saveUninitialized : false,
    resave : false,
    genid : function() {
        return uuid.v4({
            rng : uuid.nodeRNG
        });
    }
}));

// auth middleware
app.use(passport.initialize());
app.use(passport.session());

// routers
app.use('/auth', require('./routes/auth'));

//  serve front-end from same origin
//      socket.io won't send the session cookie otherwise
//
//  remove this for production and use a reverse proxy
//      to serve the files from the same origin as the app
app.use('/pub', express.static(__dirname + "/../ocmud-fe"));

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
