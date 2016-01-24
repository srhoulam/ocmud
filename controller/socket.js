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
const filteredAttrs = [
    '__v', '_id', 'random', 'ownerId',
    'name', 'description', 'surface'
];

const originOptions = {
    name : "The Origin",
    description : "The beginning of All Things."
};

//  Rather than instantiating and garbage collecting many functions
//      per socket, retain single instances of each needed function
//      where possible.
//  Secondarily, simplify the flow of the code by refactoring bulky
//      code into attributes of this object.
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
    incrementClients : function() {
        io.emit('numClients', {
            clients : ++totalConnections
        });
    },
    command : {
        look : function lookHandler(socket) {
            var locFeatures = Object.keys(socket.location.toObject()).filter(function(elem) {
                return filteredAttrs.indexOf(elem) === -1 &&
                    socket.location.notSelfRef(elem);
            });

            socket.emit('sight', {
                name : socket.location.name,
                desc : socket.location.description,
                exits : locFeatures
            });
        },
        write : function writeHandler(socket) {
            socket.emit('info', "Write with what? (Not yet implemented.)");
        }
    },
    processCommand : function processCommand(socket, cmd) {
        switch(cmd) {
            case 'n':
            case 'e':
            case 'w':
            case 's':
                let dirName = directionNames[direction.indexOf(cmd)];

                if(!socket.location.notSelfRef(cmd)) {
                    // socket.emit('moved', false);
                    socket.emit('info', "There is no exit in that direction.");
                } else {
                    Location.findById(socket.location[cmd]).exec().then(function(loc) {
                        socket.location = loc;
                        // socket.emit('moved', true);
                        socket.emit('info', "You move " + dirName + ".");
                    });
                }

                break;
            case 'look':
                func.command.look(socket);
                break;
            case 'write':
                func.command.write(socket);
                break;
            default:
                socket.emit('info', "Unsupported."); // for now
                break;
        }
    }
};

function setHandlers(socket) {
    socket.on('disconnect', func.disconnect);

    socket.on('command', function(cmd) {
        func.processCommand(socket, cmd);
    });
}

function onConnection(socket) {
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

    // set CORS origins
//    io.origins('localhost:3000'); // for now

    // set connection handler
    io.on('connection', onConnection);
}

module.exports = setup;
