/**
 * https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
 * https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
 */
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
const colorize = (string: string, color: number): string => {
    return string.split(resetColorCode).map(string => `\x1b[${color}m${string}${resetColorCode}`).join('');
};

export default {
    colorize,
    colors,
    ...Object.keys(colors).reduce((obj, key) => {
        obj[key] = string => colorize(string, colors[key]);
        return obj;
    }, {}) as Record<keyof typeof colors, (string: string | undefined) => string>,
};