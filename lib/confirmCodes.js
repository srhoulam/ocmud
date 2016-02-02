'use strict';

let crypto = require('crypto');
let uuid = require('uuid');

/** SECURITY
 *
 *  I don't want to burn entropy generating unnecessary
 *      random data per account registration. Instead,
 *      I'll be using a hash of a static application
 *      secret, a UUIDv1 (a timestamp), and the password
 *      digest.

 *  The anticipated benefits are:
 *      Using the digest effectively puts the 128-bit
 *          CS-random salt between an attacker and the
 *          confirmation code they're trying to predict.
 *      Making the confirmation code dependent on time
 *          prevents the use of an email confirmation
 *          code to fraudulently confirm a phone number
 *          (i.e., a replay attack), using my application
 *          as a harassment machine.
 *      The application secret raises the cost of an attack,
 *          requiring that an attacker get filesystem access
 *          under the application's credentials (or better),
 *          in addition to a database dump, in order to be
 *          able to fully predict the code.

 *  The anticipated costs are:
 *      Having to generate an application secret once and
 *          store it.
 *          Negligible.
 *      Running SHA256 at least once per account.
 *          Cheaper than depleting the entropy pool
 *              and having the application block when
 *              seeding an RNG instance. (`crypto.randomBytes`
 *              seems to work this way.)
 */

process.env.APP_SECRET || require('dotenv').load();

function genCode(digest) {
    let hasher = crypto.createHash('SHA256');
    hasher.write(process.env.APP_SECRET);
    hasher.write(uuid.v1());
    hasher.write(digest);
    hasher.end();

    return hasher.read();
}
function genEmailCode(digest) {
    return genCode(digest).
        toString('base64').
        replace('/', ''); // for URL-safety
}
function genPhoneCode(digest) {
    return genCode(digest).
        toString('hex').
        toUpperCase().
        slice(0, 6);
}

module.exports = {
    email : genEmailCode,
    phone : genPhoneCode
};
