const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')

module.exports = {
  entry: './src/index.ts',
  stats: {
    errorDetails: true,
    colors: true,
    modules: true,
  },
  output: {
    filename: 'index.js',
    library: {
      type: 'umd',
    },
  },
  bail: true,
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new Dotenv({
      path: process.env.NODE_ENV === 'development'
        ? './.env.development'
        : process.env.NODE_ENV === 'staging'
          ? './.env.staging'
          : './.env'
    })
  ],
  module: {
    rules: [
      {
        test: /\.(svg|otf|png)$/,
        loader: 'file-loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    node: 'current',
                  },
                },
              ],
              [
                '@babel/preset-react',
                {
                  runtime: 'automatic',
                },
              ],
              '@babel/preset-typescript',
            ],
            plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime'],
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      src: path.resolve('src'),
    },
    extensions: ['.tsx', '.js', '.ts'],
  },
}
