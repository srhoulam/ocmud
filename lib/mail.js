'use strict';

const nodemailer = require('nodemailer');

(
    process.env.EMAIL_PROTOCOL &&
    process.env.EMAIL_SERVER &&
    process.env.EMAIL_ACCOUNT &&
    process.env.EMAIL_PASSWORD
) || require('dotenv').load();

const connURL = process.env.EMAIL_PROTOCOL +
    escape(
        process.env.EMAIL_ACCOUNT +
        ':' +
        process.env.EMAIL_PASSWORD
    ) + '@' + process.env.EMAIL_SERVER;

const mailer = nodemailer.createTransport(connURL);

function sendMessage(target, subject, message) {
    let options = {
        from : "ocmud <" + process.env.EMAIL_ACCOUNT + ">",
        to : target,
        'subject' : subject,
        text : message
    };

    return new Promise(function mailExec(resolve, reject) {
        mailer.sendMail(options, function(err, info) {
            if(err) {
                return reject(err);
            }

            resolve();
        });
    });
}

module.exports = sendMessage;
