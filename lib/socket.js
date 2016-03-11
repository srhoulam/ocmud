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
let processCommand = require('../controller/socket');

// global variables
let totalConnections = 0;
let io = null;

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
        return Location.find({}).exec().then(function(locations) {
            if(locations.length > 0) {
                const msg = "New origin was about to be created while locations exist.";
                throw new Error(msg);
            }

            return Location.create(originOptions);
        });
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
    //  choose random starting point
    Location.getInitial().
        catch(func.createOrigin
        ).then(function(loc) {
            if(socket.request.user.logged_in) {
                socket.join(socket.request.user.id.toString());
            }
            socket.location = loc;
            socket.join('numClients');
            socket.join(loc.id.toString());

            let name;

            if(socket.request.user.logged_in) {
                name = socket.request.user.name;
            } else {
                name = "A stranger";
            }

            socket.broadcast.to(loc.id.toString()).emit(
                'travel',
                `${name} appears.`
            );

            processCommand(socket, {
                command : 'look'
            });
        }).then(function() {
            setHandlers(socket);
        }).then(func.incrementClients
        ).catch(function(err) {
            socket.emit('info', err.message);
            socket.disconnect();
        });
}

function setup(argIo) {
    //  set up globals
    io = argIo;
    processCommand = processCommand(argIo);

    //  set CORS origins
    // io.origins("https://pfbe.saad.rhoulam.com"); // for now

    //  use authentication
    io.use(authorizer);

    //  set connection handler
    io.on('connection', onConnection);
}

module.exports = setup;
