#!/usr/bin/env node

import colors from './colors';
import constants from "./constants";
import * as utils from './utils';
import * as manualTask from './task';
import {
    isProcessAlive,
    startProcess,
    stopProcess,
    trackerScriptPath,
    serverScriptPath,
    trackerProcessName,
    serverProcessName
} from "./process";

const { program } = require('commander');
const { version } = require('../package.json');

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
        await startProcess(trackerProcessName, trackerScriptPath, constants.autoTrackerSocketPath);
        server && await startProcess(serverProcessName, serverScriptPath, constants.serverSocketPath);
    });

program
    .command('off')
    .description('stop auto-tracking process')
    .option('-s, --server', 'also stop server')
    .action(async ({ server }) => {
        await stopProcess(trackerProcessName, constants.autoTrackerSocketPath);
        server && await stopProcess(serverProcessName, constants.serverSocketPath);
    });

program
    .command('rerun')
    .description('reruns auto-tracking process')
    .action(async () => {
        await stopProcess(trackerProcessName, constants.autoTrackerSocketPath);
        await startProcess(trackerProcessName, trackerScriptPath, constants.autoTrackerSocketPath);
    });

const serverCommand = program
    .command('server <on/off/rerun>')
    .description('turns UI server on/off');

serverCommand.command('on')
    .description('turns server on')
    .action(() => startProcess(serverProcessName, serverScriptPath, constants.serverSocketPath));

serverCommand.command('off')
    .description('turns server off')
    .action(() => stopProcess(serverProcessName, constants.serverSocketPath));

serverCommand.command('rerun')
    .description('reruns server')
    .action(async () => {
        await stopProcess(serverProcessName, constants.serverSocketPath);
        await startProcess(serverProcessName, serverScriptPath, constants.serverSocketPath)
    });

program
    .command('ui')
    .description('opens ui')
    .action(async () => {
        let isAlive = await isProcessAlive(constants.serverSocketPath);
        if (!isAlive) {
            isAlive = await startProcess(serverProcessName, serverScriptPath, constants.serverSocketPath);
        }

        if (isAlive) {
            const url = 'http://localhost:3210';
            console.info(`Opening ${url}...`);
            utils.openUrl('http://localhost:3210');
        }
    });

program
    .command('status')
    .description('check whether auto-tracking process is running.')
    .action(async () => {
        await checkProcess(trackerProcessName, constants.autoTrackerSocketPath);
        await checkProcess(serverProcessName, constants.serverSocketPath);

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
                console.info(colors.yellow(`Task "${colors.cyan(result.activeTask?.name)}" has been already started`));
                return;
            }

            if (result.success) {
                console.info(colors.green(`Task "${colors.cyan(result.activeTask?.name)}" has been started successfully`));
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