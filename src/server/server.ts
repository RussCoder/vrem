import { IpcServer, PersistentConnection } from "../ipc";
import http from 'http';
import WebSocket from 'ws';
import { getDescriptionByPath } from "../utils";
import apiMethods from './api';
import constants from "../constants";

const express = require('express');
const path = require('path');

(function () {
    new IpcServer().listen(constants.serverSocketPath, () => {
        console.info("Vrem's server process is listening on socket ", constants.serverSocketPath);
    });
})();

const app = express();

const uiPath = path.resolve(__dirname, '../../dist_ui');

app.use(express.static(uiPath));

// app.post('/extension', express.json(), async (req, res) => {
//     //console.log("Extension sent", req.body);
//     const response = await ipcRequest(constants.autoTrackerSocketPath, 'subprogram', req.body);
//     res.send(response);
// });

app.get('*', (req, res) => {
    res.sendFile(uiPath + '/index.html');
});

app.use((req, res) => {
    res.sendStatus(404);
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, clientTracking: true, path: '/vrem-api' });
let currentProgram: Record<string, any> | null = null;

apiMethods.getActiveProgram = () => currentProgram;

function notifyWs(ws, type, value) {
    ws.send(JSON.stringify({ type, value }));
}

wss.on('connection', ws => {
    notifyWs(ws, 'current_program', currentProgram);

    ws.on('message', async (json: string) => {
        const data = JSON.parse(json);
        try {
            if (!apiMethods[data.method]) {
                throw new Error("Ошибка: запрошен несуществующий метод API");
            }
            const result = await apiMethods[data.method](...data.params);

            ws.send(JSON.stringify({
                id: data.id,
                result: result,
            }));
        } catch (e) {
            process.env.NODE_ENV !== 'production' && console.error(e);
            ws.send(JSON.stringify({
                id: data.id,
                error: { message: "RPC error. " + e.message, requestBody: data },
            }));
        }
    });
});

const trackerConnection = new PersistentConnection(constants.autoTrackerSocketPath);
trackerConnection.onConnect(async () => {
    try {
        await trackerConnection.send({ command: 'subscribe' });
    } catch (e) {
        console.error('Cannot subscribe', e);
    }
});
trackerConnection.onData(data => {
    currentProgram = data;
    if (currentProgram) currentProgram.description = currentProgram.description || getDescriptionByPath(data.path);

    //console.log('Data from tracker', data);
    wss.clients.forEach(ws => notifyWs(ws, 'current_program', currentProgram));
});
trackerConnection.onClose(() => {
    currentProgram = null;
    wss.clients.forEach(ws => notifyWs(ws, 'current_program', currentProgram));
});

server.listen(3210, () => {
    console.info('Server is listening on port 3210');
});