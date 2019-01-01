const path = require('path')

const packageJson = require('./package.json')

const bundledModules = [
  'elliptic',
  'ethereumjs-tx',
  'ethereumjs-util',
  'hash.js',
  'hmac-drbg'
]

const externals = [
  ...Object.keys(packageJson.dependencies).filter(
    name => bundledModules.indexOf(name) < 0
  ),
  '@babel/runtime/regenerator',
  'react-native',
  'react-native-fast-crypto',
  'react-native-tcp',
  'react-native-tcp/tls'
]

const babelOptions = {
  // For debugging, just remove "@babel/preset-env":
  presets: ['@babel/preset-env', '@babel/preset-flow', '@babel/preset-react'],
  plugins: [
    ['@babel/plugin-transform-for-of', { assumeArray: true }],
    '@babel/plugin-transform-runtime'
  ],
  cacheDirectory: true
}

module.exports = {
  devtool: 'source-map',
  entry: './src/react-native.js',
  externals,
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader', options: babelOptions }
      }
    ]
  },
  output: {
    filename: packageJson['react-native'],
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname)
  }
}
