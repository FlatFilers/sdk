const { merge } = require('webpack-merge')
const base = require('./webpack.base.js')

module.exports = merge(base, {
  mode: 'development',
  // serve source files
  entry: './__sandbox__/dev.index.tsx',
  devServer: {
    contentBase: 'public',
    liveReload: true,
    historyApiFallback: true,
    host: process.env.HOST || 'localhost',
    hot: true,
    port: process.env.PORT || 8080,
  },
})
