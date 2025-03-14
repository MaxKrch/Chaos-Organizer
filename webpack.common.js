const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');
// const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
	target: 'web',
	// entry: {
  //   'main': path.resolve(__dirname, './src/index.js'),
  //   'service-worker': path.resolve(__dirname, './src/service-worker.js')
  // },
	output: {
		clean: true,
		path: path.resolve(__dirname, 'dist'),
		publicPath: '',
		assetModuleFilename: (pathData) => {
			const filePathArray = path
				.dirname(pathData.filename)
				.split('/')
				.slice(1)
			const filePath = filePathArray.join('/');
			if(filePathArray[1] === 'ui' || filePathArray[1] === 'icons') {
				return `${filePath}/[name][ext]`
			}
			return `${filePath}/[name]-[hash][ext]`
		},
    filename: '[name].js',
 	},
	module: {
		rules: [
			//For old style import workers with loaders
			{
				test: /web-worker\.js$/,
				loader: 'worker-loader',
        options: { 
          filename: 'workers/[name].js'
        },
			},
			{
				test: /share-worker\.js$/,
				loader: "worker-loader",
				options: {
					worker: "SharedWorker",
          filename: 'workers/[name].js'
				},
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				},
			},
			{
				test: /\.html$/,
				use: [
					{
						loader: 'html-loader',
					},
				],
			},
			{
				test: /\.(sc|sa|c)ss$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
			},
			// {
			// 	test: /\.(sc|sa|c)ss$/,
      // 	use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
      // },
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: 'asset/resource',
			},
		],
	},
	plugins: [
		new webpack.ProvidePlugin({
			process: 'process/browser',
			stream: 'stream-browserify',
			buffer: 'buffer'
		}), //for create global var (?)
		new NodePolyfillPlugin(),
		new HtmlWebPackPlugin({
			template: './src/index.html',
			filename: './index.html',
		}),
		new MiniCssExtractPlugin({
			filename: '[name].css',
			chunkFilename: '[id].css',
		}),
	],
};
