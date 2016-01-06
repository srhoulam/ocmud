'use strict';

var mongoose = require('../models'),
    User = mongoose.model('User');
var passport = require('passport');
var LocalRegStrategy = require('passport-local-register').Strategy;

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id).exec().then(function(user) {
        done(null, user);
    }).catch(function(err) {
        done(err);
    });
});

function verify(username, password, done) {
    User.findOne({
        name : username
    }).exec().then(function(user) {
        if(!user) {
            return done(null, false);
        }

        return user.comparePassword(password).then(function(match) {
            // `match` is a boolean indicating whether the submitted password matched
            done(null, match ? user : match);
        });
    }).catch(function(err) {
        done(err);
    });
}
function create(username, password, done) {
    User.create({
        name : username
    }).then(function(newUser) {
        return newUser.setPassword(password);
    }).then(function(user) {
        done(null, user);
    }).catch(function() {
        // passed-in argument is unlikely to be descriptive
        var err = new Error("This username is already in use.");
        done(err);
    });
}

var lrStrat = new LocalRegStrategy(verify, create);

passport.use(lrStrat);

module.exports = passport;
