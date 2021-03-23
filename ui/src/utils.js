export function makeDurationString(ms) {
    const format = number => number.toString().padStart(2, '0');

    const hours = Math.floor(ms / (60 * 60 * 1000));
    ms -= hours * 60 * 60 * 1000;
    const minutes = Math.floor(ms / 60 / 1000);
    ms -= minutes * 60 * 1000;
    const secs = Math.floor(ms / 1000);
    return `${format(hours)}:${format(minutes)}:${format(secs)}`;
}