'use strict';

const passport = require('../lib/passport');
const BugReport = require('../models').model('BugReport');

let controller = {
    auth : passport.authenticate('localRegister'),
    postAuth : function(req, res) {
        return res.sendStatus(200);
    },
    bug : function(req, res) {
        BugReport.create({
            owner : req.user && req.user.id,
            message : req.body.report
        }).then(function() {
            res.sendStatus(200);
        });
    }
};

module.exports = controller;
