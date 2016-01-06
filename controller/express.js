'use strict';

var passport = require('../lib/passport');

var controller = {
    root : {},
    auth : {
        auth : passport.authenticate('localRegister'),
        term : function(req, res, next) {
            // set email, etc. from `req.body` on `req.user` here
            next();
        }
    },
    command : {}
};
