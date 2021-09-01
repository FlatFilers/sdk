const { merge } = require('webpack-merge')
const base = require('./webpack.base.js')
const path = require('path')

module.exports = merge(base, {
  mode: 'development',
  // serve source files
  entry: './__sandbox__/index.tsx',
  devtool: 'eval-cheap-source-map',
  devServer: {
    inline: true,
    contentBase: path.join(__dirname, 'public'),
    liveReload: true,
    historyApiFallback: true,
    host: process.env.HOST || 'localhost',
    hot: true,
    port: process.env.PORT || 8081,
  },
})
