'use strict';

let mongoose = require('mongoose');
const Schema = mongoose.Schema;

let writingSchema = new Schema({
    owner : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },
    surface : {
        type : Schema.Types.ObjectId,
        ref : 'Surface',
        required : true
    },
    message : {
        type : String,
        required : true
    }
});

module.exports = mongoose.model('Writing', writingSchema);
