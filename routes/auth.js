'use strict';

const router = require('express').Router();
const ctrl = require('../controller/express');

router.route('/').
    post(ctrl.auth).
    post(ctrl.postAuth);

module.exports = router;
