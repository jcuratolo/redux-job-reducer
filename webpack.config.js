var path = require('path')

module.exports = {
  entry: './src/index.js',
  devtool: 'cheap-module-source-map',
  devServer: {
    contentBase: './public'
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public')
  }
}