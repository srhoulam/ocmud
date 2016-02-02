'use strict';

const passport = require('../lib/passport');

let controller = {
    auth : passport.authenticate('localRegister'),
    postAuth : function(req, res) {
        return res.sendStatus(200);
    }
};

module.exports = controller;
