/**
 * https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
 * https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
 */

'use strict';

const resetColorCode = '\x1b[0m';
const colors = {
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,

    brightGreen: 92,
    brightMagenta: 95,
};
const colorize = (string, color) => {
    return string.split(resetColorCode).map(string => `\x1b[${color}m${string}${resetColorCode}`).join('');
};

module.exports = {
    colorize,
    colors,
    ...Object.keys(colors).reduce((obj, key) => {
        obj[key] = string => colorize(string, colors[key]);
        return obj;
    }, {}),
};