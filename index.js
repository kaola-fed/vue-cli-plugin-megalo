const path = require('path');
const _ = require('./util');
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' )
const cliServicePath = path.dirname(require.resolve('@vue/cli-service'))

module.exports = (api, options) => {
  api.chainWebpack(webpackConfig => {
    webpackConfig
      .output
        .filename('static/js/[name].js')
        .chunkFilename('static/js/[id].js')
        .end()

      .resolve.alias
        .set('vue$', 'megalo')
        .set('@', _.resolve('src'))
        .end();

    webpackConfig
      .optimization 
        .splitChunks({
          cacheGroups: {
            commons: {
              test: /[\\/]node_modules[\\/]|megalo[\\/]/,
              name: 'vendor',
              chunks: 'all'
            }
          }
        });


    webpackConfig.plugins.delete('hmr');

    webpackConfig.module
      .rule('vue')
        .test(/\.vue$/)
        .use('vue-loader')
          .loader('vue-loader')
          .options({
          })


    webpackConfig
      .plugin('extract-css')
      .tap(args => {
        console.log(args)
        return [{
          chunkFilename: `./static/css/[name].wxss`,
          filename: `./static/css/[name].wxss`,
        }];
      })
       
  })

  api.chainWebpack(webpackConfig => {
    webpackConfig.resolveLoader.modules.prepend(path.join(__dirname, 'node_modules'))

    const jsRule = webpackConfig.module
      .rule('js')
        .test(/\.jsx?$/)
        .exclude
          .add(filepath => {
            // always transpile js in vue files
            if (/\.vue\.jsx?$/.test(filepath)) {
              return false
            }
            // exclude dynamic entries from cli-service
            if (filepath.startsWith(cliServicePath)) {
              return true
            }
            // check if this is something the user explicitly wants to transpile
            if (options.transpileDependencies.some(dep => {
              if (typeof dep === 'string') {
                return filepath.includes(path.normalize(dep))
              } else {
                return filepath.match(dep)
              }
            })) {
              return false
            }
            // Don't transpile node_modules
            return /node_modules/.test(filepath)
          })
          .end()
        // .use('cache-loader')
        //   .loader('cache-loader')
        //   .options(api.genCacheConfig('babel-loader', {
        //     '@babel/core': require('@babel/core/package.json').version,
        //     '@vue/babel-preset-app': require('@vue/babel-preset-app/package.json').version,
        //     'babel-loader': require('babel-loader/package.json').version,
        //     modern: !!process.env.VUE_CLI_MODERN_BUILD,
        //     browserslist: api.service.pkg.browserslist
        //   }, [
        //     'babel.config.js',
        //     '.browserslistrc'
        //   ]))
        //   .end()

    jsRule
      .use('babel-loader')
        .loader('babel-loader')
  })

  api.configureWebpack(webpackConfig => {
    // 修改 webpack 配置
    // 或返回通过 webpack-merge 合并的配置对象
    console.log(webpackConfig.entry)
  })

  // api.registerCommand('test', args => {
  //   // 注册 `vue-cli-service test`
  // })
}