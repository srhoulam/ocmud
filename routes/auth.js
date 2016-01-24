'use strict';

var router = require('express').Router();
var ctrl = require('../controller/express');

router.route('/').post(ctrl.auth, ctrl.postAuth);

module.exports = router;
