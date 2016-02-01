'use strict';

const sendEmail = require('./mail');
const Location = require('../models').model('Location');

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
    return Location.populate(location, {
        path : 'owner',
        model : 'User'
    }).then(function(popLoc) {
        if(popLoc.owner.emailConfirmed) {
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
        throw new Error("`sendConnectEmail` called without sufficient parameters.");
    }

    return Location.populate(location, {
        path : 'owner',
        model : 'User'
    }).then(function(popLoc) {
        if(popLoc.owner.emailConfirmed) {
            return sendEmail(
                popLoc.owner.email,
                "Someone has connected to one of your locations!",
                `${details.who} has attached ${details.locName} to the ${details.exit} exit of ${popLoc.name}.`
            );
        }
    });
}

module.exports = {
    confirm : sendConfirmationEmail,
    visit : sendVisitEmail,
    connect : sendConnectEmail
};
