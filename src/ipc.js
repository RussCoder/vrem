/**
 * IPC stands for inter-process communication
 */

'use strict';

const net = require('net');
const { version } = require('../package.json');

function ipcRequest(socketPath, command, payload = null) {
    return new Promise(((resolve, reject) => {
        try {
            const socket = net.createConnection(socketPath, () => {
                socket.setEncoding('utf8');

                socket.on('data', data => {
                    socket.destroy();
                    resolve(JSON.parse(data));
                });

                socket.write(JSON.stringify({ command, payload }));
            });

            socket.once('error', e => {
                reject(e)
            });

            socket.once('close', had_error => {
                had_error ? reject('Some socket error') : resolve('');
            });
        } catch (e) {
            reject(e);
        }
    }));
}

class IpcServer {
    constructor() {
        this.handlers = {
            ping: () => ({
                version: version,
                name: "vrem",
            }),
            exit: (payload, socket) => socket.write('true', () => process.exit()),
        };
        this.server = net.createServer(socket => {
            socket.setEncoding('utf8');

            socket.on('data', async json => {
                const { command, payload } = JSON.parse(json);

                if (this.handlers[command]) {
                    const result = await this.handlers[command](payload, socket);
                    if (result !== undefined) {
                        socket.write(JSON.stringify(result));
                    } else if (this.handlers[command].length < 2) {
                        throw new Error('IPC command handler should either return some value or write it manually');
                    }
                } else {
                    socket.write(`No handler for the command ${command}`);
                }
            });
        });

        this.server.on('error', (err) => {
            throw err;
        });
    }

    command(command, handler) {
        this.handlers[command] = handler;
    }

    listen(socketPath, callback) {
        this.server.listen(socketPath, callback);
    }
}

module.exports = {
    IpcServer,
    ipcRequest,
};