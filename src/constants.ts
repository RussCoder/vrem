import os from 'os';
import path from 'path';
import fs from 'fs';

const appFolder = path.resolve(os.userInfo().homedir, '.vrem');
const dbFolder = path.resolve(appFolder, 'db');
!fs.existsSync(appFolder) && fs.mkdirSync(appFolder);
!fs.existsSync(dbFolder) && fs.mkdirSync(dbFolder);

const constants = Object.freeze({
    autoTrackerSocketPath: '\\\\.\\pipe\\vrem-auto-tracker.sock',
    serverSocketPath: '\\\\.\\pipe\\vrem-server.sock',
    appFolder: appFolder,
    dbPath: path.resolve(dbFolder, 'vrem.sqlite'),
});

export default constants;