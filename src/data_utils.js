'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const readline = require('readline');

const mainFolder = path.resolve(os.userInfo().homedir, '.vrem');
const autoTimeLogsFolder = path.resolve(mainFolder, 'auto_time_logs');

!fs.existsSync(mainFolder) && fs.mkdirSync(mainFolder);
!fs.existsSync(autoTimeLogsFolder) && fs.mkdirSync(autoTimeLogsFolder);

function getFileNameByDate(date = new Date()) {
    return date.toISOString().split('T')[0] + '.txt';
}

function getFullPathToCurrentLogFile() {
    return path.resolve(autoTimeLogsFolder, getFileNameByDate());
}

async function* getLogEntriesFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        try {
            yield JSON.parse(line);
        } catch (e) { }
    }
}

const getTodayStart = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

const getTodayEnd = () => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
}

async function* getLogEntriesForDates(from = getTodayStart(), to = getTodayEnd()) {
    const logsFolder = autoTimeLogsFolder;
    const startFile = getFileNameByDate(from);
    const endFile = getFileNameByDate(to);
    const startTime = from.getTime();
    const endTime = to.getTime();

    const files = fs.readdirSync(autoTimeLogsFolder).filter(fileName => {
        return fileName >= startFile && fileName <= endFile;
    }).sort();

    for (const file of files) {
        for await (const entry of getLogEntriesFromFile(path.resolve(logsFolder, file))) {
            if (entry.timestamp >= startTime && entry.timestamp <= endTime) {
                yield entry;
            }
        }
    }
}

module.exports = {
    mainFolder,
    autoTimeLogsFolder,
    getFileNameByDate,
    getFullPathToCurrentLogFile,
    getLogEntriesForDates,
};