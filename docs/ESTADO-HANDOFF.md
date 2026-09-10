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

### Identidades de git/GitHub en esta máquina (usuario `SaulodelaSantacruz`) — IMPORTANTE
El PC tiene DOS cuentas: la **personal** (dueña del repo, GitHub `Sausf93`, `saulodlsf@gmail.com`) y la del
**trabajo** (`Sausf1993` / capitole-consulting.com), que es la identidad global por defecto. Ya está resuelto
POR REPO en Agente (config local): commits como `Sausf93 <saulodlsf@gmail.com>` y el remote enruta el push a la
personal (`https://Sausf93@github.com/...` + `git config credential.username Sausf93`). Si tras clonar/reiniciar
`git push` da **403 (denied to Sausf1993)**: `gh auth login` con la cuenta personal, o borra la credencial
`git:https://github.com` en el Administrador de credenciales de Windows y reintenta. Claude NO introduce credenciales.

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
- **Contenido**: 26 normas (articulado completo del BOE), **104 infracciones** (todas pendiente_revision),
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

### YA HECHO el 2026-09-09 (tarde) — todo en `main` y publicado en Expo `preview`
- **Ola 2 de Transporte revisada y publicada** (commit `879d55e`): `revisor-juridico` + verificación BOE.
  5 horquillas ajustadas al subtramo del art. 143 LOTT; **visado→leve** (142.1, 301–400 €); **exceso de
  viajeros** con aviso de escalada a muy grave (140.26); **exceso de dimensiones RETIRADO** (no es LOTT,
  es tráfico RGV/LSV → reintroducir como ficha de TRÁFICO en una ola futura). Paquete: 105 → **104 infracciones**.
- **3 rondas de UX** (commits `81f7a2f`, `9bbbbed`, `c790dc7`), a partir de una evaluación simulada de 4
  agentes (Local/GC/PN + diseño). Publicadas:
  1. Franja "Solicitar normativa/ordenanza": **gateada por cuerpo** (GC/PN ya no la ven) + **sin Share/mailto
     a terceros** (registro local honesto, estado "en lista de espera"). `apps/mobile/src/features/normas/normasUi.tsx`.
  2. El detalle de materia muestra las **fichas de calle**, no solo leyes (Seguridad Ciudadana dejaba de
     parecer vacía). `listarInfraccionesDeMateria` + `MateriaDetalleScreen.tsx`.
  3. La tarjeta del índice muestra **"N normas · M fichas"**. `contarInfraccionesPorMateria` + `MateriasScreen.tsx`.

### YA HECHO en el run autónomo (2026-09-09, tras reinicio) — commit + push + Expo, contenido con revisor
- **UX Ajustes** (`70d07fb`): el municipio ya no se pierde al volver atrás (input controlado).
- **Ola A · Buscador** (`a92a2b7`): +11 sinónimos de calle a fichas existentes (ADR por clase, erratas
  alcolemia/patinet/estacionamento, mani/concentracion). Sin revisor (no es dato legal, solo búsqueda).
- **Ola B · Penal** (`443b287`): ficha `del-lesiones-agravadas` (art. 148 CP), pasada por `revisor-juridico`
  y corregida (faltaba "o alevosía" en 148.2º; 148.4º es "esposa o mujer…"; "física o psíquica"; "navajazo"
  en 147 y 148 porque el 148 es potestativo).
- **Ola C · Extranjería** (`60037e7`): ficha `ext-trabajo-sin-autorizacion` (art. 53.1.b LOEX), revisada
  (canal Inspección de Trabajo art. 55.2; la carga sancionadora fuerte recae en el empleador 54.1.d).
- **Ola D · Tráfico penal**: ficha `del-abandono-accidente` (art. 382 bis CP), revisada (penas confirmadas
  exactas; corregida la remisión de la lesión a los arts. 147.1/149/150 —no al 152.2— tras la LO 11/2022).
- **Ola E · Penal**: fichas `del-coacciones` (art. 172 CP) y `del-receptacion` (art. 298 CP), revisadas
  (en receptación se corrigió la agravante del 298.2 —traficar/establecimiento, no "valor de los efectos"—
  y el límite del 298.3; se quitó el sinónimo duplicado 'coaccion' de `del-amenazas`).
- **Ola F · Penal**: ficha `del-detencion-ilegal` (art. 163 CP), revisada (penas base OK; se corrigió que
  la simulación de autoridad es el art. 165 —mitad superior—, no el 163.3, y el tipo atenuado del 163.4
  es multa de 3-6 meses).
- **Ola G · Penal**: ficha `del-maltrato-animal` (art. **340 bis** CP). El revisor cazó que la LO 3/2023
  SUPRIMIÓ el art. 337 (mi ancla inicial) y trasladó el maltrato al Título XVI bis (340 bis maltrato /
  340 ter abandono); recolocada, con marco atenuado para vertebrados no domésticos, y re-verificada APTA.
- **NOTA DE MÉTODO (importante)**: varias "carencias" que reportaron los agentes NO eran reales —
  `del-estafa`, `del-falsedad-documental`, la reunión (LOSC), el botellón y "PN arranca con filtro" YA
  existían—. VERIFICAR siempre contra el seed antes de crear una ficha; los informes de los agentes
  EXAGERAN los huecos. Aparcamiento desglosado se DESCARTA a propósito (sus importes son municipales;
  la ficha genérica ya prefiere "sin resultado → solicita tu ordenanza" antes que un importe falso).
- Paquete: **111 infracciones** (104 base + Lesiones agravadas 148 + Extranjería 53.1.b + Abandono 382 bis
  + Coacciones 172 + Receptación 298 + Detención ilegal 163 + Maltrato animal 340 bis).

### BACKLOG priorizado de la evaluación de calle (4 agentes) — SIGUIENTE
Para el CONTENIDO nuevo: `nueva-infraccion` + `revisor-juridico` (NO publicar sin revisor).
- **Contenido (mayor retorno):**
  - **Aparcamiento desglosado** (Local, ~40% de su turno): zona azul, doble fila, vado, PMR, acera, paso de
    peatones, carga/descarga — cada una con su decisión de grúa. Hoy solo `inf-estacionamiento-indebido`.
  - **Armas (RA)** y **Extranjería (LOEX)**: hoy solo articulado, sin fichas de infracción propias (GC/PN).
  - **Penal que falta** (PN): Falsedad documental (390-399), Estafa/uso fraudulento de tarjeta (248/249),
    Lesiones agravadas (148); hoy sus sinónimos apuntan a vacío.
  - **Sinónimos de calle**: los 4 agentes dieron listas (aparcamiento; armas por clase/nº ONU; ROTT; etc.).
  - **Reintroducir exceso de dimensiones** como ficha de TRÁFICO (RGV/LSV), sacada de la Ola 2.
- **Features:** **Mapa + Punto Kilométrico offline** con volcado al atestado (GC Tráfico: razón nº1-2 para
  pagar). Alcoholemia guiada en una pantalla. Documentos de PN (acta 520 LECrim, diligencia de detención).
  Búsqueda por voz.
- **UX P1 (diseño):** selector de municipio (no texto libre), toasts con deshacer en vez de `Alert`,
  municipio controlado en Ajustes, "mi ordenanza personal" editable en el dispositivo (Local).
- Los informes completos de los 4 agentes viven en el transcript de la conversación (`.claude`).

### Seguir el plan de olas
[`docs/paridad-spplb.md`](./paridad-spplb.md): Ola 3 (Seguridad Ciudadana y Penal a fondo), Ola 4 (Armas RA,
Extranjería, Animales). Acelerador: **derivador LSV→catálogo** (Anexo II puntos + Anexo IV velocidad +
arts. 76-80). **"Explorar por temas"** (submenús estilo SPPLB) cuando los sub-temas tengan densidad
(regla anti-vacío: fusionar sub-temas flacos; "en ampliación" solo para allowlist).

## Pendiente del usuario (no lo puede hacer Claude)
- Pagar el Apple Developer Program (99 €) y, con el socio delante, montar el build de TestFlight
  (`eas build -p ios --profile production` + `eas submit`). Aplazado a la semana del 15-sep-2026.
- Invitar al socio al proyecto Expo/TestFlight. Revocar el EXPO_TOKEN al terminar la beta.
- Probar en el iPhone: que el audio de derechos suene por idioma, y el gesto/teclado de la última ronda.
- Antes de cobrar: visto bueno de abogado de marcas al nombre ("Agente" es provisional) y al icono.
