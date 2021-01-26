'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const readline = require('readline');
const db = require('./db');

const appFolder = path.resolve(os.userInfo().homedir, '.vrem');
const mainFolder = path.resolve(appFolder, 'v0');
const autoTimeLogsFolder = path.resolve(mainFolder, 'auto_time_logs');
const manualTimeLogsFolder = path.resolve(mainFolder, 'manual_time_logs');

!fs.existsSync(mainFolder) && fs.mkdirSync(mainFolder);
!fs.existsSync(autoTimeLogsFolder) && fs.mkdirSync(autoTimeLogsFolder);
!fs.existsSync(manualTimeLogsFolder) && fs.mkdirSync(manualTimeLogsFolder);

function getFileNameByDate(date = new Date()) {
    return date.toISOString().split('T')[0] + '.txt';
}

function getFullPathToCurrentLogFile(rootFolder = autoTimeLogsFolder) {
    return path.resolve(rootFolder, getFileNameByDate());
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

function getManualLogEntriesForDates(from = getTodayStart(), to = new Date()) {
    const limits = { from: from.valueOf(), to: to.valueOf() };

    const finished = db.prepare(`
        SELECT name, startTime, 
        CASE WHEN endTime > :to THEN :to ELSE endTime END AS endTime 
        FROM ManualLogs JOIN Tasks ON taskId = Tasks.id
        WHERE startTime >= :from AND startTime <= :to;
    `).all(limits);

    const current = db.prepare(`
        SELECT name, startTime, ? AS endTime
        FROM CurrentTask JOIN Tasks ON taskId = Tasks.id
        WHERE startTime >= :from AND startTime <= :to LIMIT 1;
    `).get(limits, Date.now());

    if (current) finished.push({ ...current, current: true });

    return finished;
}

function getAutoLogEntriesForDates(from = getTodayStart(), to = new Date()) {
    return db.prepare(`
        SELECT timestamp, path, description, type 
        FROM AutoLogs LEFT JOIN Programs ON programId = Programs.id 
        WHERE timestamp >= ? AND timestamp <= ? 
        ORDER BY timestamp ASC;
    `).all(from.valueOf(), to.valueOf());
}

const autoLogTypes = Object.freeze(JSON.parse(
    db.prepare('SELECT json_group_object(type, id) FROM AutoLogTypes;').pluck().get()
));

module.exports = {
    getAutoLogEntriesForDates,
    getManualLogEntriesForDates,
    autoLogTypes,
    appFolder,
    mainFolder,
    manualTimeLogsFolder,
    autoTimeLogsFolder,
    getFileNameByDate,
    getFullPathToCurrentLogFile,
    getLogEntriesForDates,
};