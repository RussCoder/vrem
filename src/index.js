#!/usr/bin/env node

'use strict';

const { program } = require('commander');
const { fork } = require('child_process');
const colors = require('./colors');
const constants = require('./constants');
const { request } = require('./client');
const { version } = require('../package.json');
const db = require('./db');
const utils = require('./utils');

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

async function isProcessAlive(waitTime = 300) {
    const check = async () => {
        try {
            //return process.kill(pid, 0);
            const data = await request(constants.autoTrackerSocketPath, 'ping');
            return true;
        } catch (e) {
            return false;
        }
    };

    const isAlive = await check();
    if (!isAlive && waitTime) {
        await sleep(waitTime);
        return await check();
    } else {
        return isAlive;
    }
}

program.version(version, '-v, --version', 'print the current version');

program
    .command('start')
    .description('start auto-tracking process')
    .action(async () => {
        if (await isProcessAlive()) {
            return console.info(colors.cyan('Auto-tracking process has been already running.'));
        }

        console.info('Starting auto-tracking process...');

        const child = fork(__dirname + '/tracker.js', {
            detached: true,
            stdio: 'ignore'
        });

        child.unref();

        if (await isProcessAlive()) {
            console.info(colors.green('Auto-tracking process has been started.'));
        } else {
            console.info(colors.red('Failed to start auto-tracking process.'));
        }

        process.exit();
    });


async function stopProcess() {
    let totalTime = 0;
    const timeLimit = 2000;
    const step = 500;
    await request(constants.autoTrackerSocketPath, 'exit');
    while (await isProcessAlive()) {
        if (totalTime > timeLimit) return false;
        totalTime += step;
        await sleep(step);
    }
    return true;
}

program
    .command('stop')
    .description('stop auto-tracking process')
    .action(async () => {
        if (await isProcessAlive()) {
            console.info('Stopping auto-tracking process...');

            if (await stopProcess()) {
                console.info(colors.yellow('Auto-tracking process has been stopped.'));
            } else {
                console.info(colors.red('Cannot stop auto-tracking process. Remove it manually.'));
                process.exit(1);
            }

            return;
        }

        console.info(colors.yellow('Auto-tracking process has been already stopped.'));
    });

program
    .command('status')
    .description('check whether auto-tracking process is running.')
    .action(async () => {
        if (await isProcessAlive()) {
            console.info(colors.green('Auto-tracking process is running.'));
        } else {
            console.info(colors.yellow('Auto-tracking process is stopped.'));
        }

        const currentTask = getCurrentTask();
        if (currentTask) {
            console.info(colors.green(
                `The current task is "${colors.cyan(currentTask.name)}".\n` +
                `It began at ${colors.cyan(utils.makeTimeStringWithDate(new Date(currentTask.startTime)))} ` +
                `and lasted for ${colors.cyan(utils.makeDurationString(Date.now() - currentTask.startTime))}.`
            ));
        } else {
            console.info(colors.yellow('No task has been started.'));
        }
    });

program
    .command('report [date]')
    .description('show the statistics of apps usage')
    .option('--from <date>', 'the start date')
    .option('--to <date>', 'the end date')
    .action(require('./report').reportCommand);

program
    .command('begin [name]')
    .description('start a new task')
    .action(name => {
        try {
            name = name.trim();
            const currentTask = getCurrentTask();
            let id = db.prepare('SELECT id FROM Tasks WHERE name = ?;').pluck().get(name);

            if (currentTask && currentTask.taskId === id) {
                console.info(colors.yellow(`Task "${colors.cyan(currentTask.name)}" has been already started`));
                return;
            }

            db.exec('BEGIN;');
            if (!id) {
                const info = db.prepare('INSERT INTO Tasks (name) VALUES (?);').run(name);
                id = info.lastInsertRowid;
            }
            currentTask && stopCurrentTask(currentTask);
            db.prepare('INSERT INTO CurrentTask (taskId, startTime) VALUES (?, ?);').run(id, Date.now());
            db.exec('COMMIT;');

            console.info(colors.green(`Task "${colors.cyan(name)}" has been started successfully`));
        } catch (e) {
            db.exec('ROLLBACK;');
            console.info(colors.red('Cannot start the task. The error: '));
            console.error(e);
        }
    });

function getCurrentTask() {
    return db.prepare(
        `SELECT taskId, name, startTime FROM CurrentTask JOIN Tasks ON taskId = Tasks.id LIMIT 1;`
    ).get();
}

function stopCurrentTask(currentTask = getCurrentTask()) {
    if (!currentTask) return;

    try {
        db.exec('SAVEPOINT stop_current_task;')
        db.prepare('INSERT INTO ManualLogs (taskId, startTime, endTime) VALUES (?, ?, ?);')
            .run(currentTask.taskId, currentTask.startTime, Date.now());
        db.prepare('DELETE FROM CurrentTask;').run();
        db.exec('RELEASE stop_current_task;')
    } catch (e) {
        db.exec('ROLLBACK TO stop_current_task;');
        throw e;
    }
}

program
    .command('end')
    .description('end the current task')
    .action(() => {
        try {
            const currentTask = getCurrentTask();
            if (currentTask) {
                stopCurrentTask(currentTask);
                console.info(colors.green(`Task "${colors.cyan(currentTask.name)}" has been ended`));
            } else {
                console.info(colors.yellow('No task has been started'));
            }
        } catch (e) {
            console.info(colors.red('Cannot stop the task. The error: '));
            console.error(e);
        }
    });

void program.parseAsync(process.argv);