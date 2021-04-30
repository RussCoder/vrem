'use strict';

const path = require('path');
// const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = {
    outputDir: '../dist_ui',
    pages: {
        index: 'src/main.js',
    },
    configureWebpack: {
        resolve: {
            alias: {
                '@backend': path.resolve(__dirname, '../src/'),
            },
        },
    },
    chainWebpack: (config) => {
        const svgRule = config.module.rule('svg');

        svgRule.uses.clear();

        svgRule
            .use('vue-loader')
            .loader('vue-loader-v16')
            .end()
            .use('vue-svg-loader')
            .loader('vue-svg-loader');
    },
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