'use strict';

let express = require('express');
//let path = require('path');
let logger = require('morgan');
let bodyParser = require('body-parser');

let session = require('express-session');
let sessionStore = require('./lib/sessionStore');
let uuid = require('uuid');
let passport = require('./lib/passport');
let cors = require('cors');

let app = express();
let appEnvironment = app.get('env');

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
    },
    cookie : {
        maxAge : 5 * 60 * 1000
    }
}));

// auth middleware
app.use(passport.initialize());
app.use(passport.session());

// routers
app.use('/auth', require('./routes/auth'));
app.use('/bug', require('./routes/bug'));

//  serve front-end from same origin
//      socket.io won't send the session cookie otherwise
//
//  remove this for production and use a reverse proxy
//      to serve the files from the same origin as the app
if(appEnvironment === 'development') {
    app.use('/pub', express.static(__dirname + "/../ocmud-fe"));
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (appEnvironment === 'development') {
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
