'use strict';

var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Writing = require('./Writing');
const timeSince = require('../lib/time');
const generateName = require('../lib/names').surface;

var surfaceSchema = new Schema({
    name : {
        type : String,
        default : function surfNameDefault() {
            return generateName(Math.floor(timeSince().raw * 3 / 500));
        }
    },
    location : {
        type : Schema.Types.ObjectId,
        ref : 'Location',
        required : true
    },
    writings : {
        type : [Schema.Types.ObjectId],
        ref : 'Writing',
        default : []
    }
});

surfaceSchema.methods.write = function surfaceWrite(ownerId, message) {
    var self = this;

    return Writing.create({
        'owner' : ownerId,
        surface : this.id,
        'message' : message
    }).then(function(newWriting) {
        self.writings.push(newWriting);
        return self.save();
    });
};

module.exports = mongoose.model('Surface', surfaceSchema);
