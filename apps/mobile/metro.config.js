// Metro para monorepo pnpm. Sin esto, Metro no resuelve `@agente/shared` ni las
// dependencias hoisteadas a la raíz del workspace (pnpm usa enlaces simbólicos).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Vigilar todo el monorepo (para ver cambios en packages/*).
config.watchFolders = [workspaceRoot];

// 2. Resolver módulos primero en la app y luego en la raíz del workspace.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Con `node-linker=hoisted` (ver `.npmrc` y ADR-013) las dependencias quedan planas
//    en la raíz del workspace; desactivar la búsqueda jerárquica evita sorpresas.
config.resolver.disableHierarchicalLookup = true;

// 4. `@agente/shared` se consume como código fuente TypeScript (su `main` apunta a
//    `src/index.ts`) y está escrito en estilo ESM con extensión explícita (`./enums.js`).
//    Metro no reescribe `.js` → `.ts`, así que resolvemos aquí: intentamos la ruta tal
//    cual y, si no existe (caso del fuente TS del workspace), reintentamos sin extensión,
//    que Metro sí mapea al `.ts`. Acotado a imports relativos `.js` para no tocar nada más.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  const esImportRelativoJs =
    (moduleName.startsWith('./') || moduleName.startsWith('../')) && moduleName.endsWith('.js');
  if (esImportRelativoJs) {
    try {
      return resolve(context, moduleName, platform);
    } catch {
      return resolve(context, moduleName.slice(0, -'.js'.length), platform);
    }
  }
  return resolve(context, moduleName, platform);
};

// 5. El paquete de contenido viaja como asset binario (Fase 1, sin CDN). Metro ya trata `db`
//    como asset; añadimos `sqlite` para poder empaquetar también ficheros con esa extensión.
for (const ext of ['db', 'sqlite']) {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
}

module.exports = config;
