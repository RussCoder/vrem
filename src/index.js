#!/usr/bin/env node

'use strict';

const { program } = require('commander');
const { fork } = require('child_process');
const colors = require('./colors');
const constants = require('./constants');
const { ipcRequest } = require('./ipc');
const { version } = require('../package.json');
const utils = require('./utils');
const manualTask = require('./manualTask');
const path = require('path');

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

async function isProcessAlive(socketPath, waitTime = 300) {
    const check = async () => {
        try {
            //return process.kill(pid, 0);
            const data = await ipcRequest(socketPath, 'ping');
            return data.name === 'vrem' && data.version === version;
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

function runProcess(filePath) {
    const proc = fork(path.resolve(__dirname, filePath), {
        detached: true,
        stdio: 'ignore',
        env: {
            NODE_ENV: 'production',
        },
    });
    proc.unref();
    proc.disconnect();
}

async function _stopProcess(socketPath) {
    let totalTime = 0;
    const timeLimit = 2000;
    const step = 500;
    await ipcRequest(socketPath, 'exit');
    while (await isProcessAlive(socketPath)) {
        if (totalTime > timeLimit) return false;
        totalTime += step;
        await sleep(step);
    }
    return true;
}

async function startProcess(processName, filePath, socketPath) {
    if (await isProcessAlive(socketPath)) {
        return console.info(colors.cyan(`The ${processName} process is already running.`));
    }

    console.info(`Starting the ${processName} process...`);
    runProcess(filePath);

    if (await isProcessAlive(socketPath)) {
        console.info(colors.green(`The ${processName} process has been started.`));
    } else {
        console.info(colors.red(`Failed to start the ${processName} process.`));
    }
}

async function stopProcess(processName, socketPath) {
    if (await isProcessAlive(socketPath)) {
        console.info(`Stopping the ${processName} process...`);

        if (await _stopProcess(socketPath)) {
            console.info(colors.yellow(`The ${processName} process has been stopped.`));
        } else {
            console.info(colors.red(`Cannot stop the ${processName} process. Remove it manually.`));
        }

        return;
    }

    console.info(colors.yellow(`The ${processName} process has been already stopped.`));
}

async function checkProcess(processName, socketPath) {
    if (await isProcessAlive(socketPath)) {
        console.info(colors.green(`The ${processName} process is running.`));
    } else {
        console.info(colors.yellow(`The ${processName} process is stopped.`));
    }
}

program.version(version, '-v, --version', 'print the current version');

program
    .command('on')
    .description('start auto-tracking process')
    .option('-s, --server', 'also start server')
    .action(async ({ server }) => {
        await startProcess('auto-tracker', './tracker.js', constants.autoTrackerSocketPath);
        server && await startProcess('server', './server/server.js', constants.serverSocketPath);
    });

program
    .command('off')
    .description('stop auto-tracking process')
    .option('-s, --server', 'also stop server')
    .action(async ({ server }) => {
        await stopProcess('auto-tracker', constants.autoTrackerSocketPath);
        server && await stopProcess('server', constants.serverSocketPath);
    });

program
    .command('rerun')
    .description('reruns auto-tracking process')
    .action(async () => {
        await stopProcess('auto-tracker', constants.autoTrackerSocketPath);
        await startProcess('auto-tracker', './tracker.js', constants.autoTrackerSocketPath);
    });

const serverCommand = program
    .command('server <on/off/rerun>')
    .description('turns UI server on/off');

serverCommand.command('on')
    .description('turns server on')
    .action(() => startProcess('server', './server/server.js', constants.serverSocketPath));

serverCommand.command('off')
    .description('turns server off')
    .action(() => stopProcess('server', constants.serverSocketPath));

serverCommand.command('rerun')
    .description('reruns server')
    .action(async () => {
        await stopProcess('server', constants.serverSocketPath);
        await startProcess('server', './server/server.js', constants.serverSocketPath)
    });

program
    .command('ui')
    .description('opens ui')
    .action(async () => {
        const isAlive = await isProcessAlive(constants.serverSocketPath);
        if (!isAlive) {
            await startProcess('server', './server/server.js', constants.serverSocketPath);
        }

        const url = 'http://localhost:3210';
        console.info(`Opening ${url}...`);
        utils.openUrl('http://localhost:3210');
    });

program
    .command('status')
    .description('check whether auto-tracking process is running.')
    .action(async () => {
        await checkProcess('auto-tracker', constants.autoTrackerSocketPath);
        await checkProcess('server', constants.serverSocketPath);

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
    .command('start <name>')
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