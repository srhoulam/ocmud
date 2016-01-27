'use strict';

const mongoose = require('mongoose');
const selfRefPlugin = require('mongoose-selfreference');
const randomPlugin = require('mongoose-random');
const timeSince = require('../lib/time');
const generateName = require('../lib/names').location;

const Schema = mongoose.Schema;

var locationSchema = new Schema({
    ownerId : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },
    name : {
        type : String,
        default : function locNameDefault() {
            // generate a name based on the hour and week
            var t = timeSince();
            return generateName(t.cycles, t.periods, t.ticks);
        }
    },
    description : {
        type : String,
        default : "A rather ordinary place."
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

const directionList = ['n', 'e', 's', 'w'];

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

module.exports = mongoose.model('Location', locationSchema);
