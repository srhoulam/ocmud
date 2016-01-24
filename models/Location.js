'use strict';

var mongoose = require('mongoose');
var selfRefPlugin = require('mongoose-selfreference');
var randomPlugin = require('mongoose-random');
var timeSince = require('../lib/time');
var genName = require('../lib/names');

var Schema = mongoose.Schema;

var locationSchema = new Schema({
    ownerId : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },
    name : String,
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
        var unbound = doc[oppositeDirection].toString() === doc._id.toString() &&
            this[attachDirection].toString() === this._id.toString();
        if(unbound) {
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
locationSchema.methods.notSelfRef = function notSelfRef(attr) {
    return this[attr].toString() !== this._id.toString();
};
locationSchema.methods.genName = function genLocName() {
    // generate a name based on the hour and week
    var t = timeSince();
    var name = genName(t.hours, t.minutes, t.seconds);

    this.name = name;
    return this.save();
};

module.exports = locationSchema;
