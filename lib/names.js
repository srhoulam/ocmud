'use strict';

//  this module exports a function to generate names from
//      a handful of word lists.

const nouns = [
    "helipad", "nuclear silo", "hot-dog stand",
    "military base", "food truck", "book store",
    "cat cafe", "DUI checkpoint", "hackerspace",
    "bomb shelter", "train station", "casino",
    "theater", "greenhouse", "comedy club",
    "barbershop", "junkyard"
];
const cultures = [
    "Western", "Middle Eastern", "European",
    "Pacific", "Tropical", "Arctic",
    "Far Eastern"
];
const adjectives = [
    "Burned", "Prosperous", "Indifferent",
    "Broken", "Solid", "Indomitable",
    "Crumbling", "Imperfect", "Stalwart",
    "Heavy", "Whispering", "Livid",
    "Howling"
];

function generateName(cultureIndex, adjectiveIndex, nounIndex) {
    return [
        cultures[cultureIndex % cultures.length],
        adjectives[adjectiveIndex % adjectives.length],
        nouns[nounIndex % nouns.length]
    ].join(' ');
}

module.exports = generateName;
