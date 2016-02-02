'use strict';

const Location = require('../models').model('Location');
const email = require('../lib/emails');
const direction = ['n', 'e', 's', 'w'];
const directionNames = ['north', 'east', 'south', 'west'];
const filteredAttrs = [
    '__v', '_id', 'random', 'owner',
    'name', 'description', 'surface'
];

let io;

//  Utility functions
function dirName(dirInitial) {
    return directionNames[direction.indexOf(dirInitial)];
}
function capInitial(str) {
    return str[0].toUpperCase() + str.slice(1);
}

//  Command handlers
function confirmEmail(socket, paramObj) {
    //  Params:
    //      code: String

    try {
        socket.request.user.
            confirmEmail(paramObj.code).
            then(function() {
                socket.emit('emailConfirmed', true);
                socket.emit('info', "Email successfully confirmed!");
            });
    } catch(ex) {
        socket.emit('emailConfirmed', false);
        socket.emit('error', ex.message);
    }
}
function connect(socket, paramObj) {
    //  Params:
    //      direction: 'n'/'e'/'w'/'s'
    //      index: 0 <= i < |user.locations|

    if(socket.request.user.logged_in) {
        const targetLocID = socket.request.user.locations[paramObj.index];
        Location.findById(targetLocID).then(function(targetLoc) {
            const methodName = 'attach' + capInitial(dirName(paramObj.direction));
            return socket.location[methodName](targetLoc);
        }).then(function(locs) {
            let dir = dirName(paramObj.direction);

            socket.emit('connect', true);
            look(socket);

            socket.broadcast.to(locs[0].id.toString()).emit(
                'action',
                `${socket.request.user.name} connects a new location to the ${dir}.`
            );

            if(
                locs[0].owner &&
                socket.request.user.id.toString() !== locs[0].owner.toString()
            ) {
                email.connect(locs[0], {
                    who : socket.request.user.name,
                    exit : dir,
                    locName : locs[1].name
                });
            }
        }).catch(function(err) {
            socket.emit('error', err.message);
        });
    } else {
        socket.emit('info', "Only registered users can connect locations.");
    }
}
function create(socket, paramObj) {
    //  Params:
    //      direction: 'n'/'e'/'w'/'s'
    //      description: String

    if(socket.request.user.logged_in) {
        Location.create({
            owner : socket.request.user.id,
            description : paramObj.description || undefined
        }).then(function(newLoc) {
            const methodName = 'attach' + capInitial(dirName(paramObj.direction));
            let attachPromise = socket.location[methodName](newLoc);
            let registerPromise = socket.request.user.addLocation(newLoc);
            let surfacePromise = newLoc.createSurface();

            return Promise.all([attachPromise, registerPromise, surfacePromise]);
        }).then(function(created) {
            let locs = created[0];
            let dir = dirName(paramObj.direction);

            socket.emit('create', true);
            look(socket);

            socket.broadcast.to(locs[0].id.toString()).emit(
                'action',
                `${socket.request.user.name} creates a new location to the ${dir}.`
            );

            if(
                locs[0].owner &&
                socket.request.user.id.toString() !== locs[0].owner.toString()
            ) {
                email.connect(locs[0], {
                    who : socket.request.user.name,
                    exit : dir,
                    locName : locs[1].name
                });
            }
        }).catch(function(err) {
            socket.emit('error', err.message);
            if(err.location) {
                return err.location.remove();
            }
        });
    } else {
        socket.emit('info', "Only registered users can create locations.");
    }
}
function jump(socket, paramObj) {
    //  Params:
    //      index: 0 <= i < |user.locations|

    if(
        Number.isFinite(paramObj.index) &&
        paramObj.index >= 0 &&
        paramObj.index < socket.request.user.locations.length
    ) {
        Location.
            findPopulated(socket.request.user.locations[paramObj.index]).
            then(function(targetLoc) {
                let oldLocId = socket.location.id.toString();
                let newLocId = targetLoc.id.toString();

                socket.broadcast.to(oldLocId).emit(
                    'travel',
                    `${socket.request.user.name} jumps away.`
                );
                socket.leave(oldLocId);

                socket.location = targetLoc;

                socket.join(newLocId);
                socket.broadcast.to(newLocId).emit(
                    'travel',
                    `${socket.request.user.name} descends from above.`
                );

                socket.emit('travel', "You jump to one of the locations you created.");
                look(socket);
            });
    } else {
        socket.emit('info', "Ha ha. Nice try.");
    }
}
function look(socket) {
    let locFeatures = Object.keys(socket.location.toObject()).filter(function(elem) {
        return filteredAttrs.indexOf(elem) === -1 &&
            socket.location.notSelfRef(elem);
    });

    let writings;
    if(socket.location.surface) {
        writings = socket.location.surface.writings.map(function(w) {
            return w.message;
        });
    }

    socket.emit('sight', {
        name : socket.location.name,
        description : socket.location.description,
        exits : locFeatures,
        'writings' : writings
    });
}
function move(socket, paramObj) {
    //  Params:
    //      direction: 'n'/'e'/'w'/'s'

    if(!socket.location.notSelfRef(paramObj.direction)) {
        // socket.emit('moved', false);
        socket.emit('info', "There is no exit in that direction.");
    } else {
        Location.findPopulated(socket.location[paramObj.direction]).
            then(function(loc) {
                let oldLocId = socket.location.id.toString();
                let newLocId = loc.id.toString();
                let dir = dirName(paramObj.direction);
                let oppDir = directionNames[
                    (directionNames.indexOf(dir) + 2) % directionNames.length
                ];

                socket.broadcast.to(oldLocId).emit(
                    'travel',
                    `${socket.request.user.name} leaves to the ${dir}.`
                );
                socket.leave(oldLocId);

                socket.location = loc;

                socket.join(newLocId);
                socket.broadcast.to(newLocId).emit(
                    'travel',
                    `${socket.request.user.name} arrives from the ${oppDir}.`
                );

                // socket.emit('moved', true);

                socket.emit('travel', `You move ${dir}.`);
                look(socket);

                if(
                    loc.owner &&
                    loc.owner.toString() !== socket.request.user.id.toString()
                ) {
                    return email.visit(loc, socket.request.user.name);
                }
            }).catch(function(err) {
                socket.emit('error', err.message);
            });
    }
}
function say(socket, paramObj) {
    //  Params:
    //      message: String

    io.sockets.to(socket.location.id.toString()).emit('speech', {
        from : socket.request.user.name,
        message : paramObj.message
    });
}
function write(socket, paramObj) {
    //  Params:
    //      message: String

    if(
        !(paramObj.message.match(/^\s*$/)) &&   // no blank messages
        socket.request.user.logged_in &&
        socket.location.surface &&              // location has a surface
        socket.location.surface.write           // surface is populated
    ) {
        socket.location.surface.
            write(socket.request.user.id, paramObj.message).
            then(function() {
                socket.broadcast.to(socket.location.id.toString()).emit(
                    'action',
                    `${socket.request.user.name} writes something.`
                );
                socket.emit('write', true);

                Location.
                    findPopulated(socket.location.id).
                    then(function(loc) {
                        socket.location = loc;
                        look(socket);
                    });
            });

        if(socket.request.user.id.toString() !== socket.location.owner.toString()) {
            email.write(socket.location, {
                what : paramObj.message,
                who : socket.request.user.name
            });
        }
    } else {
        socket.emit('info', "There's nothing to write on here.");
    }
}
function processCommand(socket, cmd) {
    switch(cmd.command) {
        case 'travel':
            move(socket, cmd);
            break;
        case 'confirm': // for now
        case 'confirmEmail':
            confirmEmail(socket, cmd);
            break;
        case 'connect':
            connect(socket, cmd);
            break;
        case 'create':
            create(socket, cmd);
            break;
        case 'j':
        case 'jump':
            jump(socket, cmd);
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
        case 'say':
            say(socket, cmd);
            break;
        case 'whoami':
            socket.emit('info', JSON.stringify(socket.request.user));
            break;
        case 'write':
            write(socket, cmd);
            break;
        default:
            socket.emit('info', "Unsupported."); // for now
            break;
    }
}

function setup(argIo) {
    io = argIo;

    return processCommand;
}

module.exports = setup;
