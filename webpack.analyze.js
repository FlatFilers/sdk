const { merge } = require('webpack-merge')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const base = require('./webpack.prod.js')

module.exports = merge(base, {
  plugins: [new BundleAnalyzerPlugin()],
})
