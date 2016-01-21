'use strict';

var router = require('express').Router();
var ctrl = require('../controller/express').command;

router.route('/:command').patch(ctrl.patch);

module.exports = router;
