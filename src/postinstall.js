'use strict';

const colors = require('./colors');
const fs = require('fs-extra');
const path = require('path');
const { appFolder, autoTimeLogsFolder, mainFolder } = require('./data_utils');

console.info(colors.yellow(`
Note that the auto-tracking process is stopped.
Run "${colors.green('vrem on')}" to launch it.
`));

function migrate0() {
    const move = (from, to) => {
        if (fs.pathExistsSync(from)) {
            fs.copySync(from, to);
            fs.removeSync(from);
        }
    };
    move(path.resolve(appFolder, 'auto_time_logs'), autoTimeLogsFolder);
    move(appFolder + '/tracker_errors.log', mainFolder + '/tracker_errors.log');
}

migrate0();