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
    db.prepare('SELECT json_group_object(type, id) FROM ProgramLogTypes;').pluck().get()
));

// The server is needed only to detect is the tracking process alive or not from the cli
function createServer() {
    const server = net.createServer((client) => {
        client.on('end', () => { });
        client.setEncoding('utf8');

        client.on('data', json => {
            const obj = JSON.parse(json);
            switch (obj.command) {
                case 'subprogram':
                    main(obj.payload);
                    client.write('ok');
                    break;

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
    dev && console.log('add to logs', data);

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
    let parentId = null;
    if (type === logTypes.program) {
        if (!path) return;
        const query = db.prepare('SELECT id FROM Programs WHERE path = ?;').pluck();
        programId = query.get(path);
        if (data.parent) {
            parentId = query.get(data.parent.path);
        }
    }

    db.transaction(() => {
        if (!programId && type === logTypes.program) {
            const query = db.prepare('INSERT INTO Programs (path, description, parentId) VALUES (?, ?, ?);');

            if (data.parent && !parentId) {
                parentId = query.run(data.parent.path, data.parent.description, null).lastInsertRowid;
            }

            programId = query.run(path, description, parentId).lastInsertRowid;
        }

        db.prepare('INSERT INTO ProgramLogs (timestamp, type, programId) VALUES (?, ?, ?);')
            .run(timestamp, type, programId);
    })();
}


// Set onExit callbacks to add the last entry to the log file
{
    const exit = () => process.exit();
    process.on('SIGINT', exit);
    process.on('SIGTERM', exit);
    const exceptionHandler = e => {
        dev && console.error(e);
        fs.appendFileSync(dataUtils.mainFolder + '/tracker_errors.log', e.stack, 'utf8');
        process.exit(1);
    };
    process.on('uncaughtException', exceptionHandler);
    process.on('unhandledRejection', exceptionHandler);

    createServer();

    addToLogs({ begin: true, timestamp: Date.now() });

    process.on('exit', () => {
        addToLogs({ end: true, timestamp: Date.now() });
        dev && console.log('Exit');
    });
}

// The core code of the tracker process

let lastProgram = {};
let lastSubprogramTimestamp = null;
// deferredProgram can be only a browser. If the user switches to another program,
// the tracker forgets the subprogram at once. deferredProgram makes sense when the extension is disabled,
// but the browser remains in focus.
let deferredProgram = null;
let isIdle = false;
const IDLE_THRESHOLD = 90000;
const SUBPROGRAM_TIMEOUT = 2000;
const MAIN_INTERVAL = 1000;

function main(subprogram = null) {
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

    if (!activeProgram || activeProgram.error) return;

    activeProgram.timestamp = Date.now();

    function processProgram(program) {
        if (lastProgram.path !== program.path || Boolean(lastProgram.parent) !== Boolean(program.parent)) {
            addToLogs(program);
            lastProgram = program;
        }
    }

    if (subprogram) { // when request came from the browser extension
        subprogram.description = '';
        subprogram.parent = activeProgram;
        lastSubprogramTimestamp = subprogram.timestamp;

        if (
            !subprogram.path // extension send the last message with null values, when there is no focused website.
            // When subprogram changed  parent.path it can be that there are two browsers,
            // but also that the user has switch to another program. We assume the latter here.
            || (lastProgram.parent && lastProgram.path === subprogram.path && lastProgram.parent.path !== subprogram.parent.path)
        ) {
            dev && console.log('Turn off subprogram mode', subprogram);
            lastSubprogramTimestamp = null;
        } else {
            if (activeProgram.timestamp - subprogram.timestamp < 100) {
                //dev && console.log('timestamp diff', activeProgram.timestamp - subprogram.timestamp);
                processProgram(subprogram);
                deferredProgram = null;
            }
            return;
        }
    }

    if (lastProgram.parent && lastSubprogramTimestamp) { // usual iteration
        if ((Date.now() - lastSubprogramTimestamp > SUBPROGRAM_TIMEOUT) || lastProgram.parent.path !== activeProgram.path) {
            dev && console.log(`Switch to usual mode ${Date.now() - lastSubprogramTimestamp > SUBPROGRAM_TIMEOUT
                ? ' due to timeout' : 'due to program change.'}` + 'The deferred: ', deferredProgram);
            deferredProgram && processProgram(deferredProgram);
            deferredProgram = null;
        } else {
            deferredProgram = deferredProgram || activeProgram; // we should preserve the oldest timestamp
            return;
        }
    }

    processProgram(activeProgram);
}

setInterval(main, MAIN_INTERVAL);
