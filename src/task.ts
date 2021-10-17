import db from './db';

export interface CurrentTask {
    id: number,
    name: string,
    startTime: number,
}

export function getCurrentTask(): CurrentTask {
    return db.prepare(
        `SELECT taskId AS id, name, startTime FROM CurrentTask JOIN Tasks ON taskId = Tasks.id LIMIT 1;`
    ).get();
}

export function stopCurrentTask(currentTask = getCurrentTask()): CurrentTask | false {
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
    activeTask?: CurrentTask,
    stoppedTask?: CurrentTask,
}

function createNewTask(name: string): number {
    const info = db.prepare('INSERT INTO Tasks (name) VALUES (?);').run(name);
    return info.lastInsertRowid as number;
}

function getTaskIdByName(name: string): number | undefined {
    return db.prepare('SELECT id FROM Tasks WHERE name = ?;').pluck().get(name);
}

export function startTask(name: string): StartTaskResult {
    try {
        const currentTask = getCurrentTask();
        let id = getTaskIdByName(name);

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
            id = createNewTask(name);
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

export interface UITaskLogEntry {
    id: number,
    taskName: string,
    startTime: number,
    endTime: number,
}

export function getTaskLogs(limit = 100, offset = 0): UITaskLogEntry[] {
    return db.prepare(`
        SELECT logs.id, Tasks.name as taskName, startTime, endTime
        FROM TaskLogs logs JOIN Tasks ON Tasks.id = logs.taskId
        ORDER BY startTime DESC
        LIMIT ? OFFSET ?;
    `).all(limit, offset);
}

export interface UITaskLogEntryUpdate extends Partial<UITaskLogEntry> {
    id: number,
}

function getTaskIdByTaskLogEntryId(id: number): number {
    const taskId = db.prepare('SELECT taskId FROM TaskLogs WHERE id = ?;').pluck().get(id);
    if (!taskId) throw new Error('There is no task log entry with the id ' + id);
    return taskId;
}

function deleteTaskIfNotUsed(taskId: number): void {
    const exists = db.prepare('SELECT EXISTS(SELECT 1 FROM TaskLogs WHERE taskId = ? LIMIT 1);').pluck().get(taskId);
    if (!exists) {
        db.prepare("DELETE FROM Tasks WHERE id = ?;").run(taskId);
    }
}

export function updateTaskLogEntry(data: UITaskLogEntryUpdate): void {
    if (data.taskName) {
        const name = data.taskName;
        let taskId = getTaskIdByName(name);
        const oldTaskId = db.prepare('SELECT taskId FROM TaskLogs WHERE id = ?;').pluck().get(data.id);
        db.transaction(() => {
            if (!taskId) {
                taskId = createNewTask(name);
            }
            db.prepare(`UPDATE TaskLogs SET taskId = ? WHERE id = ?;`).run(taskId, data.id);
            deleteTaskIfNotUsed(oldTaskId);
        })();
        return;
    }

    const targets = [data.startTime ? 'startTime = :startTime' : '', data.endTime ? 'endTime = :endTime' : '']
        .filter(t => t).join(',');
    targets && db.prepare(`UPDATE TaskLogs SET ${targets} WHERE id = :id;`).run(data);
}

export function deleteTaskLogEntry(id: number) {
    const taskId = getTaskIdByTaskLogEntryId(id);
    db.transaction(() => {
        db.prepare('DELETE FROM TaskLogs WHERE id = ?;').run(id);
        deleteTaskIfNotUsed(taskId);
    })();
}