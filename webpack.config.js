const path = require('path');
const MinimizerCss = require('css-minimizer-webpack-plugin')

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    devtool: 'eval',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.html$/i,
                loader: "html-loader",
            },
            {
                test: /\.css$/i,
                use: ['to-string-loader', "css-loader"],
            },
        ],
    },
    optimization: {
        minimizer: [
            new MinimizerCss()
        ]
    },
}