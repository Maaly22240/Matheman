// frontend/config-overrides.js
const webpack = require('webpack');

module.exports = function override(config, env) {
    config.resolve.fallback = {
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        vm: require.resolve('vm-browserify'),
        process: require.resolve('process/browser')
    };

    config.plugins.push(
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
        })
    );

    return config;
};