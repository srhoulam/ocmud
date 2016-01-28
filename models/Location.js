'use strict';

var mongoose = require('mongoose');
const Schema = mongoose.Schema;
var Location;
const Surface = require('./Surface');
const selfRefPlugin = require('mongoose-selfreference');
const randomPlugin = require('mongoose-random');
const timeSince = require('../lib/time');
const generateName = require('../lib/names').location;

var locationSchema = new Schema({
    owner : {
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
    surface : {
        type : Schema.Types.ObjectId,
        ref : 'Surface'
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
locationSchema.methods.createSurface = function locMkSurface() {
    var self = this;

    return Surface.create({
        location : this.id
    }).then(function(newSurface) {
        self.surface = newSurface.id;
        return self.save();
    });
};

function populateWritings(loc) {
    if(loc.surface) {
        return new Promise(function popExec(resolve, reject) {
            Location.populate(loc, [{
                path : 'surface.writings',
                model : 'Writing'
            }], function popCb(err, popDoc) {
                if(err) {
                    return reject(err);
                }

                return resolve(popDoc);
            });
        });
    } else {
        return loc;
    }
}
locationSchema.statics.getInitial = function locGetInitial() {
    return Location.
        findRandom().
        limit(1).
        populate('surface').
        exec().
        then(function(locs) {
            if(locs.length === 0) {
                throw new Error("No Locations exist.");
            }

            return locs[0];
        }).
        then(populateWritings);
};
locationSchema.statics.findPopulated = function locFindPopulated(id) {
    return Location.
        findById(id).
        populate('surface').
        exec().
        then(populateWritings);
};

module.exports = Location = mongoose.model('Location', locationSchema);
