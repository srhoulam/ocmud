'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    ipAddr : {
        type : String,
        required : true
    },
    userAgent : {
        type : String,
        required : true
    }
});

module.exports = userSchema;
