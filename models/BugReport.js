'use strict';

let mongoose = require('mongoose');
const Schema = mongoose.Schema;

let bugSchema = new Schema({
    owner : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },
    message : {
        type : String,
        required : true
    }
});

module.exports = mongoose.model('BugReport', bugSchema);
