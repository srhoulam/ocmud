'use strict';

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var db = require('./models');

module.exports = new MongoStore({
    mongooseConnection : db.connection
});
