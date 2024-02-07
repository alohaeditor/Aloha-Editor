const config = {
  plugins: [
    require('postcss-import'),
    require('postcss-plugin-namespace')('.aloha', {
      /** We want to prefix all `.ui-` styles, as they are from jquery ui */
      ignore: /^\.(?!ui-)/,
    }),
    require('postcss-url')({
      // Result is just the relative path without the leading '../'.
      url: (asset) => asset.relativePath
    }),
    require('postcss-combine-duplicated-selectors')({
      removeDuplicatedProperties: true,
    }),
    require('autoprefixer'),
    require('cssnano')
  ]
}

module.exports = config
