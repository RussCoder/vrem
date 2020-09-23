#!/usr/bin/env node

'use strict';

const { program } = require('commander');
const { fork } = require('child_process');
const colors = require('./colors');
const constants = require('./constants');
const { request } = require('./client');
const { version } = require('../package.json');

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
    });

program
    .command('report [date]')
    .description('show the statistics of apps usage')
    .option('--from <date>', 'the start date')
    .option('--to <date>', 'the end date')
    .action(require('./report'));


void program.parseAsync(process.argv);