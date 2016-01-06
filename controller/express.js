'use strict';

var passport = require('../lib/passport');

var controller = {
    root : {},
    auth : {
        post : passport.authenticate('localRegister')
    },
    command : {}
};
