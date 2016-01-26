'use strict';

const bcrypt = require('bcrypt');
//const validator = require('validator');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');

var userSchema = new Schema({
    name : {
        type : String,
        required : true,
        unique : true
    },
/*    email : {
        type : String,
        required : true,
        validate : [validator.isEmail, "Email fails syntax validation."]
    },
    emailConfirmed : {
        type : Boolean,
        default : false
    },
    emailConfirmCode : {
        type : String
        // does `default` attr accept functions?
        // spin confirmation code generation off into a module in ../lib
    },*/
    digest : String,
    // phone : String, // for twilio integration
    // phoneConfirmed
    // phoneConfirmCode
    locations : {
        type : [Schema.Types.ObjectId],
        ref : 'Location',
        default : []
    }
});

userSchema.plugin(uniqueValidator);

userSchema.methods.comparePassword = function userCmpPassword(password) {
    var self = this;

    return new Promise(function(res, rej) {
        bcrypt.compare(password, self.digest, function(err, match) {
            if(err) {
                rej(err);
                return;
            }

            res(match);
        });
    });
};

userSchema.methods.setPassword = function userSetPassword(password) {
    var self = this;

    return (new Promise(function saltExec(res, rej) {
        bcrypt.genSalt(16, function(err, salt) {
            if(err) {
                rej(err);
                return;
            }

            res(salt);
        });
    })).then(function(salt) {
        return new Promise(function hashExec(res, rej) {
            bcrypt.hash(password, salt, function(err, digest) {
                if(err) {
                    rej(err);
                    return;
                }

                res(digest);
            });
        });
    }).then(function(digest) {
        self.digest = digest;
        return self.save();
    });
};

userSchema.methods.addLocation = function userAddLoc(location) {
    this.locations.push(location.id);
    return this.save();
};

module.exports = userSchema;
