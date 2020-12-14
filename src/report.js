'use strict';

const path = require('path');
const dataUtils = require('./data_utils');
const colors = require('./colors');

async function formRawReportFromLogEntries(logEntries) {
    const report = {};

    let previousEntry = null;

    for await (const entry of logEntries) {
        if (!previousEntry) {
            if (entry.path || entry.idle) previousEntry = entry;
            continue;
        }

        if (entry.begin) {
            previousEntry = null;
        } else if (entry.end || entry.idle || entry.path !== previousEntry.path) {
            const time = entry.timestamp - previousEntry.timestamp;

            if (time > 0) { // just in case if the time on the machine was changed for some reason.
                const path = previousEntry.idle ? 'idle' : previousEntry.path;
                if (!report[path]) {
                    report[path] = {
                        time: time,
                        description: previousEntry.description,
                    };
                } else {
                    report[path].time += time;
                }
            }

            if (entry.path || entry.idle) {
                previousEntry = entry;
            }
        } else {
            // do nothing
        }
    }

    return report;
}

function formTimeString(time) {
    const hours = Math.floor(time / (60 * 60 * 1000));
    time -= hours * 60 * 60 * 1000;
    const minutes = Math.floor(time / 60 / 1000);
    time -= minutes * 60 * 1000;
    const secs = Math.floor(time / 1000);
    return `${hours ? hours + 'h ' : ''}${minutes ? minutes + 'm ' : ''}${secs ? secs + 's' : ''}`;
}

function getExeNameByFilePath(filePath) {
    const parsed = path.parse(filePath);
    return parsed.name + parsed.ext;
}

/**
 * If there are entries with the same description they should be either united
 * or their descriptions should be amended with a name of the executable file.
 */
function normalizeRawReport(report) {
    const idleEntry = report.idle;
    delete report.idle;
    const idleTime = idleEntry ? idleEntry.time : 0;

    const byDescription = {};

    for (const [filePath, data] of Object.entries(report)) {
        const key = data.description || getExeNameByFilePath(filePath);
        const entry = { ...data, description: key, path: filePath };

        if (byDescription[key]) {
            byDescription[key].push(entry);
        } else {
            byDescription[key] = [entry];
        }
    }

    const allEntries = [];

    for (const array of Object.values(byDescription)) {
        if (array.length > 1) {
            const byExeName = {};

            for (const entry of array) {
                const exeName = getExeNameByFilePath(entry.path);
                if (byExeName[exeName]) {
                    byExeName[exeName].push(entry);
                } else {
                    byExeName[exeName] = [entry];
                }
            }

            const byExeNameEntries = Object.entries(byExeName);

            const uniteEntries = (entries, descriptionAmendment = '') => entries.reduce((aggregate, entry) => {
                aggregate.time += entry.time;
                aggregate.path.push(entry.path);
                return aggregate;
            }, {
                path: [],
                description: entries[0].description + descriptionAmendment,
                time: 0,
            });

            if (byExeNameEntries.length === 1) { // it means there are several entries, but all have the same exeName;
                allEntries.push(uniteEntries(byExeNameEntries[0][1])); // same description, but multiple paths
            } else {
                for (const [exeName, entries] of byExeNameEntries) {
                    if (entries.length === 1) { // one path, but amended description
                        allEntries.push({ ...entries[0], description: entries[0].description + ` (${exeName})` });
                    } else {
                        allEntries.push(uniteEntries(entries, ` (${exeName})`)); // many paths with amended description
                    }
                }
            }
        } else {
            allEntries.push(array[0]);
        }
    }

    return {
        idleTime: idleTime,
        entries: allEntries.sort((a, b) => -a.time + b.time),
    }
}

const dateToIsoDateString = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];

function prettyPrintReport(normalizedReport, from, to) {
    let result = '\n';

    const fromDateString = dateToIsoDateString(from);
    const toDateString = dateToIsoDateString(to);

    if (fromDateString === toDateString) {
        result += colors.cyan(`Report for the date ${fromDateString}\n\n`);
    } else {
        result += colors.cyan(`Report for the period from ${fromDateString} to ${toDateString}\n\n`);
    }

    if (!normalizedReport.entries.length) {
        result += `${colors.yellow('There is no data for the requested period.')}\n`;
        return console.info(result);
    }

    const totalActiveTime = normalizedReport.entries.reduce((sum, entry) => sum + entry.time, 0);

    for (const data of normalizedReport.entries) {
        const timeString = formTimeString(data.time);
        const percent = Math.round(data.time / totalActiveTime * 10000) / 100;
        result += `${(`(${percent}%) `.padEnd(9) + timeString).padEnd(20)} - ${colors.green(data.description)}\n`;
    }

    result += `\n${colors.brightGreen('Total active time')}: ${formTimeString(totalActiveTime)}\n`;
    result += `${colors.yellow('Idle time')}: ${formTimeString(normalizedReport.idleTime)}\n`;
    result += `${colors.cyan('Total time')}: ${formTimeString(normalizedReport.idleTime + totalActiveTime)}\n`;

    console.info(result);
}

function isoDateStringToDate(string) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(string)) {
        console.error(colors.red(`Incorrect date format! You should provide dates in format yyyy-mm-dd. Got: ${string}\n`));
        throw new Error();
    }
    const dateObject = new Date(string);
    dateObject.setTime(dateObject.getTime() + dateObject.getTimezoneOffset() * 60000);
    return dateObject;
}

function processDates(date, from, to) {
    date = date && isoDateStringToDate(date) || new Date();
    from = from && isoDateStringToDate(from) || new Date(date.getTime());
    to = to && isoDateStringToDate(to) || new Date((date.getTime()));
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    return [from, to];
}

async function getReport(from, to) {
    console.log(from, to);
    const rawReport = await formRawReportFromLogEntries(dataUtils.getLogEntriesForDates(...processDates(null, from, to)));
    return normalizeRawReport(rawReport);
}

async function reportCommand(date, { from, to }) {
    prettyPrintReport(await getReport(...processDates(date, from, to)), from, to);
}

module.exports = {
    getReport,
    reportCommand,
};