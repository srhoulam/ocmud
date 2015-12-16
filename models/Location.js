'use strict';

var mongoose = require('mongoose');
var selfRefPlugin = require('mongoose-selfref');
var Schema = mongoose.Schema;

var locationSchema = new Schema({
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },
    n : {
        type : Schema.Types.ObjectId,
        ref : 'Location'
    },
    e : {
        type : Schema.Types.ObjectId,
        ref : 'Location'
    },
    w : {
        type : Schema.Types.ObjectId,
        ref : 'Location'
    },
    s : {
        type : Schema.Types.ObjectId,
        ref : 'Location'
    }
});

locationSchema.plugin(selfRefPlugin, {
    keys : ['n', 'e', 'w', 's']
});

module.exports = locationSchema;
