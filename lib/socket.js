'use strict';

/** DOC
 *
 *  The purpose of the socket.io portion of this application
 *      is for the (mostly read-only) "explore" mode as well
 *      as the authenticated "create" mode.
 *
 */

const Location = require('../models').model('Location');
const sessionStore = require('./sessionStore');
const passportSocketIo = require('passport.socketio');
const processCommand = require('../controller/socket');

// global variables
var totalConnections = 0;
var io = null;

// global constants
const originOptions = {
    name : "The Origin",
    description : "The beginning of All Things."
};

//  Rather than instantiating and garbage collecting many functions
//      per socket, retain single instances of each needed function
//      where possible.
const func = {
    disconnect : function disconnectHandler() {
        io.emit('numClients', {
            clients : --totalConnections
        });
    },
    createOrigin : function createOrigin() {
        //  create origin if no Locations exist
        return Location.create(originOptions);
    },
    incrementClients : function incrementClients() {
        io.emit('numClients', {
            clients : ++totalConnections
        });
    },
    auth : {
        success : function onAuthSuccess(data, accept) {
            return accept();
        },
        fail : function onAuthFail(data, message, error, accept) {
            if(error) {
                throw new Error(message);
            }

            return accept();
        }
    }
};

//  ensure that the session secret is at hand
process.env.SESSION_SECRET || require('dotenv').load();
const authorizer = passportSocketIo.authorize({
    key : 'ocmud.sid',
    secret : process.env.SESSION_SECRET,
    store : sessionStore,
    success : func.auth.success,
    fail : func.auth.fail
});
// end global constants

function setHandlers(socket) {
    socket.on('disconnect', func.disconnect);

    socket.on('command', function(cmd) {
        processCommand(socket, cmd);
    });
}

function onConnection(socket) {
    debugger;
    //  choose random starting point
    Location.findRandom().limit(1).exec().then(function(loc) {
        socket.join('numClients');

        if(loc.length === 0) {
            throw new Error("No Locations exist.");
        }

        return loc[0];
    }).catch(func.createOrigin
    ).then(function(loc) {
        socket.location = loc;
    }).then(function() {
        setHandlers(socket);
    }).then(func.incrementClients
    ).catch(function() {
        socket.disconnect();
    });
}

function setup(argIo) {
    io = argIo;

    //  set CORS origins
//    io.origins(...); // for now

    //  use authentication
    io.use(authorizer);

    //  set connection handler
    io.on('connection', onConnection);
}

module.exports = setup;
