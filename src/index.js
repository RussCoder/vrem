#!/usr/bin/env node

'use strict';

const { program } = require('commander');
const { fork } = require('child_process');
const colors = require('./colors');
const constants = require('./constants');
const { request } = require('./client');
const { version } = require('../package.json');
const utils = require('./utils');
const manualTask = require('./manualTask');

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
    .command('on')
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
    .command('off')
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

        const currentTask = manualTask.getCurrentTask();
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
    .command('start [name]')
    .description('start a new task')
    .action(name => {
        try {
            const result = manualTask.startTask(name.trim());

            if (!result.success && result.reason === 'already_started') {
                console.info(colors.yellow(`Task "${colors.cyan(result.activeTask.name)}" has been already started`));
                return;
            }

            if (result.success) {
                console.info(colors.green(`Task "${colors.cyan(result.activeTask.name)}" has been started successfully`));
            }
        } catch (e) {
            console.error(colors.red('Cannot start the task. The error: '));
            console.error(e);
        }
    });

program
    .command('stop')
    .description('end the current task')
    .action(() => {
        try {
            const stoppedTask = manualTask.stopCurrentTask();
            if (stoppedTask) {
                console.info(colors.green(`Task "${colors.cyan(stoppedTask.name)}" has been stopped.`));
            } else {
                console.info(colors.yellow('No task has been started. Nothing to stop.'));
            }
        } catch (e) {
            console.error(colors.red('Cannot stop the task. The error: '));
            console.error(e);
        }
    });

void program.parseAsync(process.argv);