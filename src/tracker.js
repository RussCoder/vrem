'use strict';

const net = require('net');
const { version } = require('../package.json');
const constants = require('./constants');
const { getActiveProgram, getIdleTime } = require('../build/Release/vrem_windows.node');
const fs = require('fs');
const dataUtils = require('./data_utils');
const db = require('./db');
const dev = process.argv[2] === '--dev';

const logTypes = Object.freeze(JSON.parse(
    db.prepare('SELECT json_group_object(type, id) FROM AutoLogTypes;').pluck().get()
));

process.on('uncaughtException', e => {
    dev && console.error(e);
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
        console.info("Vrem's tracking process is listening on socket ", constants.autoTrackerSocketPath);
    });
}

function addToLogs(data) {
    const timestamp = Date.now();
    let type = logTypes.program,
        description = data.description || "",
        path = data.path;

    if (data.begin) {
        type = logTypes.begin;
    } else if (data.end) {
        type = logTypes.end;
    } else if (data.idle) {
        type = logTypes.idle;
    }

    let programId = null;
    if (type === logTypes.program) {
        if (!path) return;
        programId = db.prepare('SELECT id FROM Programs WHERE path = ?;').pluck().get(path);
    }

    db.transaction(() => {
        if (!programId && type === logTypes.program) {
            const info = db.prepare('INSERT INTO Programs (path, description) VALUES (?, ?);')
                .run(path, description);
            programId = info.lastInsertRowid;
        }

        db.prepare('INSERT INTO AutoLogs (timestamp, type, programId) VALUES (?, ?, ?);')
            .run(timestamp, type, programId);
    })();
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

    addToLogs({ begin: true, timestamp: Date.now() });

    process.on('exit', () => {
        addToLogs({ end: true, timestamp: Date.now() });
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
            addToLogs({ idle: true, timestamp: Date.now() });
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
        addToLogs(activeProgram);
        lastProgram = activeProgram;
    }
}, 1000);
