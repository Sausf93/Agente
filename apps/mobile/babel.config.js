// Configuración de Babel para Expo. Metro la usa para transpilar el bundle.
// No se typechequea (JS): queda fuera del `include` de tsconfig.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
