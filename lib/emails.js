'use strict';

const sendEmail = require('./mail');
const Location = require('../models').model('Location');

function sendConfirmationEmail(user) {
    return sendEmail(
        user.email,
        "Confirm your OCMUD account",
        "Your confirmation code is: " + user.emailConfirmCode +
            "\nPlease copy and paste this into OCMUD to confirm your account." +
            "\nIf you did not create an account on OCMUD, please ignore this email."
    );
}

function sendVisitEmail(location, visitor) {
    return Location.populate(location, {
        path : 'owner',
        model : 'User'
    }).then(function(popLoc) {
        if(popLoc.owner.emailConfirmed) {
            return sendEmail(
                popLoc.owner.email,
                "Someone has visited one of your locations!",
                visitor + " has visited " + popLoc.name + ". Go you!"
            );
        }
    });
}

module.exports = {
    confirm : sendConfirmationEmail,
    visit : sendVisitEmail
};
