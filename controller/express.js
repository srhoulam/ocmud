'use strict';

var passport = require('../lib/passport');
var Location = require('../models').model('Location');

var controller = {
//    root : {},
    auth : {
        auth : passport.authenticate('localRegister'),
        postAuth : function(req, res, next) {
            Location.findRandom().limit(1).exec().then(function(loc) {
                req.session.location = loc;
                next();
            }).catch(function(err) {
                next(err);
            });
        }
    },
    command : {
        patch : function(req, res, next) {
            //
        }
    }
};

module.exports = controller;
