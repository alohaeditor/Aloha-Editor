const config = {
  plugins: [
    require('postcss-import'),
    require('postcss-url')({
      // Result is just the relative path without the leading '../'.
      url: (asset) => asset.relativePath
    }),
    require('autoprefixer'),
    require('cssnano')
  ]
}

module.exports = config
