'use strict';

const mongoose = require('../models'),
    User = mongoose.model('User');
const passport = require('passport');
const LocalRegStrategy = require('passport-local-register').Strategy;

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

function verify(req, username, password, done) {
    User.findOne({
        name : username
    }).exec().then(function(user) {
        if(!user) {
            return done();
        }

        return user.comparePassword(password).then(function(match) {
            // `match` is a boolean indicating whether the submitted password matched
            done(null, match ? user : match);
        });
    }).catch(function(err) {
        done(err);
    });
}
function create(req, username, password, done) {
    User.create({
        name : username,
        email : req.body.email
    }).then(function(newUser) {
        return newUser.setPassword(password);
    }).then(function(user) {
        return user.setConfirmCode('email');
    }).then(function(user) {
        done(null, user);
    }).catch(function() {
        var err = new Error("This username or email is already in use or your email is invalid.");
        done(err);
    });
}

var lrStrat = new LocalRegStrategy({
    passReqToCallback : true
}, verify, create);

passport.use(lrStrat);

module.exports = passport;
