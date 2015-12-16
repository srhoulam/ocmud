'use strict';

var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');

fs.readdirSync(__dirname).forEach(function(file) {
    if(file === 'index.js') {
        return;
    }

    var modelName = file.split('.js')[0];
    var modulePath = path.join(__dirname, file);

    mongoose.model(modelName, require(modulePath));
});

module.exports = mongoose;
