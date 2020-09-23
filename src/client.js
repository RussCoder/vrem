'use strict';

const net = require('net');

// const socket = net.createConnection(socketPath, () => {
//     console.log('Connected to the ', socketPath);
//
//     socket.setEncoding('utf8');
//
//     socket.on('data', data => {
//         console.log('Got data from the server: ', data);
//     });
//
//     setInterval(() => {
//         socket.write('vrem?', () => {
//             console.log('Sent message to the server...');
//         })
//     }, 3000);
// });

function request(socketPath, data) {
    return new Promise(((resolve, reject) => {
        try {
            const socket = net.createConnection(socketPath, () => {
                socket.setEncoding('utf8');

                socket.on('data', data => {
                    resolve(data);
                    socket.destroy();
                });

                socket.write(data);
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

module.exports = {
    request,
};