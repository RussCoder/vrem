import db from './db';

export interface Task {
    id: number,
    name: string,
    startTime: number,
}

export function getCurrentTask(): Task {
    return db.prepare(
        `SELECT taskId AS id, name, startTime FROM CurrentTask JOIN Tasks ON taskId = Tasks.id LIMIT 1;`
    ).get();
}

export function stopCurrentTask(currentTask = getCurrentTask()): Task | false {
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

export interface StartTaskResult {
    success: boolean,
    reason?: 'already_started',
    activeTask?: Task,
    stoppedTask?: Task,
}

export function startTask(name: string): StartTaskResult {
    try {
        const currentTask = getCurrentTask();
        let id = db.prepare('SELECT id FROM Tasks WHERE name = ?;').pluck().get(name);

        if (currentTask && currentTask.id === id) {
            return {
                success: false,
                reason: 'already_started',
                activeTask: currentTask,
            };
        }

        const result: StartTaskResult = { success: true };
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

export function getTaskLogs(limit = 100, offset = 0) {
    return db.prepare(`
        SELECT logs.id, Tasks.name as taskName, startTime, endTime
        FROM TaskLogs logs JOIN Tasks ON Tasks.id = logs.taskId
        ORDER BY startTime DESC
        LIMIT ? OFFSET ?;
    `).all(limit, offset);
}