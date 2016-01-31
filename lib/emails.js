'use strict';

const sendEmail = require('./mail');

function sendConfirmationEmail(user) {
    return sendEmail(
        user.email,
        "Confirm your OCMUD account",
        "Your confirmation code is: " + user.emailConfirmCode +
            "\nPlease copy and paste this into OCMUD to confirm your account." +
            "\nIf you did not create an account on OCMUD, please ignore this email."
    );
}

// function sendVisitEmail(location) {

// }

module.exports = {
    confirm : sendConfirmationEmail
};
