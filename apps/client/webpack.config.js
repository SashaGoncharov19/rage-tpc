/// <reference types="@types/node"/>
const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: process.env.ENV === 'production' ? 'production' : 'development',
  devtool: 'source-map',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, '..', '..', 'ragemp-server', 'client_packages'),
  },
};
