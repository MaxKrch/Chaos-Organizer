const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');
// const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
	target: 'web',
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

			if(filePathArray[1] === 'ui') {
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
		// new WorkboxPlugin.GenerateSW({
		//   clientsClaim: true,
		//   skipWaiting: true,
		//   cleanupOutdatedCaches: true
		// }) // Auto SW from Google
		// new WorkboxPlugin.InjectManifest({
		//   swSrc: './src/service-worker.js',
		//   swDest: 'service-worker.js',
		// })
	],
};
