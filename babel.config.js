/**
 * Reanimated needs its worklets Babel plugin to run at all. babel-preset-expo
 * adds it automatically once react-native-worklets is installed, and Metro
 * falls back to that preset when no config file exists — but "falls back"
 * is a bad thing to rely on the night before a demo. This states it outright.
 */
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
