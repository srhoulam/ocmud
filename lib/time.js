'use strict';

//  this module contains a constant considered to be the initial time
//      and exports a function for determining "time since"
//      as minutes, seconds, or hours

const initialTime = (new Date("2016")).getTime(); // new year GMT

function timeSince(date) {
    if(date === undefined) {
        date = new Date();
    }

    var difference = Math.floor((date.getTime() - initialTime) / 1000);

    return {
        cycles : Math.floor(difference / 589), // 589 = 31 * 19
        periods : Math.floor(difference / 31),
        ticks : difference
    };
}

module.exports = timeSince;
