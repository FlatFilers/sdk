const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './src/index.ts',
  stats: {
    errorDetails: true,
    colors: true,
    modules: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      name: 'flatfileImporter',
      type: 'umd',
    },
  },
  bail: true,
  plugins: [new webpack.HotModuleReplacementPlugin()],
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
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
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
