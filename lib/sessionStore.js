'use strict';

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const db = require('../models');

module.exports = new MongoStore({
    mongooseConnection : db.connection
});
