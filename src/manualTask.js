'use strict';

const db = require('./db');

/**
 * @typedef {{id: number, name: string, startTime: number}} Task
 */

/**
 * @returns {Task}
 */
function getCurrentTask() {
    return db.prepare(
        `SELECT taskId AS id, name, startTime FROM CurrentTask JOIN Tasks ON taskId = Tasks.id LIMIT 1;`
    ).get();
}

function stopCurrentTask(currentTask = getCurrentTask()) {
    if (!currentTask) return false;

    try {
        db.exec('SAVEPOINT stop_current_task;')
        db.prepare('INSERT INTO TaskLogs (taskId, startTime, endTime) VALUES (?, ?, ?);')
            .run(currentTask.id, currentTask.startTime, Date.now());
        db.prepare('DELETE FROM CurrentTask;').run();
        db.exec('RELEASE stop_current_task;');

        return currentTask;
    } catch (e) {
        db.exec('ROLLBACK TO stop_current_task;');
        throw e;
    }
}

/**
 * Starts a new task.
 * @param {string} name
 * @returns {{
 * success: boolean,
 * reason?: string,
 * activeTask?: object,
 * stoppedTask?: object
 * }}
 */
function startTask(name) {
    try {
        const currentTask = getCurrentTask();
        let id = db.prepare('SELECT id FROM Tasks WHERE name = ?;').pluck().get(name);

        if (currentTask && currentTask.taskId === id) {
            return {
                success: false,
                reason: 'already_started',
                activeTask: currentTask,
            };
        }

        const result = { success: true };
        db.exec('BEGIN;');
        if (!id) {
            const info = db.prepare('INSERT INTO Tasks (name) VALUES (?);').run(name);
            id = info.lastInsertRowid;
        }
        if (currentTask) {
            stopCurrentTask(currentTask);
            result.stoppedTask = currentTask;
        }

        const currentTime = Date.now();
        db.prepare('INSERT INTO CurrentTask (taskId, startTime) VALUES (?, ?);').run(id, currentTime);
        db.exec('COMMIT;');

        result.activeTask = {
            id: id,
            name: name,
            startTime: currentTime,
        };

        return result;
    } catch (e) {
        db.exec('ROLLBACK;');
        throw e;
    }
}

function getTaskLogs(limit = 100, offset = 0) {
    return db.prepare(`
        SELECT logs.id, Tasks.name as taskName, startTime, endTime
        FROM TaskLogs logs JOIN Tasks ON Tasks.id = logs.taskId
        ORDER BY startTime DESC
        LIMIT ? OFFSET ?;
    `).all(limit, offset);
}

module.exports = {
    getCurrentTask,
    stopCurrentTask,
    startTask,
    getTaskLogs,
};