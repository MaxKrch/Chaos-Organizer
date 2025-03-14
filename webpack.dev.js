const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const path = require('path');

module.exports = merge(common, {
  // Set the mode to development or production
  mode: 'development',
  // Control how source maps are generated
  devtool: 'inline-source-map',

  // Spin up a server for quick development
  devServer: {
    port: 9000,
    historyApiFallback: true,
    open: true,
    compress: true, 
    // client: {
    //   //Close overlay, if use workbox 
    //   overlay: false,
    // },   
    static: [
      {
        directory: path.join(__dirname, 'src/index.html'),
      },
      // {
      //   directory: path.join(__dirname, 'css'),
      // },
    ],
  },
  optimization: {
    runtimeChunk: 'single'
  },
  plugins: [
    // Only update what has changed on hot reload
    new webpack.HotModuleReplacementPlugin(),
  ],
});
