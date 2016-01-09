'use strict';

/** DOC
 *
 *  The purpose of the socket.io potion of this application
 *    is for the (read-only) "explore" mode on the front-end.
 *
 */

var Location = require('../models').model('Location');

var totalConnections = 0;
var io = null;

const direction = ['n', 'e', 'w', 's'];
const directionNames = ['north', 'east', 'west', 'south'];

function onConnection(socket) {
    Location.findRandom().limit(1).exec().then(function(loc) {
        socket.location = loc;
        socket.join('numClients');
    }).then(function() {
        socket.on('disconnect', function() {
            io.emit('numClients', {
                clients : --totalConnections
            });
        });

        socket.on('command', function(cmd) {
            var dirIndex = direction.indexOf(cmd);
            if(dirIndex >= 0) {
                Location.findById(socket.location[cmd]).exec().then(function(loc) {
                    socket.location = loc;
                    socket.emit('info', "You move " + directionNames[dirIndex] + ".");
                });
            } else if(cmd === 'look') {
                let locFeatures = Object.keys(socket.location.toObject()).filter(function(elem) {
                    return socket.location[elem] !== socket.location.id &&
                        socket.location[elem] !== '__v' &&
                        socket.location[elem] !== 'random';
                });

                socket.emit('options', locFeatures);
            } else {
                socket.emit('info', "Unsupported.");
            }
        });
    }).then(function() {
        io.emit('numClients', {
            clients : ++totalConnections
        });
    }).catch(function() {
        socket.disconnect();
    });
}

function setup(argIo) {
    io = argIo;

    // set CORS origins
    io.origins('*'); // for now

    // set connection handler
    io.on('connection', onConnection);
}

module.exports = setup;
