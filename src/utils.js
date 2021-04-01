'use strict';

function makeDateString(date) {
    return (
        date.getDate().toString().padStart(2, '0') + '.'
        + (date.getMonth() + 1).toString().padStart(2, '0') + '.'
        + date.getFullYear()
    );
}

function makeTimeString(date) {
    return (
        date.getHours().toString().padStart(2, '0') + ':'
        + (date.getMinutes()).toString().padStart(2, '0') + ':'
        + date.getSeconds().toString().padStart(2, '0')
    );
}

function makeTimeStringWithDate(date = new Date()) {
    return `${makeTimeString(date)} (${makeDateString(date)})`;
}

function makeDurationString(ms) {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    ms -= hours * 60 * 60 * 1000;
    const minutes = Math.floor(ms / 60 / 1000);
    ms -= minutes * 60 * 1000;
    const secs = Math.floor(ms / 1000);
    return `${hours ? hours + 'h ' : ''}${minutes ? minutes + 'm ' : ''}${secs ? secs + 's' : ''}` || '0s';
}

function openUrl(url) {
    const command = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
    require('child_process').exec(command + ' ' + url);
}

module.exports = {
    makeDurationString,
    makeTimeStringWithDate,
    openUrl,
};