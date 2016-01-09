'use strict';

var passport = require('../lib/passport');

var controller = {
//    root : {},
    auth : {
        auth : passport.authenticate('localRegister')
    },
    command : {}
};

module.exports = controller;
