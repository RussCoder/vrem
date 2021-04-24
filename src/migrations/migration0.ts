import fs from 'fs-extra';
import path from 'path';
import constants from '../constants';
import { addToLogs } from "../tracker/tracker_utils";
import colors from "../colors";

const appFolder = constants.appFolder;
export const autoTimeLogsFolder = path.resolve(appFolder, 'auto_time_logs');

function* getLogEntriesFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    // const rl = readline.createInterface({
    //     input: fs.createReadStream(filePath),
    //     crlfDelay: Infinity
    // });

    const lines = fs.readFileSync(filePath, 'utf8').split('\n');

    //console.log(filePath, lines.length);

    for (const line of lines) {
        try {
            if (line) yield JSON.parse(line.trim());
        } catch (e) { }
    }
}

function* getAllLogEntries() {
    const files = fs.readdirSync(autoTimeLogsFolder).filter(fileName => {
        return /^\d\d\d\d-\d\d-\d\d\.txt$/.test(fileName);
    }).sort();

    for (const file of files) {
        for (const entry of getLogEntriesFromFile(path.resolve(autoTimeLogsFolder, file))) {
            yield entry;
        }
    }
}

export default function migrate0(db) {
    if (!fs.pathExistsSync(autoTimeLogsFolder)) return false;

    console.info(colors.cyan(`\nStarting migration 0...`));
    let errorCount = 0;
    db.transaction(() => {
        for (const entry of getAllLogEntries()) {
            try {
                addToLogs(entry, false);
            } catch (e) {
                errorCount++;
            }
        }
    }).immediate();

    fs.renameSync(autoTimeLogsFolder, autoTimeLogsFolder + '__processed');
    console.info(colors[errorCount ? 'yellow' : 'green'](
        `Migration 0 finished. ${errorCount ? 'With ' + errorCount + ' errors.' : ''}`
    ));

    return true;
}