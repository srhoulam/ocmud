'use strict';

var mongoose = require('mongoose');
var Location = mongoose.model('LocTest', require('../models/Location'));
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/ocmud-testing");

describe("ocmud location", function() {
    describe("should begin with self-referential n, e, w, s keys", function() {
        var loc;

        beforeEach(function(done) {
            Location.create({}).then(function(newLoc) {
                return newLoc.save();
            }).then(function(newLoc) {
                loc = newLoc;
            }).catch(function(err) {
                fail(err);
            }).then(function() {
                done();
            });
        });

        it("", function() {
            expect(loc === undefined).toBe(false);
            expect(typeof loc).toBe('object');
            expect(typeof loc._id.constructor).toBe('function');
            expect(loc.n.toString() === loc._id.toString()).toBe(true);
            expect(loc.e.toString() === loc._id.toString()).toBe(true);
            expect(loc.w.toString() === loc._id.toString()).toBe(true);
            expect(loc.s.toString() === loc._id.toString()).toBe(true);
        });
    });
});
