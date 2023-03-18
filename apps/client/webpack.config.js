/// <reference types="@types/node"/>
const path = require('path');
const loader = require("ts-loader");

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: process.env.ENV === 'production' ? 'production' : 'development',
  devtool: 'source-map',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [{
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        }],
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
