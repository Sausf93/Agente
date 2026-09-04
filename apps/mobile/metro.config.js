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

// 3. pnpm no aplana el árbol: desactivar la búsqueda jerárquica evita sorpresas.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
