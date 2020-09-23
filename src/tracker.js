'use strict';

const net = require('net');
const { version } = require('../package.json');
const constants = require('./constants');
const { getActiveProgram, getIdleTime } = require('../build/Release/vrem_windows.node');
const fs = require('fs');
const dataUtils = require('./data_utils');

process.on('uncaughtException', e => {
    fs.appendFileSync(dataUtils.mainFolder + '/tracker_errors.log', e.stack, 'utf8');
    process.exit(1);
});

// The server is needed only to detect is the tracking process alive or not from the cli
function createServer() {
    const server = net.createServer((client) => {
        client.on('end', () => { });
        client.setEncoding('utf8');

        client.on('data', data => {
            switch (data) {
                case 'ping':
                    client.write(JSON.stringify({
                        version: version,
                        name: "vrem",
                    }));
                    break;

                case 'exit':
                    client.write('true', () => process.exit());
                    break;

                default:
                    client.write("Vrem's tracking process cannot identify the request!");
            }
        });
    });

    server.on('error', (err) => {
        throw err;
    });

    server.listen(constants.autoTrackerSocketPath, () => {
        console.log("Vrem's tracking process is listening on socket ", constants.autoTrackerSocketPath);
    });
}

const dev = !module.parent;

function appendToFile(data, filePath = dataUtils.getFullPathToCurrentLogFile()) {
    if (typeof data === 'object') {
        data = JSON.stringify(data) + '\n';
    }

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, data);
    } else {
        fs.appendFileSync(filePath, data);
    }
}


// Set onExit callbacks to add the last entry to the log file
{
    const exit = () => process.exit();
    process.on('SIGINT', exit);
    process.on('SIGTERM', exit);
    process.on('uncaughtException', e => {
        console.log(e);
        exit();
    });
    process.on('unhandledRejection', e => {
        console.log(e);
        exit();
    });

    createServer();

    appendToFile({ begin: true, timestamp: Date.now() });

    process.on('exit', () => {
        appendToFile({ end: true, timestamp: Date.now() });
        dev && console.log('Exit');
    });
}

// The core code of the tracker process

let lastProgram = {};
let isIdle = false;
const IDLE_THRESHOLD = 90000;

setInterval(() => {
    const idleTime = getIdleTime();
    dev && console.log('Idle time = ', getIdleTime());

    if (idleTime > IDLE_THRESHOLD) {
        if (!isIdle) {
            appendToFile({ idle: true, timestamp: Date.now() });
            isIdle = true;
            lastProgram = {};
        }

        return;
    } else if (isIdle) {
        isIdle = false;
    }

    const activeProgram = getActiveProgram();
    dev && console.log(activeProgram);

    if (!activeProgram || activeProgram.error) return;

    activeProgram.timestamp = Date.now();

    if (lastProgram.path !== activeProgram.path) {
        appendToFile(activeProgram);
        lastProgram = activeProgram;
    }
}, 1000);

/**
 * When the UTC day changes at 00:00 UTC we should add the "end" entry to the previous log file
 * and duplicate the currently active program in the new one.
 */
function setFinishTimeoutForCurrentLogFile() {
    const endOfDay = new Date().setUTCHours(23, 59, 59, 999);
    const pathToTheFinishedFile = dataUtils.getFullPathToCurrentLogFile();

    setTimeout(() => {
        appendToFile({ end: true, timestamp: endOfDay }, pathToTheFinishedFile);

        const currentLogFilePath = dataUtils.getFullPathToCurrentLogFile();
        const startOfDay = new Date().setUTCHours(0, 0, 0, 0);

        if (!fs.existsSync(currentLogFilePath)) {
            appendToFile({ begin: true, timestamp: startOfDay });
            if (lastProgram.path) {
                lastProgram.timestamp = startOfDay;
                appendToFile(lastProgram);
            }
        }

        setFinishTimeoutForCurrentLogFile();
    }, endOfDay - Date.now() + 1);
}

setFinishTimeoutForCurrentLogFile();
