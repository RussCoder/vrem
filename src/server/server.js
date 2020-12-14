'use strict';

const express = require('express');
const path = require('path');
const apiMethods = require('./api');

const app = express();

app.use(express.static(path.resolve(__dirname, '../ui/dist')));

app.post('/api/jsonrpc2', express.json(), async (req, res) => {
    const data = req.body;
    try {
        if (!apiMethods[data.method]) {
            throw new Error("Ошибка: запрошен несуществующий метод API");
        }
        let result = await apiMethods[data.method](...data.params, req);

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

app.listen(3210, () => {
    console.log('Server is listening on port 3210');
});

