// Configuración de Babel para Expo. Metro la usa para transpilar el bundle.
// No se typechequea (JS): queda fuera del `include` de tsconfig.
//
// El plugin de worklets (react-native-worklets/plugin) es OBLIGATORIO para
// react-native-reanimated v4 (compila las funciones a worklets del hilo de UI).
// DEBE ir el ÚLTIMO de la lista de plugins. Va bundleado en Expo Go (SDK 57).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
