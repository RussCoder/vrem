'use strict';

// const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = {
    devServer: {
        // before: (app, server, compiler) => {
        //     const proxy = createProxyMiddleware('/vrem-api', {
        //         target: 'http://localhost:3210',
        //         ws: true,
        //         proxyTimeout: 1000,
        //         timeout: 1000,
        //         onError(e, req, res) {
        //             console.log('Handled proxy error \n\n', e);
        //         },
        //     });
        //
        //     // Do not use standard "proxy" option because it doesn't allow to handle errors
        //     app.use((...args) => console.log("Request for proxy \n\n") || proxy(...args));
        // },
        // proxy: {
        //     '^/': {
        //         target: 'http://localhost:3210',
        //         ws: true,
        //     }
        // },
    }
}