'use strict';

const bcrypt = require('bcrypt');
const validator = require('validator');
const genCode = require('../lib/confirmCodes');
var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');

var userSchema = new Schema({
    name : {
        type : String,
        required : true,
        unique : true
    },
    digest : String,
    email : {
        type : String,
        required : true,
        unique : true,
        validate : [validator.isEmail, "Invalid email."]
    },
    emailConfirmed : {
        type : Boolean,
        default : false
    },
    emailConfirmCode : {
        type : String
    },
    sendEmails : {
        type : Boolean,
        default : true
    },
    phone : {
        type : String,
        validate : [
            function validatePhone(number) {
                return validator.isMobilePhone(number, 'en-US');
            },
            "Invalid phone number."
        ]
    },
    phoneConfirmed : {
        type : Boolean,
        default : false
    },
    phoneConfirmCode : {
        type : String
    },
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
userSchema.methods.setConfirmCode = function(type) {
    if(type === 'email') {
        this.emailConfirmCode = genCode.email(this.digest);
    } else if(type === 'phone') {
        this.phoneConfirmCode = genCode.phone(this.digest);
    } else {
        throw new Error("Specify type.");
    }

    return this.save();
};
userSchema.methods.addLocation = function userAddLoc(location) {
    this.locations.push(location.id);
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
