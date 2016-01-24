'use strict';

var passport = require('../lib/passport');

var controller = {
    auth : passport.authenticate('localRegister')
};

module.exports = controller;
