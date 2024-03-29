import db from "./db";

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

export function getProgramLogEntriesForDates(from: number | Date = getTodayStart(), to: number | Date = new Date()): ProgramLogEntry[] {
    return db.prepare(`
        SELECT timestamp, path, description, type 
        FROM ProgramLogs LEFT JOIN Programs ON programId = Programs.id 
        WHERE timestamp >= ? AND timestamp <= ? 
        ORDER BY timestamp ASC;
    `).all(from.valueOf(), to.valueOf());
}

export type ProgramLogTypes = { [key in 'program' | 'begin' | 'end' | 'idle']: number };

export const programLogTypes: ProgramLogTypes = Object.freeze(JSON.parse(
    db.prepare('SELECT json_group_object(type, id) FROM ProgramLogTypes;').pluck().get()
));

export function getEndEntryForTheCurrentProgram(logEntry: ProgramLogEntry): ProgramLogEntry | null {
    if (logEntry.type !== programLogTypes.program) return null;
    const lastActiveTimestamp: number | undefined = db.prepare(`
        SELECT lastActiveTimestamp 
        FROM CurrentProgram JOIN Programs ON programId = Programs.id 
        WHERE timestamp = ? AND path = ?;
    `).pluck().get(logEntry.timestamp, logEntry.path);

    return lastActiveTimestamp ? { timestamp: lastActiveTimestamp, type: programLogTypes.end } : null;
}