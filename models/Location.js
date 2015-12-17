'use strict';

var mongoose = require('mongoose');
var selfRefPlugin = require('mongoose-selfreference');
var randomPlugin = require('mongoose-random');
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

locationSchema.plugin(randomPlugin);

var directionList = ['n', 'e', 's', 'w'];

function attacherFactory(attachDirection) {
    var oppositeDirection = directionList[
        (directionList.indexOf(attachDirection) + 2) % directionList.length
    ];

    return function(doc) {
        // source and target locations are not already bound in the relevant directions
        if(doc[oppositeDirection] === doc._id && this[attachDirection] === this._id) {
            doc[oppositeDirection] = this._id;
            this[attachDirection] = doc._id;

            return Promise.all([this.save(), doc.save()]);
        } else {
            throw new RangeError("Location: direction is already bound");
        }
    };
}

locationSchema.methods.attachNorth = attacherFactory('n');
locationSchema.methods.attachSouth = attacherFactory('s');
locationSchema.methods.attachEast = attacherFactory('e');
locationSchema.methods.attachWest = attacherFactory('w');

module.exports = locationSchema;
