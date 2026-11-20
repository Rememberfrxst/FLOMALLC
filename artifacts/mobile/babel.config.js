const path = require('path');

module.exports = function (api) {
  api.cache(true);
  const expoDir = path.dirname(require.resolve('expo/package.json'));
  const presetExpo = require.resolve('babel-preset-expo', {
    paths: [__dirname, expoDir],
  });
  return {
    presets: [[presetExpo, { unstable_transformImportMeta: true }]],
  };
};
