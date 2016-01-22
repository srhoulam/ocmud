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
        socket.location = loc[0];
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
                if(socket.location[cmd].toString() === socket.location._id.toString()) {
                    // socket.emit('moved', false);
                    socket.emit('info', "There is no exit in that direction.");
                } else {
                    Location.findById(socket.location[cmd]).exec().then(function(loc) {
                        socket.location = loc;
                        // socket.emit('moved', true);
                        socket.emit('info', "You move " + directionNames[dirIndex] + ".");
                    });
                }
            } else if(cmd === 'look') {
                let locFeatures = Object.keys(socket.location.toObject()).filter(function(elem) {
                    return direction.indexOf(elem) >= 0 &&
                        socket.location[elem].toString() !== socket.location._id.toString();
                });

                socket.emit('sight', {
                    desc : socket.location.description || "A rather ordinary place.",
                    exits : locFeatures
                });
            } else {
                socket.emit('info', "Unsupported."); // for now
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
//    io.origins('localhost:3000'); // for now

    // set connection handler
    io.on('connection', onConnection);
}

module.exports = setup;
