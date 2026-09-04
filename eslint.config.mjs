// @ts-check
/**
 * Configuración ESLint única para todo el monorepo (flat config, ESLint 9).
 *
 * Filosofía (equipo de una persona): una sola configuración, sin duplicar por
 * paquete, centrada en CORRECCIÓN (no en estilo — de eso ya se encarga Prettier,
 * ver `.prettierrc.json` + `eslint-config-prettier`). TypeScript estricto ya
 * cubre los tipos vía `typecheck`; ESLint añade la red de seguridad de bugs.
 *
 * Se ejecuta desde la raíz con `pnpm lint` (`eslint .`). Los bloques `files`
 * acotan reglas específicas (React Native en `apps/mobile`, CLIs, tests).
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  // 1. Ignorados globales (artefactos, generados, nativo de Expo, herramientas).
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.expo/**',
      '**/output/**',
      '**/coverage/**',
      '**/*.d.ts',
      'apps/mobile/babel.config.js',
      'apps/mobile/metro.config.js',
      'graphify-out/**',
      '.claude/**',
    ],
  },

  // 2. Base recomendada (JS + TypeScript sin type-checking: rápido y suficiente).
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Reglas comunes a todo el código TypeScript.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // TypeScript ya resuelve símbolos; `no-undef` da falsos positivos con tipos/globals.
      'no-undef': 'off',
      // `console` solo con intención explícita (los CLIs lo reactivan más abajo).
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },

  // 4. App móvil: reglas de hooks de React (los bugs reales de RN están aquí).
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // 5. CLIs y scripts: la salida por consola es su interfaz, se permite.
  {
    files: ['**/cli/**', '**/*.config.{js,mjs,ts}'],
    rules: {
      'no-console': 'off',
    },
  },

  // 6. Prettier al final: desactiva cualquier regla de formato que choque.
  prettier,
);
