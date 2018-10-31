const createMegaloTarget = require('@megalo/target');
const compiler = require('@megalo/template-compiler');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const cliServicePath = path.dirname(require.resolve('@vue/cli-service'))
const octoparsePath = path.dirname(require.resolve('octoparse'))
const WriteFileWebpackPlugin = require('write-file-webpack-plugin');

module.exports = (api, options) => {
  const megaloPluginOptions = options.pluginOptions.megalo;
  const isProduction = process.env.NODE_ENV !== 'production';
  const { platform, useVhtml } = megaloPluginOptions;

  api.chainWebpack(webpackConfig => {
    console.log(`[vue-cli-plugin-megalo]: building platform ${platform}`)
    const targetOptions = {
      compiler,
      platform
    };

    if (useVhtml) {
      console.log('[vue-cli-plugin-megalo]: using vhtml')
      Object.assign(targetOptions, {
        htmlParse: {
          templateName: 'octoParse',
          src: `${octoparsePath}/lib/platform/${platform}`
        }
      })
    }

    webpackConfig.target(
      createMegaloTarget(targetOptions)
    )

    webpackConfig
      .output
        .filename('static/js/[name].js')
        .chunkFilename('static/js/[id].js')
        .end()

      .resolve.alias
        .set('vue$', 'megalo')
        .end();

    webpackConfig
      .devtool(false)
      .watch(!isProduction);

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


    webpackConfig
      .plugins
        .delete('hmr')
        .delete('no-emit-on-errors')
        .delete('preload')
        .delete('prefetch')
        .delete('html');

    webpackConfig.module
      .rule('vue')
        .test(/\.vue$/)
        .use('vue-loader')
          .loader('vue-loader')
          .options({});

    webpackConfig
      .plugin('extract-css')
        .tap(args => {
          return [{
            chunkFilename: `./static/css/[name].wxss`,
            filename: `./static/css/[name].wxss`,
          }];
        })
        .end()
      .plugin('wrtie-file')
        .use(WriteFileWebpackPlugin)
       
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
    //     .use('cache-loader')
    //       .loader('cache-loader')
    //       .options(api.genCacheConfig('babel-loader', {
    //         '@babel/core': require('@babel/core/package.json').version,
    //         '@vue/babel-preset-app': require('@vue/babel-preset-app/package.json').version,
    //         'babel-loader': require('babel-loader/package.json').version,
    //         modern: !!process.env.VUE_CLI_MODERN_BUILD,
    //         browserslist: api.service.pkg.browserslist
    //       }, [
    //         'babel.config.js',
    //         '.browserslistrc'
    //       ]))
    //       .end()

    jsRule
      .use('babel-loader')
        .loader('babel-loader')
  })

  api.registerCommand('dev', {
    description: 'build for dev',
    usage: 'vue-cli-service build [options] [entry|pattern]',
    options: {
      '--watch': `watch for changes`
    }
  }, async (args) => {
    const webpack = require('webpack')
    const webpackConfig = api.resolveWebpackConfig()
    webpackConfig.watch = true
    await build();

    async function build() {
      return new Promise( (resolve, reject ) => {
        webpack(webpackConfig, ( err, stats ) => {
          if (err) {
            return reject( err )
          }

          if (stats.hasErrors()) {
            return reject('build error')
          }

          resolve();
        } )
      } )
    }
  } )
}
