import path from 'path';

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

export function makeTimeStringWithDate(date = new Date()) {
    return `${makeTimeString(date)} (${makeDateString(date)})`;
}

export function openUrl(url) {
    const command = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
    require('child_process').exec(command + ' ' + url);
}

export function getDescriptionByPath(programPath) {
    if (/^http/.test(programPath)) {
        return programPath;
    }
    const parsed = path.parse(programPath);
    return parsed.name + parsed.ext;
}

export { makeDurationString } from './shared_utils';