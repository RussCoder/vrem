import { ipcRequest } from "./ipc";
import { fork } from 'child_process';
import path from 'path';
import colors from "./colors";

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

export async function isProcessAlive(socketPath, attempts = 3, waitTime = 150): Promise<boolean> {
    const check = async () => {
        try {
            //return process.kill(pid, 0);
            const data = await ipcRequest(socketPath, 'ping');
            return data.name === 'vrem' /*&& data.version === version*/;
        } catch (e) {
            return false;
        }
    };

    let isAlive = await check();
    for (let i = 0; i < attempts && !isAlive; i++) {
        await sleep(waitTime);
        isAlive = await check();
    }

    return isAlive;
}

function runProcess(filePath) {
    const proc = fork(path.resolve(__dirname, filePath), {
        detached: true,
        stdio: 'ignore',
        env: {
            NODE_ENV: 'production',
        },
    });
    proc.unref();
    proc.disconnect();
}

async function _stopProcess(socketPath) {
    let totalTime = 0;
    const timeLimit = 2000;
    const step = 500;
    await ipcRequest(socketPath, 'exit');
    while (await isProcessAlive(socketPath)) {
        if (totalTime > timeLimit) return false;
        totalTime += step;
        await sleep(step);
    }
    return true;
}

export async function startProcess(processName, filePath, socketPath): Promise<boolean> {
    if (await isProcessAlive(socketPath)) {
        console.info(colors.cyan(`The ${processName} process is already running.`));
        return true;
    }

    console.info(`Starting the ${processName} process...`);
    runProcess(filePath);

    // it takes about 1 second to start the server process first time
    if (await isProcessAlive(socketPath, 8, 250)) {
        console.info(colors.green(`The ${processName} process has been started.`));
        return true;
    } else {
        console.info(colors.red(`Failed to start the ${processName} process.`));
        return false;
    }
}

export async function stopProcess(processName, socketPath) {
    if (await isProcessAlive(socketPath)) {
        console.info(`Stopping the ${processName} process...`);

        if (await _stopProcess(socketPath)) {
            console.info(colors.yellow(`The ${processName} process has been stopped.`));
        } else {
            console.info(colors.red(`Cannot stop the ${processName} process. Remove it manually.`));
        }

        return;
    }

    console.info(colors.yellow(`The ${processName} process has been already stopped.`));
}

export const trackerProcessName = 'auto-tracker';
export const trackerScriptPath = path.resolve(__dirname, './tracker/tracker');
export const serverProcessName = 'server';
export const serverScriptPath = path.resolve(__dirname, './server/server');