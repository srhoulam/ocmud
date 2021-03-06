'use strict';

const fs = require('fs');
const path = require('path');
let mongoose = require('mongoose');
mongoose.Promise = Promise;
process.env.MONGO_URI || require('dotenv').load();

fs.readdirSync(__dirname).forEach(function(file) {
    if(file === 'index.js') {
        return;
    }

    let modulePath = path.join(__dirname, file);

    require(modulePath);
});

mongoose.connect(process.env.MONGO_URI);

module.exports = mongoose;
