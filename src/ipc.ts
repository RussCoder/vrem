/**
 * IPC stands for inter-process communication
 */
import { Server, Socket } from "net";

const net = require('net');
const { version } = require('../package.json');

export interface SequentialSocket extends Socket {
    send: (payload: any) => Promise<void>,
}

export function createSequentialSocket(socket: Socket): SequentialSocket {
    const sendRejects = new Set() as Set<Function>;
    let previousPromise: Promise<void> | null = null;

    socket.on('error', (e) => {
        sendRejects.forEach(reject => reject(e));
        sendRejects.clear();
    });

    return Object.assign(socket, {
        send(payload: any = null): Promise<void> {
            const promiseToWait = previousPromise;
            previousPromise = new Promise(async (resolve, reject) => {
                try {
                    await promiseToWait;
                } catch (e) {}

                sendRejects.add(reject);
                socket.write(JSON.stringify(payload), () => {
                    sendRejects.delete(reject);
                    resolve();
                });
            });
            return previousPromise;
        },
    });
}

export class PersistentConnection {
    private reconnectTimeout: number;
    public socket: SequentialSocket;

    constructor(socketPath, reconnectTimeout = 3000) {
        this.reconnectTimeout = reconnectTimeout;
        const socket = this.socket = createSequentialSocket(net.createConnection(socketPath));
        socket.setEncoding('utf8');
        // socket.on('connect', () => {
        //     console.log('connected');
        // })
        socket.on('close', (had_error) => {
            //console.log('close', had_error);
            setTimeout(() => this.socket.connect(socketPath), reconnectTimeout);
        });
    }

    onConnect(callback: () => void) {
        this.socket.on('connect', callback);
    }

    onClose(callback: () => void) {
        this.socket.on('close', callback);
    }

    onData(callback: (any) => void) {
        this.socket.on('data', (data: string) => {
            callback(JSON.parse(data));
        });
    }

    send(...args: Parameters<SequentialSocket['send']>) {
        return this.socket.send(...args);
    };
}

export function ipcRequest(socketPath, command, payload = null): Promise<any> {
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

export class IpcServer {
    private readonly handlers: { [key: string]: (object, Socket) => void };
    private readonly server: Server;

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
                    socket.write(JSON.stringify(`No handler for the command ${command}`));
                }
            });
        });

        this.server.on('error', (err) => {
            throw err;
        });
    }

    command(command: string, handler: (payload: any, socket: Socket) => void) {
        this.handlers[command] = handler;
    }

    listen(socketPath, callback) {
        this.server.listen(socketPath, callback);
    }
}