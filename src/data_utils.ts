import db from "./db";

const path = require('path');
const fs = require('fs');
const os = require('os');
const readline = require('readline');

export const appFolder = path.resolve(os.userInfo().homedir, '.vrem');
export const mainFolder = path.resolve(appFolder, 'v0');
export const autoTimeLogsFolder = path.resolve(mainFolder, 'auto_time_logs');
export const manualTimeLogsFolder = path.resolve(mainFolder, 'manual_time_logs');

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

export interface TaskLogEntry {
    name: string,
    startTime: number,
    endTime: number,
    current?: boolean,
}

export function getTaskLogEntriesForDates(from = getTodayStart(), to = new Date()): TaskLogEntry[] {
    const limits = { from: from.valueOf(), to: to.valueOf() };

    const finished = db.prepare(`
        SELECT name, startTime, 
        CASE WHEN endTime > :to THEN :to ELSE endTime END AS endTime 
        FROM TaskLogs JOIN Tasks ON taskId = Tasks.id
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

export interface ProgramLogEntry {
    timestamp: number,
    path?: string | null,
    description?: string | null,
    type: number,
}

export function getProgramLogEntriesForDates(from = getTodayStart(), to = new Date()): ProgramLogEntry[] {
    return db.prepare(`
        SELECT timestamp, path, description, type 
        FROM ProgramLogs LEFT JOIN Programs ON programId = Programs.id 
        WHERE timestamp >= ? AND timestamp <= ? 
        ORDER BY timestamp ASC;
    `).all(from.valueOf(), to.valueOf());
}

export const programLogTypes: { [key in 'program' | 'begin' | 'end' | 'idle']: number } = Object.freeze(JSON.parse(
    db.prepare('SELECT json_group_object(type, id) FROM ProgramLogTypes;').pluck().get()
));