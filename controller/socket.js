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
function ifLoggedIn(f, socket) {
    let args = Array.prototype.slice.call(arguments, 1);

    if(socket.request.user.logged_in) {
        return f.apply(null, args);
    }

    let message;
    switch(true) {
        case f === connect:
        case f === create:
            message = "Explorers explore, creators create.";
            break;
        case f === jump:
            message = "You don't have the energy to jump.";
            break;
        case f === list:
            message = "Explorers look ahead, not behind.";
            break;
        case f === say:
            message = "Explorers have no voice.";
            break;
        case f === write:
            message = "You didn't bring anything to write with.";
            break;
        default:
            message = "Only creators may take this action. (Log in.)";
            break;
    }

    socket.emit('info', message);
}
function refreshLocation(socket) {
    return Location.findPopulated(socket.location.id).
        then(function(loc) {
            socket.location = loc;
        });
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
    } catch(error) {
        socket.emit('emailConfirmed', false);
        socket.emit('info', error.message);
    }
}
function connect(socket, paramObj) {
    //  Params:
    //      direction: 'n'/'e'/'w'/'s'
    //      index: 0 <= i < |user.locations|

    const targetLocID = socket.request.user.locations[paramObj.index];

    refreshLocation(socket).then(function() {
        return Location.findById(targetLocID);
    }).then(function(targetLoc) {
        const methodName = 'attach' + capInitial(dirName(paramObj.direction));
        return socket.location[methodName](targetLoc);
    }).then(function(locs) {
        let dir = dirName(paramObj.direction);
        let oppDir = directionNames[
            (directionNames.indexOf(dir) + 2) % directionNames.length
        ];

        socket.emit('connect', true);
        look(socket);

        socket.broadcast.to(locs[0].id.toString()).emit(
            'action',
            `${socket.request.user.displayName} connects a new location to the ${dir}.`
        );
        socket.broadcast.to(locs[1].id.toString()).emit(
            'action',
            `A bridge forms to the ${oppDir}.`
        );
        //  let occupants know to refresh their view
        socket.broadcast.to(locs[0].id.toString()).emit('action', true);
        socket.broadcast.to(locs[1].id.toString()).emit('action', true);

        if(
            locs[0].owner &&
            socket.request.user.id.toString() !== locs[0].owner.toString()
        ) {
            email.connect(locs[0], {
                who : socket.request.user.displayName,
                exit : dir,
                locName : locs[1].name
            });
        }
    }).catch(function(err) {
        socket.emit('info', err.message);
    });
}
function create(socket, paramObj) {
    //  Params:
    //      direction: 'n'/'e'/'w'/'s'
    //      description: String

    refreshLocation(socket).then(function() {
        return Location.create({
            owner : socket.request.user.id,
            description : paramObj.description || undefined
        });
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
            `${socket.request.user.displayName} creates a new location to the ${dir}.`
        );
        //  let occupants know to refresh their view
        socket.broadcast.to(locs[0].id.toString()).emit('action', true);

        if(
            locs[0].owner &&
            socket.request.user.id.toString() !== locs[0].owner.toString()
        ) {
            email.connect(locs[0], {
                who : socket.request.user.displayName,
                exit : dir,
                locName : locs[1].name
            });
        }
    }).catch(function(err) {
        socket.emit('info', err.message);
        if(err.location) {
            return err.location.remove();
        }
    });
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
                    `${socket.request.user.displayName} jumps away.`
                );
                socket.leave(oldLocId);

                socket.location = targetLoc;

                socket.join(newLocId);
                socket.broadcast.to(newLocId).emit(
                    'travel',
                    `${socket.request.user.displayName} descends from above.`
                );

                socket.emit('travel', true);
                socket.emit('travel', "You jump to one of the locations you created.");
                look(socket);
            });
    } else {
        socket.emit('info', "Ha ha. Nice try.");
    }
}
function list(socket) {
    Location.populate(socket.request.user, {
        path : 'locations',
        model : 'Location'
    }).then(function(popUser) {
        socket.emit('locations', popUser.locations.map(function(loc) {
            return loc.name;
        }));
    });
}
function look(socket) {
    refreshLocation(socket).then(function() {
        let locFeatures = Object.keys(socket.location.toObject()).filter(function(elem) {
            return filteredAttrs.indexOf(elem) === -1 &&
                socket.location.notSelfRef(elem);
        });

        if(socket.location.surface && socket.location.surface.writings.length > 0) {
            Location.populate(socket.location.surface.writings, {
                path : 'owner',
                model : 'User'
            }).then(function(popWritings) {
                return popWritings.map(function(w) {
                    return {
                        author : w.owner.name,
                        message : w.message
                    };
                });
            }).then(function(writings) {
                socket.emit('sight', {
                    name : socket.location.name,
                    description : socket.location.description,
                    exits : locFeatures,
                    surface : socket.location.surface.name,
                    'writings' : writings
                });
            });
        } else {
            socket.emit('sight', {
                name : socket.location.name,
                description : socket.location.description,
                exits : locFeatures,
                surface : null,
                writings : []
            });
        }
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

                let name;
                if(socket.request.user.logged_in) {
                    name = socket.request.user.displayName;
                } else {
                    name = "A stranger";
                }


                socket.broadcast.to(oldLocId).emit(
                    'travel',
                    `${name} leaves to the ${dir}.`
                );
                socket.leave(oldLocId);

                socket.location = loc;

                socket.join(newLocId);
                socket.broadcast.to(newLocId).emit(
                    'travel',
                    `${name} arrives from the ${oppDir}.`
                );

                // socket.emit('moved', true);

                socket.emit('travel', true);
                socket.emit('travel', `You move ${dir}.`);
                look(socket);

                if(
                    loc.owner &&
                    socket.request.user.logged_in &&
                    loc.owner.toString() !== socket.request.user.id.toString()
                ) {
                    email.visit(loc, name);
                }
            }).catch(function(err) {
                socket.emit('info', err.message);
            });
    }
}
function resendConfirmEmail(socket) {
    if(!socket.request.user.emailConfirmed) {
        socket.request.user.
            setConfirmCode('email').
            then(function(user) {
                return email.confirm(user);
            }).then(function() {
                return "A new confirmation email has been sent.";
            }).catch(function() {
                return "An error occurred and we were unable to send an email at this time.";
            }).then(function(message) {
                socket.emit('info', message);
            });
    } else {
        socket.emit('info', "Your email is already confirmed.");
    }
}
function say(socket, paramObj) {
    //  Params:
    //      message: String

    io.sockets.to(socket.location.id.toString()).emit('speech', {
        from : socket.request.user.displayName,
        message : paramObj.message
    });
}
function write(socket, paramObj) {
    //  Params:
    //      message: String

    if(
        !(paramObj.message.match(/^\s*$/)) &&   // no blank messages
        socket.location.surface &&              // location has a surface
        socket.location.surface.write           // surface is populated
    ) {
        socket.location.surface.
            write(socket.request.user.id, paramObj.message).
            then(function() {
                socket.broadcast.to(socket.location.id.toString()).emit(
                    'action',
                    `${socket.request.user.displayName} writes something.`
                );
                socket.emit('write', true);
                //  let occupants know to refresh their view
                socket.broadcast.to(socket.location.id.toString()).emit('action', true);

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
                who : socket.request.user.displayName
            });
        }
    } else {
        socket.emit('info', "The circumstances do not enable you to write.");
    }
}
function processCommand(socket, cmd) {
    switch(cmd.command) {
        case 'travel':
            move(socket, cmd);
            break;
        case 'confirm': // for now
        case 'confirmEmail':
            ifLoggedIn(confirmEmail, socket, cmd);
            break;
        case 'connect':
            ifLoggedIn(connect, socket, cmd);
            break;
        case 'create':
            ifLoggedIn(create, socket, cmd);
            break;
        case 'j':
        case 'jump':
            ifLoggedIn(jump, socket, cmd);
            break;
        case 'list':
            ifLoggedIn(list, socket);
            break;
        case 'look':
            look(socket);
            break;
        case 'q':
        case 'quit':
            socket.emit('info', "Bye.");
            socket.disconnect();
            break;
        case 'resendEmail':
            ifLoggedIn(resendConfirmEmail, socket);
            break;
        case 'say':
            ifLoggedIn(say, socket, cmd);
            break;
        case 'whoami':
            socket.emit('ident', socket.request.user.logged_in && socket.request.user.displayName);
            break;
        case 'write':
            ifLoggedIn(write, socket, cmd);
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
