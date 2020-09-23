'use strict';

const net = require('net');

const socketPath = '\\\\.\\pipe\\vrem.sock';

let counter = 0;

const server = net.createServer((client) => {
    // 'connection' listener.
    const id = ++counter;
    console.log('\nClient connected', id);
    client.on('end', () => {
        console.log('\nClient disconnected', id);
    });
    // client.write('hello\r\n');
    // client.pipe(c);

    client.setEncoding('utf8');

    client.on('data', data => {
        console.log('\nGot data from the client: ', id, data);
        client.write('vrem! ' + id, () => {
            console.log('Sent response to the client.', id);
        });
    });
});

server.on('error', (err) => {
    throw err;
});

server.listen(socketPath, () => {
    console.log('Server is listening on socket ', socketPath);
});