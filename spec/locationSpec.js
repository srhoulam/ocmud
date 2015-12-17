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

    describe("should attach other locations at", function() {
        var locOne, locTwo;

        beforeEach(function(done) {
            Promise.all([Location.create({}), Location.create({})]).
                then(function(locs) {
                    locOne = locs[0];
                    locTwo = locs[1];
                    //
                }).catch(function(err) {
                    fail(err);
                }).then(function() {
                    done();
                });
        });

        describe("north key", function() {
            beforeEach(function(done) {
                locOne.attachNorth(locTwo).
                    then(function() {
                        done();
                    });
            });

            it('', function() {
                expect(locOne.n === undefined).toBe(false);
                expect(locTwo.s === undefined).toBe(false);

                expect(locOne.n.toString() === locOne._id.toString()).
                    toBe(false);
                expect(locTwo.s.toString() === locTwo._id.toString()).
                    toBe(false);

                expect(locOne.n.toString() === locTwo._id.toString()).
                    toBe(true);
                expect(locTwo.s.toString() === locOne._id.toString()).
                    toBe(true);
            });
        });
        describe("south key", function() {
            beforeEach(function(done) {
                locOne.attachSouth(locTwo).
                    then(function() {
                        done();
                    });
            });

            it('', function() {
                expect(locOne.s === undefined).toBe(false);
                expect(locTwo.n === undefined).toBe(false);

                expect(locOne.s.toString() === locOne._id.toString()).
                    toBe(false);
                expect(locTwo.n.toString() === locTwo._id.toString()).
                    toBe(false);

                expect(locOne.s.toString() === locTwo._id.toString()).
                    toBe(true);
                expect(locTwo.n.toString() === locOne._id.toString()).
                    toBe(true);
            });
        });
        describe("east key", function() {
            beforeEach(function(done) {
                locOne.attachEast(locTwo).
                    then(function() {
                        done();
                    });
            });

            it('', function() {
                expect(locOne.e === undefined).toBe(false);
                expect(locTwo.w === undefined).toBe(false);

                expect(locOne.e.toString() === locOne._id.toString()).
                    toBe(false);
                expect(locTwo.w.toString() === locTwo._id.toString()).
                    toBe(false);

                expect(locOne.e.toString() === locTwo._id.toString()).
                    toBe(true);
                expect(locTwo.w.toString() === locOne._id.toString()).
                    toBe(true);
            });
        });
        describe("west key", function() {
            beforeEach(function(done) {
                locOne.attachWest(locTwo).
                    then(function() {
                        done();
                    });
            });

            it('', function() {
                expect(locOne.w === undefined).toBe(false);
                expect(locTwo.e === undefined).toBe(false);

                expect(locOne.w.toString() === locOne._id.toString()).
                    toBe(false);
                expect(locTwo.e.toString() === locTwo._id.toString()).
                    toBe(false);

                expect(locOne.w.toString() === locTwo._id.toString()).
                    toBe(true);
                expect(locTwo.e.toString() === locOne._id.toString()).
                    toBe(true);
            });
        });
    });
});
