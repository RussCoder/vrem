'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

const mainFolder = path.resolve(os.userInfo().homedir, '.vrem');
const autoTimeLogsFolder = path.resolve(mainFolder, 'auto_time_logs');

!fs.existsSync(mainFolder) && fs.mkdirSync(mainFolder);
!fs.existsSync(autoTimeLogsFolder) && fs.mkdirSync(autoTimeLogsFolder);

function getFileNameByDate(date = new Date()) {
    return date.toISOString().split('T')[0] + '.txt';
}

function getFullPathToCurrentLogFile() {
    return path.resolve(autoTimeLogsFolder, getFileNameByDate());
}

module.exports = {
    mainFolder,
    autoTimeLogsFolder,
    getFileNameByDate,
    getFullPathToCurrentLogFile,
};