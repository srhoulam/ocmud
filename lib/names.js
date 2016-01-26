'use strict';

//  this module exports a function to generate names from
//      a handful of word lists.

const nouns = [
    "helipad", "nuclear silo", "hot-dog stand",
    "military base", "food truck", "book store",
    "cat cafe", "DUI checkpoint", "hackerspace",
    "bomb shelter", "train station", "casino",
    "theater", "greenhouse", "comedy club",
    "barbershop", "junkyard", "ivory tower",
    "squat", "go-kart track", "sketchy neighborhood",
    "place with WiFi", "strip mall", "grocery store",
    "truck stop", "bathroom stall", "inverted bathtub",
    "tire swing", "bat cave", "crow hangout",
    "weather station"
];
const cultures = [
    "Western", "Middle Eastern", "European",
    "Pacific", "Tropical", "Arctic",
    "Far Eastern"
];
const adjectives = [
    "burned", "prosperous", "indifferent",
    "broken", "solid", "indomitable",
    "crumbling", "imperfect", "stalwart",
    "heavy", "whispering", "livid",
    "howling", "laughing", "thoughtful",
    "neat", "exciting", "threatening",
    "heroic"
];

function generateName(cultureIndex, adjectiveIndex, nounIndex) {
    return [
        cultures[cultureIndex % cultures.length],
        adjectives[adjectiveIndex % adjectives.length],
        nouns[nounIndex % nouns.length]
    ].join(' ');
}

module.exports = generateName;
