/**
 * Utils shared by both backend and frontend
 */

export function makeDurationString(ms) {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    ms -= hours * 60 * 60 * 1000;
    const minutes = Math.floor(ms / 60 / 1000);
    ms -= minutes * 60 * 1000;
    const secs = Math.floor(ms / 1000);
    return `${hours ? hours + 'h ' : ''}${minutes ? minutes + 'm ' : ''}${secs ? secs + 's' : ''}` || '0s';
}