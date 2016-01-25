'use strict';

const Location = require('../models').model('Location');
const direction = ['n', 'e', 'w', 's'];
const directionNames = ['north', 'east', 'west', 'south'];
const filteredAttrs = [
    '__v', '_id', 'random', 'ownerId',
    'name', 'description', 'surface'
];

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
function write(socket) {
    socket.emit('info', "Write with what? (Not yet implemented.)");
}
function create(socket, params) {}

function processCommand(socket, cmd) {
    var splitCmd = cmd.replace(/^\s+/, '').split(' ');
    switch(splitCmd[0]) {
        case 'n':
        case 'e':
        case 'w':
        case 's':
            let dirName = directionNames[direction.indexOf(splitCmd[0])];

            if(!socket.location.notSelfRef(splitCmd[0])) {
                // socket.emit('moved', false);
                socket.emit('info', "There is no exit in that direction.");
            } else {
                Location.findById(socket.location[splitCmd[0]]).exec().then(function(loc) {
                    socket.location = loc;
                    // socket.emit('moved', true);
                    socket.emit('info', "You move " + dirName + ".");
                });
            }

            break;
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
