'use strict';

const sendEmail = require('./mail');
const Location = require('../models').model('Location');


//  utility functions
function popLocWithOwner(location) {
    return Location.populate(location, {
        path : 'owner',
        model : 'User'
    });
}
function locationCondition(location) {
    return location.owner && location.owner.emailConfirmed;
}

//  methods to export
function sendConfirmationEmail(user) {
    return sendEmail(
        user.email,
        "Confirm your OCMUD account",
        `Your confirmation code is: ${user.emailConfirmCode}
Please copy and paste this into OCMUD to confirm your account.
If you did not create an account on OCMUD, please ignore this email.`
    );
}
function sendVisitEmail(location, visitor) {
    return popLocWithOwner(location).
        then(function(popLoc) {
            if(locationCondition(popLoc)) {
                return sendEmail(
                    popLoc.owner.email,
                    "Someone has visited one of your locations!",
                    `${visitor} has visited ${popLoc.name}. Go you!`
                );
            }
        });
}
function sendConnectEmail(location, details) {
    if(!(details.who && details.exit && details.locName)) {
        throw new Error("`sendConnectEmail` called without sufficient arguments.");
    }

    return popLocWithOwner(location).
        then(function(popLoc) {
            if(locationCondition(popLoc)) {
                return sendEmail(
                    popLoc.owner.email,
                    "Someone has connected to one of your locations!",
                    `${details.who} has attached ${details.locName} to the ${details.exit}ern exit of ${popLoc.name}.`
                );
            }
        });
}
function sendWriteEmail(location, details) {
    if(!(details.who && details.what)) {
        throw new Error("`sendWriteEmail` called without sufficient arguments.");
    }

    return popLocWithOwner(location).
        then(function(popLoc) {
            if(locationCondition(popLoc)) {
                return sendEmail(
                    popLoc.owner.email,
                    "Someone has written at one of your locations!",
                    `${details.who} has written "${details.what}" at ${popLoc.name}.`
                );
            }
        });
}

module.exports = {
    confirm : sendConfirmationEmail,
    visit : sendVisitEmail,
    connect : sendConnectEmail,
    write : sendWriteEmail
};
