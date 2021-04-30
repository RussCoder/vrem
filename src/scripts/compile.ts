import colors from "../colors";
import cp from 'child_process';
import fs from 'fs';
import { startProcess, stopProcess, isProcessAlive, trackerProcessName, trackerScriptPath } from "../process";
import constants from "../constants";

const hasBinary = fs.existsSync('./dist_native/vrem_windows.node')
    && process.platform === 'win32' && process.arch === 'x64';

if (hasBinary) {
    console.info(colors.green('\nPrebuilt binary is detected. No compilation is required.\n'));
} else {
    void compile();
}

async function compile() {
    const alive = await isProcessAlive(constants.autoTrackerSocketPath);

    if (alive) {
        await stopProcess(trackerProcessName, constants.autoTrackerSocketPath);
    }

    console.info(colors.cyan('\nNo prebuilt binary. Trying to compile...\n'));
    cp.execSync('node-gyp rebuild', {
        stdio: "inherit",
    });

    console.info(colors.green('\nCompilation succeeded.\n'));

    if (alive) {
        await startProcess(trackerProcessName, trackerScriptPath, constants.autoTrackerSocketPath);
    }
}