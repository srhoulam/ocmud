'use strict';

const Location = require('../models').model('Location');
const direction = ['n', 'e', 'w', 's'];
const directionNames = ['north', 'east', 'west', 'south'];
const filteredAttrs = [
    '__v', '_id', 'random', 'ownerId',
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
function look(socket) {
    var locFeatures = Object.keys(socket.location.toObject()).filter(function(elem) {
        return filteredAttrs.indexOf(elem) === -1 &&
            socket.location.notSelfRef(elem);
    });

    socket.emit('sight', {
        name : socket.location.name,
        desc : socket.location.description,
        exits : locFeatures
    });
}
function move(socket, direction) {
    if(!socket.location.notSelfRef(direction)) {
        // socket.emit('moved', false);
        socket.emit('info', "There is no exit in that direction.");
    } else {
        Location.findById(socket.location[direction]).exec().then(function(loc) {
            socket.location = loc;
            // socket.emit('moved', true);
            socket.emit('info', "You move " + dirName(direction) + ".");
            look(socket);
        });
    }
}
function write(socket) {
    socket.emit('info', "Write with what? (Not yet implemented.)");
}
function create(socket, params) {
    var paramObj = {
        direction : params[0],
        desc : params.slice(1).join(' ')
    };

    if(socket.request.user.logged_in) {
        Location.create({
            ownerId : socket.request.user.id,
            name : Location.genName(),
            description : paramObj.desc || undefined
        }).then(function(newLoc) {
            socket.emit('info', JSON.stringify(newLoc));

            var methodName = 'attach' + capInitial(dirName(paramObj.direction));
            var attachPromise = socket.location[methodName](newLoc);
            var registerPromise = socket.request.user.addLocation(newLoc);

            return Promise.all([attachPromise, registerPromise]);
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
        case 'l':
        case 'look':
            look(socket);
            break;
        case 'write':
            write(socket);
            break;
        case 'create':
            create(socket, splitCmd.slice(1));
            break;
        case 'whoami':
            socket.emit('info', JSON.stringify(socket.request.user));
            break;
        case 'status':
            socket.emit('info', socket.request.user.logged_in);
            break;
        default:
            socket.emit('info', "Unsupported."); // for now
            break;
    }
}

module.exports = processCommand;
