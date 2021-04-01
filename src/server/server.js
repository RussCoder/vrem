'use strict';

const express = require('express');
const path = require('path');
const apiMethods = require('./api');
const constants = require('../constants');
const { IpcServer } = require('../ipc');

(function () {
    new IpcServer().listen(constants.serverSocketPath, () => {
        console.info("Vrem's server process is listening on socket ", constants.serverSocketPath);
    });
})();

const app = express();

app.use(express.static(path.resolve(__dirname, '../../ui/dist')));

app.post('/api/jsonrpc2', express.json(), async (req, res) => {
    const data = req.body;
    try {
        if (!apiMethods[data.method]) {
            throw new Error("Ошибка: запрошен несуществующий метод API");
        }
        let result = await apiMethods[data.method](...data.params);

        return res.send({
            id: data.id,
            result: result,
        });
    } catch (e) {
        process.env.NODE_ENV !== 'production' && console.error(e);
        res.send({
            id: data.id,
            error: { message: "RPC error. " + e.message, requestBody: data },
        });
    }
});

// app.post('/extension', express.json(), async (req, res) => {
//     //console.log("Extension sent", req.body);
//     const response = await ipcRequest(constants.autoTrackerSocketPath, 'subprogram', req.body);
//     res.send(response);
// });

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../ui/dist/index.html'));
});

app.use((req, res) => {
    res.sendStatus(404);
});

app.listen(3210, () => {
    console.log('Server is listening on port 3210');
});