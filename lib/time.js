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
        hours : Math.floor(difference / 3600),
        minutes : Math.floor(difference / 60),
        seconds : difference
    };
}

module.exports = timeSince;
