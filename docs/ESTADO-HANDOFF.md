# Estado y traspaso (handoff) — léeme al abrir una sesión nueva

Este documento permite que una sesión de Claude **nueva** (p. ej. tras cambiar de usuario de
Windows o de máquina) continúe el trabajo sin perder contexto. Complementa a
[`docs/paridad-spplb.md`](./paridad-spplb.md) (hoja de ruta) y a `docs/ESPECIFICACION.md` (verdad del producto).

Última actualización: 2026-09-09. Repo: https://github.com/Sausf93/Agente (rama `main`).

## Cómo retomar en una máquina/usuario nuevos
1. `git clone https://github.com/Sausf93/Agente.git` (idealmente en `…/Documents/Saulo/repos/Agente`).
2. `corepack pnpm install`.
3. Copiar del usuario viejo (están FUERA de git, son secretos): la carpeta `_deploy/`
   (`_deploy/expo_token.txt` = token de Expo para publicar; `_deploy/beta-acceso.txt` = correo del socio).
   Si no se puede, regenerar el token en expo.dev y volver a crear `_deploy/expo_token.txt`.
4. (Opcional, para el historial literal de la conversación) copiar `C:\Users\<viejo>\.claude\`
   al `.claude` del usuario nuevo; con `claude --resume` en la misma ruta reaparece la conversación.
5. Puerta de calidad antes de tocar nada: `corepack pnpm lint`, `corepack pnpm -r typecheck` (3 Done),
   `corepack pnpm -r test` (verde).

### Carpeta compartida entre usuarios del mismo PC (opcional)
`C:\Users\Public\Agente` es legible/escribible por todos los usuarios del PC (incluidos los NO admin).
Sirve para que dos usuarios de Windows compartan la MISMA carpeta sin re-clonar. Aviso: `_deploy/`
(token de Expo) puesto en Public lo puede leer cualquier usuario del PC. GitHub sigue siendo el respaldo.

### MCPs y equipo (qué viaja y qué hay que instalar)
Viajan con el repo (en Git): `.mcp.json` (engram, playwright, graphify) y `.claude/` (8 agentes + 3 skills).
Al abrir el proyecto, Claude Code pregunta si habilitar los MCPs del proyecto → aceptar.
- **playwright**: se autoinstala (npx), no requiere nada.
- **engram** (memoria): el comando `engram` debe estar instalado en el usuario nuevo y con su cuenta/proyecto
  `Agente`. Si no está, Claude avisa "engram no cargado" y se sigue igual (la memoria fiable está en
  `docs/` y en Git). Instalar/loguear engram solo si se quiere la memoria persistente entre sesiones.
- **graphify** (`graphify-mcp`): binario aparte + un `graphify-out/graph.json`. Opcional; no se usa en el
  ciclo normal de trabajo.
- Reiniciar Claude Code tras habilitar MCPs (los tools se cargan al arrancar).
NINGÚN MCP es imprescindible para: construir contenido, pasar la puerta, commitear, pushear y publicar en Expo.

### La CONVERSACIÓN literal (chat) — solo si se quiere conservar el historial
Vive en el perfil de Windows viejo: copiar `C:\Users\<viejo>\.claude\` → `C:\Users\<nuevo>\.claude\`.
Con la misma ruta del proyecto, `claude --resume` reabre la conversación. Si no, una sesión nueva
retoma leyendo este documento (no se pierde el hilo del trabajo, solo el texto del chat anterior).

## Qué es esto (resumen de 10 s)
App móvil (Expo SDK 57 + RN + TS, monorepo pnpm) de suscripción para las FCSE (GC, PN, local,
autonómica) que sustituye a SPPLB: normativa offline, buscador de calle, ficha con consecuencia
primero, detención orientativa, derechos multilingües con audio, cuadrante, plantillas PDF.
Se distribuye en **Expo preview (canal `preview`)**; el socio (GC Tráfico, iPhone) probará en TestFlight.

## Publicar un update (tras commitear)
```
cd apps/mobile
EXPO_TOKEN="$(cat ../../_deploy/expo_token.txt)" npx --yes eas-cli@latest update \
  --branch preview --environment preview --non-interactive --message "<mensaje en una línea>"
```
Cuenta Expo `sausf93` · projectId 92c01f68-bf32-494e-8a73-0b5489620845 · runtime `exposdk:57.0.0`.

## Reglas de trabajo aprendidas (importantes)
- **Un solo agente de ESCRITURA a la vez** (los worktrees NO aíslan; agentes escriben en el árbol
  principal). Los de solo lectura (validador-calle, qa-testing, revisor, diseño) sí en paralelo.
- Ciclo por ronda: agente escribe (sin commitear) → **puerta** (lint / `-r typecheck` 3 Done / `-r test`)
  → si es contenido legal NUEVO, **revisor-juridico** → commit (Co-Authored-By: Claude Opus 4.8) →
  `git push origin main` → EAS update. **El usuario quiere TODO en `main` (push) y publicado.**
- Contenido siempre `pendiente_revision`; detención en lenguaje orientativo; nada de datos de terceros
  al servidor; sin escudos/insignias oficiales.
- `SendMessage` a subagentes está deshabilitado: no se puede inyectar a un agente en vuelo → serializar.

## Estado del producto (2026-09-09)
- **Contenido**: 26 normas (articulado completo del BOE), **105 infracciones** (todas pendiente_revision),
  sustancias, 4 capas (estatal, autonómica Canarias, municipal SCTF). Tráfico = 10 leyes.
- **Herramientas**: buscador FTS, Normas **por materia** (materia→ley→artículo), ficha adaptativa
  (consecuencia primero, marco correcto, "Borrador beta"), Documentos **ágil** (genera el acta correcta:
  alcoholemia→acta de alcoholemia; inmoviliza/grúa→su acta), derechos 14 idiomas **+ audio (expo-speech)**,
  cuadrante (hoy resaltado, nocturnas por franja), feedback local con "reportar desde la ficha".
- **UX reciente**: sin teclado al abrir; gesto atrás izquierda→derecha (ficha y leyes en `card`).
- **Andamiaje TestFlight listo** (falta que el usuario pague Apple): bundle id neutro `es.modoagente.app`,
  icono V1 (agente estilizado, gorra lisa sin insignia), `eas.json` con perfiles.
- Suite verde: ~466 mobile · ~232 content-pipeline · ~199 shared.

## PENDIENTE INMEDIATO (empezar por aquí)
1. **Ola 2 de Transporte (commit 59321bd) AÚN NO ha pasado el revisor** y por eso NO se ha publicado en
   Expo. Acción: lanzar `revisor-juridico` sobre las 13 infracciones nuevas de transporte de
   `packages/content-pipeline/src/seed/traficoSeed.ts` (transporte público/privado sin título, viajeros
   VTC/taxi/plazas, escolar, ADR, perecederas ATP, obligaciones documentales, tacógrafo). Aplicar
   correcciones → puerta → commit → push → **publicar en Expo** (hasta ahora todas las olas se publican
   tras el revisor).
2. Seguir el plan de olas de [`docs/paridad-spplb.md`](./paridad-spplb.md): Ola 3 (Seguridad Ciudadana y
   Penal a fondo), Ola 4 (Armas RA, Extranjería, Animales). Acelerador: **derivador LSV→catálogo**
   (Anexo II puntos + Anexo IV velocidad + arts. 76-80) para volumen fiable de golpe.
3. Construir **"Explorar por temas"** (los submenús estilo SPPLB) cuando los sub-temas tengan densidad
   (regla anti-vacío: fusionar sub-temas flacos; "en ampliación" solo para allowlist). Spec de diseño ya
   acordada (materia→sub-tema→lista→ficha, acceso desde el estado vacío de Buscar, NO pestaña nueva).

## Pendiente del usuario (no lo puede hacer Claude)
- Pagar el Apple Developer Program (99 €) y, con el socio delante, montar el build de TestFlight
  (`eas build -p ios --profile production` + `eas submit`). Aplazado a la semana del 15-sep-2026.
- Invitar al socio al proyecto Expo/TestFlight. Revocar el EXPO_TOKEN al terminar la beta.
- Probar en el iPhone: que el audio de derechos suene por idioma, y el gesto/teclado de la última ronda.
- Antes de cobrar: visto bueno de abogado de marcas al nombre ("Agente" es provisional) y al icono.
