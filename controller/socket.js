'use strict';

const Location = require('../models').model('Location');
const email = require('../lib/emails');
const direction = ['n', 'e', 'w', 's'];
const directionNames = ['north', 'east', 'west', 'south'];
const filteredAttrs = [
    '__v', '_id', 'random', 'owner',
    'name', 'description', 'surface'
];

//  Utility functions
function dirName(dirInitial) {
    return directionNames[direction.indexOf(dirInitial)];
}
function capInitial(str) {
    return str[0].toUpperCase() + str.slice(1);
}

//  Command handlers
function confirmEmail(socket, params) {
    const paramObj = {
        code : params[0]
    };

    try {
        socket.request.user.
            confirmEmail(paramObj.code).
            then(function() {
                socket.emit('emailConfirmed', true);
                socket.emit('info', "Email successfully confirmed!");
            });
    } catch(ex) {
        socket.emit('emailConfirmed', false);
        socket.emit('info', ex.message);
    }
}
function connect(socket, params) {
    const paramObj = {
        direction : params[0],
        index : parseInt(params[1], 10)
    };

    if(socket.request.user.logged_in) {
        const targetLocID = socket.request.user.locations[paramObj.index];
        Location.findById(targetLocID).then(function(targetLoc) {
            const methodName = 'attach' + capInitial(dirName(paramObj.direction));
            return socket.location[methodName](targetLoc);
        }).then(function() {
            socket.emit(
                'info',
                "You attach a location to the " + dirName(paramObj.direction) + "."
            );
            look(socket);
        }).catch(function(err) {
            socket.emit('info', err.message);
        });
    } else {
        socket.emit('info', "Only registered users can connect locations.");
    }
}
function create(socket, params) {
    const paramObj = {
        direction : params[0],
        desc : params.slice(1).join(' ')
    };

    if(socket.request.user.logged_in) {
        Location.create({
            owner : socket.request.user.id,
            description : paramObj.desc || undefined
        }).then(function(newLoc) {
            const methodName = 'attach' + capInitial(dirName(paramObj.direction));
            var attachPromise = socket.location[methodName](newLoc);
            var registerPromise = socket.request.user.addLocation(newLoc);
            var surfacePromise = newLoc.createSurface();

            return Promise.all([attachPromise, registerPromise, surfacePromise]);
        }).then(function() {
            socket.emit(
                'info',
                "You create a new location to the " + dirName(paramObj.direction) + "."
            );
            look(socket);
        }).catch(function(err) {
            socket.emit('info', err.message);
        });
    } else {
        socket.emit('info', "Only registered users can create locations.");
    }
}
function jump(socket, params) {
    const paramObj = {
        index : parseInt(params[0], 10)
    };

    if(
        Number.isFinite(paramObj.index) &&
        paramObj.index >= 0 &&
        paramObj.index < socket.request.user.locations.length
    ) {
        Location.
            findPopulated(socket.request.user.locations[paramObj.index]).
            then(function(targetLoc) {
                socket.location = targetLoc;
                socket.emit('info', "You jump to one of the locations you created.");
                look(socket);
            });
    } else {
        socket.emit('info', "Ha ha. Nice try.");
    }
}
function look(socket) {
    var locFeatures = Object.keys(socket.location.toObject()).filter(function(elem) {
        return filteredAttrs.indexOf(elem) === -1 &&
            socket.location.notSelfRef(elem);
    });

    var writings;
    if(socket.location.surface) {
        writings = socket.location.surface.writings.map(function(w) {
            return w.message;
        });
    }

    socket.emit('sight', {
        name : socket.location.name,
        desc : socket.location.description,
        exits : locFeatures,
        'writings' : writings
    });
}
function move(socket, direction) {
    if(!socket.location.notSelfRef(direction)) {
        // socket.emit('moved', false);
        socket.emit('info', "There is no exit in that direction.");
    } else {
        Location.findPopulated(socket.location[direction]).
            then(function(loc) {
                socket.location = loc;
                // socket.emit('moved', true);
                socket.emit('info', "You move " + dirName(direction) + ".");
                look(socket);

                if(
                    loc.owner &&
                    loc.owner.toString() !== socket.request.user.id.toString()
                ) {
                    return email.visit(loc, socket.request.user.name);
                }
            }).catch(function(err) {
                socket.emit('info', err.message);
            });
    }
}
function write(socket, params) {
    var paramObj = {
        message : params.join(' ')
    };

    if(
        socket.request.user.logged_in &&
        socket.location.surface &&
        socket.location.surface.write
    ) {
        socket.location.surface.
            write(socket.request.user.id, paramObj.message).
            then(function() {
                Location.
                    findPopulated(socket.location.id).
                    then(function(loc) {
                        socket.location = loc;
                        look(socket);
                    });
            });
    } else {
        socket.emit('info', "There's nothing to write on here.");
    }
}
function processCommand(socket, cmd) {
    //  turn `cmd` into an object later and `switch` on `cmd.type`
    //      for easier parameter handling, i.e., no need to split
    //      or sanitize strings
    var splitCmd = cmd.replace(/^\s+/, '').split(' ');
    switch(splitCmd[0]) {
        case 'n':
        case 'e':
        case 'w':
        case 's':
            move(socket, splitCmd[0]);
            break;
        case 'confirm': // for now
        case 'confirmEmail':
            confirmEmail(socket, splitCmd.slice(1));
            break;
        case 'connect':
            connect(socket, splitCmd.slice(1));
            break;
        case 'create':
            create(socket, splitCmd.slice(1));
            break;
        case 'j':
        case 'jump':
            jump(socket, splitCmd.slice(1));
            break;
        case 'list':
            socket.emit('info', JSON.stringify(socket.request.user.locations));
            break;
        case 'look':
            look(socket);
            break;
        case 'q':
        case 'quit':
            socket.emit('info', "Bye.");
            socket.disconnect();
            break;
        case 'whoami':
            socket.emit('info', JSON.stringify(socket.request.user));
            break;
        case 'write':
            write(socket, splitCmd.slice(1));
            break;
        default:
            socket.emit('info', "Unsupported."); // for now
            break;
    }
}

module.exports = processCommand;
