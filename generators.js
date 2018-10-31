 module.exports = api => {
  delete api.generator.files['babel.config.js']
  delete api.generator.files['.browserslistrc.js']
};
