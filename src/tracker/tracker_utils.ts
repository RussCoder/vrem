import { LogEntryData } from "./tracker_types";
import { programLogTypes } from "../data_utils";
import db from "../db";

export const dev = process.argv[2] === '--dev';

function getLastLogEntry() {
    return db.prepare('SELECT * FROM ProgramLogs WHERE timestamp = (SELECT MAX(timestamp) FROM ProgramLogs);').get();
}

function clearCurrentProgram() {
    db.prepare('DELETE FROM CurrentProgram;').run();
}

export function addToLogs(data: LogEntryData, updateCurrentProgram = true) {
    dev && console.log('add to logs', data);

    const timestamp = data.timestamp || Date.now();
    let type = programLogTypes.program,
        description = data.description || "",
        path = data.path;

    if (data.begin) {
        type = programLogTypes.begin;
    } else if (data.end) {
        type = programLogTypes.end;
    } else if (data.idle) {
        type = programLogTypes.idle;
    }

    let programId: number;
    let parentId: number;
    if (type === programLogTypes.program) {
        if (!path) return;
        const query = db.prepare('SELECT id FROM Programs WHERE path = ?;').pluck();
        programId = query.get(path);
        if (data.parent) {
            parentId = query.get(data.parent.path);
        }
    }

    db.transaction(() => {
        if (!programId && type === programLogTypes.program) {
            const query = db.prepare('INSERT INTO Programs (path, description, parentId) VALUES (?, ?, ?);');

            if (data.parent && !parentId) {
                parentId = query.run(data.parent.path, data.parent.description, null).lastInsertRowid as number;
            }

            programId = query.run(path, description, parentId).lastInsertRowid as number;
        }

        if (type === programLogTypes.program && updateCurrentProgram) {
            clearCurrentProgram();
            db.prepare('INSERT INTO CurrentProgram (timestamp, type, programId, lastActiveTimestamp) VALUES (?, ?, ?, ?);')
                .run(timestamp, type, programId, timestamp);
        }

        const ON_CONFLICT = type === programLogTypes.end ? 'REPLACE' : 'ABORT'; // ROLLBACK shouldn't be used inside "transaction()"
        db.prepare(`INSERT OR ${ON_CONFLICT} INTO ProgramLogs (timestamp, type, programId) VALUES (?, ?, ?);`)
            .run(timestamp, type, programId);
    })();
}

export function saveCurrentProgramToLogs() {
    const currentProgram = db.prepare('SELECT * FROM CurrentProgram;').get();
    if (!currentProgram) return;

    const lastEntry = getLastLogEntry();
    if (lastEntry.type === programLogTypes.end
        || lastEntry.timestamp !== currentProgram.timestamp
        || lastEntry.programId !== currentProgram.programId) {
        clearCurrentProgram();
        return;
    }

    db.transaction(() => {
        addToLogs({ end: true, timestamp: currentProgram.lastActiveTimestamp });
        clearCurrentProgram();
    })();
}

export function updateCurrentProgramLastActiveTimestamp(timestamp) {
    db.prepare('UPDATE CurrentProgram SET lastActiveTimestamp = ?;').run(timestamp);
}