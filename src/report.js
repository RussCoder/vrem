'use strict';

const path = require('path');
const dataUtils = require('./data_utils');
const colors = require('./colors');
const { makeDurationString, makeTimeStringWithDate } = require('./utils');

const programLogTypes = dataUtils.programLogTypes;

function formRawProgramReportFromEntries(logEntries) {
    const report = {};

    let previousEntry = null;

    for (const entry of logEntries) {
        if (!previousEntry) {
            if (entry.path || entry.type === programLogTypes.idle) previousEntry = entry;
            continue;
        }

        if (entry.type === programLogTypes.begin) {
            previousEntry = null;
        } else if (
            entry.type === programLogTypes.end
            || entry.type === programLogTypes.idle
            || entry.path !== previousEntry.path
        ) {
            const time = entry.timestamp - previousEntry.timestamp;

            if (time > 0) { // just in case if the time on the machine was changed for some reason.
                const path = (previousEntry.type === programLogTypes.idle) ? 'idle' : previousEntry.path;
                if (!report[path]) {
                    report[path] = {
                        time: time,
                        description: previousEntry.description,
                    };
                } else {
                    report[path].time += time;
                }
            }

            if (entry.path || entry.type === programLogTypes.idle) {
                previousEntry = entry;
            }
        } else {
            // do nothing
        }
    }

    return report;
}

function getDescriptionByPath(programPath) {
    if (/^http/.test(programPath)) {
        return programPath;
    }
    const parsed = path.parse(programPath);
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
        const key = data.description || getDescriptionByPath(filePath);
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
                const exeName = getDescriptionByPath(entry.path);
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

function prettyPrintProgramReport(normalizedReport, from, to) {
    let result = '\n';

    if (!normalizedReport.entries.length) {
        result += `${colors.yellow('There is no data for the requested period.')}\n`;
        return console.info(result);
    }

    const totalActiveTime = normalizedReport.entries.reduce((sum, entry) => sum + entry.time, 0);

    for (const data of normalizedReport.entries) {
        const timeString = makeDurationString(data.time);
        const percent = Math.round(data.time / totalActiveTime * 10000) / 100;
        result += `${(`(${percent}%) `.padEnd(9) + timeString).padEnd(20)} - ${colors.green(data.description)}\n`;
    }

    result += `\n${colors.brightGreen('Total active time')}: ${makeDurationString(totalActiveTime)}\n`;
    result += `${colors.yellow('Idle time')}: ${makeDurationString(normalizedReport.idleTime)}\n`;
    result += `${colors.cyan('Total time')}: ${makeDurationString(normalizedReport.idleTime + totalActiveTime)}\n`;

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

function _getProgramReport(from, to) {
    const rawReport = formRawProgramReportFromEntries(dataUtils.getProgramLogEntriesForDates(from, to));
    return normalizeRawReport(rawReport);
}

function getReport(fromString, toString) {
    return _getProgramReport(...processDates(null, fromString, toString));
}

function makeHeader(string = '*******') {
    const decoration = '*'.repeat(string.length);
    return `${decoration}\n${string.toUpperCase()}\n${decoration}`;
}

function getPeriodClause(fromDate, toDate) {
    const fromDateString = dateToIsoDateString(fromDate);
    const toDateString = dateToIsoDateString(toDate);
    if (fromDateString === toDateString) {
        return ` on the date ${fromDateString}`;
    } else {
        return ` in the period from ${fromDateString} to ${toDateString}`;
    }
}

function getTaskReport(fromDate, toDate) {
    const taskLogs = dataUtils.getTaskLogEntriesForDates(fromDate, toDate);
    const programLogs = dataUtils.getProgramLogEntriesForDates(fromDate, toDate);

    const unprocessedTasks = taskLogs.map(log => ({
        ...log,
        autoEntries: [{
            type: programLogTypes.begin,
            timestamp: log.startTime
        }]
    }));
    const processedTasks = [];

    let previousEntry = null;
    for (const logEntry of programLogs) {
        const processedIndices = [];

        for (let i = 0; i < unprocessedTasks.length; i++) {
            const taskEntry = unprocessedTasks[i];
            if (taskEntry.endTime < logEntry.timestamp) {
                if (logEntry.type !== programLogTypes.begin) {
                    taskEntry.autoEntries.push({
                        type: programLogTypes.end,
                        timestamp: taskEntry.endTime,
                    });
                }
                processedIndices.push(i);
                continue;
            }

            if (taskEntry.startTime <= logEntry.timestamp) {
                if (taskEntry.autoEntries.length === 1 && previousEntry) {
                    taskEntry.autoEntries.push({
                        ...previousEntry,
                        timestamp: taskEntry.startTime,
                    });
                }
                taskEntry.autoEntries.push(logEntry);
            }
        }

        processedIndices.forEach(index => {
            const [task] = unprocessedTasks.splice(index, 1);
            processedTasks.push(task);
        });

        if (logEntry.type === programLogTypes.program || logEntry.type === programLogTypes.idle) {
            previousEntry = logEntry;
        } else {
            previousEntry = null;
        }
    }

    processedTasks.push(...unprocessedTasks); // in case if there is a current task

    const tasks = processedTasks.reduce((obj, entry) => {
        if (obj[entry.name]) {
            obj[entry.name].autoEntries.push(...entry.autoEntries);
            obj[entry.name].time += entry.endTime - entry.startTime;
            obj[entry.name].endTime = entry.endTime;
            obj[entry.name].current = entry.current;
        } else {
            obj[entry.name] = {
                //taskEntries: [entry],
                name: entry.name,
                time: entry.endTime - entry.startTime,
                autoEntries: [...entry.autoEntries],
                startTime: entry.startTime,
                endTime: entry.endTime,
                current: entry.current,
            }
        }
        return obj;
    }, {});

    return Object.values(tasks).sort((a, b) => -a.time + b.time);
}

function prettyPrintTaskReport(taskReport) {
    for (const task of taskReport) {
        console.info(colors.cyan(
            `Task "${colors.brightGreen(task.name)}" took ${colors.white(makeDurationString(task.time))}\n`
            + `Began: ${colors.white(makeTimeStringWithDate(new Date(task.startTime)))}\n`
            + (task.current ?
                `And is running. Current time: ${colors.white(makeTimeStringWithDate(new Date()))}` :
                `Ended: ${colors.white(makeTimeStringWithDate(new Date(task.endTime)))}`
            )
            + `\nThe programs used within this task:`));

        const rawReport = formRawProgramReportFromEntries(task.autoEntries);
        const report = normalizeRawReport(rawReport);
        prettyPrintProgramReport(report);
        console.info('-'.repeat(25) + '\n');
    }
}

function reportCommand(date, { from, to }) {
    const [fromDate, toDate] = processDates(date, from, to);
    const periodClause = getPeriodClause(fromDate, toDate);

    console.info(colors.cyan(makeHeader('GENERAL REPORT ON USED PROGRAMS' + periodClause)));
    prettyPrintProgramReport(_getProgramReport(fromDate, toDate), fromDate, toDate);

    const taskReport = getTaskReport(fromDate, toDate);

    if (taskReport.length) {
        console.info(colors.cyan(makeHeader('REPORTS FOR EACH TASK' + periodClause) + '\n'));
        prettyPrintTaskReport(taskReport);
    }
}

module.exports = {
    getReport,
    reportCommand,
};