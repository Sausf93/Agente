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
- **Herramientas de USO EN DIRECTO** (principio del fundador: usable y dinámico para consultar en plena
  intervención, piel del agente): **Guía de alcoholemia** (`/guia-alcoholemia`, tasas + frontera penal +
  procedimiento, revisada) y **Control de carretera** (`/control-carretera`, commit `428aa06`: checklist
  INTERACTIVO de un toque —conductor/documentación/vehículo/transporte—, marcable y con enlace a cada
  ficha/guía; estado efímero). Ambas desde los accesos rápidos de Tráfico. Aplicar esta lente a todo.
- **Submenús por sub-tema estilo SPPLB** (commit `ca508a2`): en Tráfico (9 sub-temas), Penal (4) y Seguridad
  Ciudadana (3) el detalle de materia muestra un submenú (materia → sub-tema → ficha); resto planas. Mapa
  interino en el móvil (`SUBTEMA_POR_INFRACCION` en `normas.ts`), `agruparPorSubtema` con anti-vacío, nueva
  ruta `/normas/subtema/[materia]/[subtema]`. Solo app, sin tocar contenido. 471 tests mobile.
- **Ola H · Buscador/claridad**: `validador-calle` sobre las 7 fichas nuevas → +~50 sinónimos de calle
  (986 en total), desambiguación visible Coacciones (172)↔Detención ilegal (163), y el 163.4 (detención
  ciudadana del flagrante) subido al texto visible. Sin dato legal nuevo.
- **Ola I · Penal (consecuencias operativas)** (commit `022bbe1`, revisada APTO): del validador — la acción
  física que faltaba: intervención del ARMA (arts. 334/338 LECrim + 127 CP) en `del-lesiones-agravadas`; y
  retirada/incautación cautelar del ANIMAL (art. 340 quinquies CP) en `del-maltrato-animal`.
- **Decisión de producto pendiente** (no urgente): el sufijo "A verificar" es visible en `penaTexto` de TODAS
  las fichas (convención pendiente_revision + "Borrador beta"); valorar moverlo a un flag interno de UI.
- **NOTA DE MÉTODO (importante)**: varias "carencias" que reportaron los agentes NO eran reales —
  `del-estafa`, `del-falsedad-documental`, la reunión (LOSC), el botellón y "PN arranca con filtro" YA
  existían—. VERIFICAR siempre contra el seed antes de crear una ficha; los informes de los agentes
  EXAGERAN los huecos. Aparcamiento desglosado se DESCARTA a propósito (sus importes son municipales;
  la ficha genérica ya prefiere "sin resultado → solicita tu ordenanza" antes que un importe falso).
- Paquete: **175 infracciones, 29 normas, ~1523 sinónimos** (sprints 2026-09-10 y 2026-09-11).
- **SPRINT 2026-09-11: motor de detención + más contenido.** Mismo flujo (ingesta → revisor → build → Expo):
  1. **Motor de detención — flag `penaSoloMulta`** (commit `439d34c`, publicado): un delito de solo multa
     (art. 457) ya NO sobre-orienta a detener; rama de proporcionalidad (art. 492), tests en shared.
     Reintroducida `del-simulacion-delito` (457).
  2. **Marco `bienestar_animal`** en shared (commit `24a9a24`): tramos del art. 80 Ley 7/2023 (prep ola
     Animales; los de PPP `animales` no encajaban).
  3. **Ola de Extranjería** (8 fichas, commit `e475a77`, publicada, revisor APTO): empleador 54.1.d,
     autorización caducada 52.b, no portar documentación (art. 4, consultable), regreso tras expulsión
     58.3.a (consultable), salida por puesto no habilitado 53.1.g, no comunicar cambios 52.a; + penales
     favorecimiento 318 bis y trata 177 bis. Revisor corrigió: cláusula humanitaria = 318 bis.1 (no .6);
     regreso tras expulsión = 58.3.a (no .b); salida = 53.1.g; y que el 311 bis NO está derogado (mi claim
     previo era erróneo → "a verificar").
  4. **2ª ola de Tráfico** (12 fichas, commit `82af865`, **pendiente de revisor** al escribir esto):
     aparcamiento desglosado (doble fila, paso de peatones, vado, PMR, carga y descarga) + chaleco/V16,
     túnel, libertad de movimientos, animal suelto, remolque, puertas, no obedecer al agente. **SIGUIENTE
     PASO: aplicar veredicto del revisor de tráfico r2 y publicar.**
- **EN COLA (borrador de ingesta listo, sin escribir aún): ola de ANIMALES** — PPP (Ley 50/1999, marco
  `animales`) + bienestar animal (Ley 7/2023, marco `bienestar_animal` ya creado; deslinde penal 340 bis/
  340 ter). Escribir tras publicar tráfico r2.
- **SPRINT 2026-09-10 (tarde): +44 fichas en 6 olas** para llegar a pseudo-producción el lunes (petición del
  fundador: "ser mejores que SPPLB, no tener menos"). Cada ola: ingesta-normativa (borrador verificado) →
  revisor-juridico (gate; cazó errores reales en TODAS) → validador-calle (simulación 3 cuerpos) → build →
  tests → commit → Expo. Olas:
  1. **Armas** (7, commit `bc3021a`, publicada): régimen LO 4/2015, sección "Armas" encendida vía
     `MATERIA_OVERRIDE_POR_INFRACCION` (patrón nuevo, ver abajo).
  2. **Tráfico** (10, commit `3894f5f`, publicada): sentido contrario, línea continua, adelantar a ciclista
     sin 1,5 m, carril bus/bici, arrojar objetos, detector de radar, exceso de ocupantes… El revisor cazó
     que la colilla con riesgo de incendio es MUY GRAVE/6 puntos (no grave/4) y que en turismo no hay tramo
     muy grave de ocupantes.
  3. **Delitos violentos y libertad sexual** (8, commit `3894f5f`, publicada): homicidio 138, asesinato 139,
     agresión sexual 178-180, agresión sexual a menor 181, trato degradante 173.1, torturas 174, acoso 172
     ter, revelación de secretos/difusión de imágenes 197. Revisor: la violación (179) tiene 2 tramos tras
     la LO 4/2023 (179.1 4-12; 179.2 6-12) y agresión sexual se modela GRAVE (no menos_grave) para no
     infra-orientar la detención; añadido el fin de "castigo" a torturas. Validador: sinónimos de AVISO
     ("hay un muerto", "una violación") + protocolo de ESCENA en homicidio/asesinato + pasos operativos en
     agresión sexual (no lavarse, no reiterar declaración, UFAM).
  4. **Ordenanzas SCTF / Canarias** (10, commit `7c10a8e`, publicada): convivencia/limpieza/playas/venta
     ambulante (orinar, pintadas, enseres, contenedores, vertidos, fumar/residuos en playa; botellón,
     acampada montes y top manta como consultables). 3 ordenanzas nuevas (residuos, policía y buen gobierno,
     venta). Es lo que desbloquea VENDER a policía local. Importes = techo del tramo (art. 52.2) donde
     confirmado; consultable donde la cuantía no es pública.
  5. **Frontera penal** (8, commit `29ebc97`, **publicada** tras revisor APTO): conducción con desprecio a
     la vida 381 (kamikaze penal), odio 510, grooming 183, pornografía infantil 189, exhibicionismo 185-186,
     sustracción de menores 225 bis, allanamiento de local 203, usurpación/falso policía 402-403. El revisor
     completó penas (multa del 381.2 y 510.2), corrigió la protección de 225 bis a medida civil (158 CC) y
     **retiró `del-simulacion-delito` (457)**: ver pendiente del motor abajo.
- **PENDIENTE DEL MOTOR DE DETENCIÓN (bloquea reintroducir el 457 y otros delitos de solo multa):** el motor
  (`packages/shared/src/detencion.ts` + `escenarioBaseDetencion`/`reglaDetencion`) solo aplica la
  excepcionalidad (proporcionalidad, art. 492/495 LECrim) cuando `gravedadCp === 'leve'`. Un delito
  MENOS GRAVE con pena ÚNICA DE MULTA (p. ej. denuncia falsa art. 457) cae en la rama "procede detención",
  que SOBRE-ORIENTA a detener (línea roja de CLAUDE.md). Arreglo: añadir un flag `penaSoloMulta` a
  `EntradaDetencion`/`DelitoSeedInput` y enrutar esos casos, aun en flagrancia, por una rama de
  proporcionalidad ("no procede salvo falta de identificación/garantías"). NO rebajar `gravedadCp` a 'leve'
  (falsearía el chip del marco penal). Con el flag, reintroducir `del-simulacion-delito` (457) y revisar
  otros delitos de solo multa. El artículo 457 ya está en el articulado (consultable, sin ficha).
- **Ola de ARMAS** (2026-09-10, commit `bc3021a`): enciende la sección "Armas" de SPPLB, que teníamos casi
  vacía. 7 fichas del régimen de armas reglamentadas (sin licencia/guía, licencia caducada, portar fuera de
  supuestos, transporte indebido, fogueo/aire/réplica, custodia, documentación perdida). Punto jurídico clave
  (revisor + ingesta): la LO 1/1992 está DEROGADA → las infracciones administrativas de armas se tipifican
  hoy en la **LO 4/2015** (arts. 36.10/36.12/37.8, muy grave 35.2, cuantías art. 39); el RD 137/1993 queda
  como obligación material (números "a verificar"). Frontera penal por ficha (564/563/566-568 CP). Revisor
  cazó y se corrigió: el 37.8 cubre solo la DOCUMENTACIÓN (no el arma), el 565 CP es "falta de intención" (no
  de aptitud), y el comiso cita el 39.2. **Patrón nuevo reutilizable**: `MATERIA_OVERRIDE_POR_INFRACCION` en
  `normas.ts` (móvil, interino como `SUBTEMA_POR_INFRACCION`) reasigna fichas a una materia distinta de la de
  su norma para la navegación —las de armas citan la LOSC (fuente honesta) pero se muestran en "Armas"— sin
  tocar el content-pipeline. Úsalo para futuras secciones que crucen norma↔materia.
- **Guía de identificación y cacheo** (2026-09-10, commit `25aae0a`, `/guia-identificacion`): referencia
  ESCANEABLE de uso en directo (LOPSC 16/20/36.6 + escalón penal), accesible desde el acceso
  "Identificación" de PN, GC y seguridad ciudadana. Revisada con **3 pases de agentes**: revisor-juridico
  (APTO; confirmó 6h del 16.2 y 36.6 literal, corrigió cita del cacheo a 20.2, sacó el 20 del chip de
  vehículo/domicilio, ancló la detención a la LECrim 490/492 y separó resistencia no violenta 556 CP del
  atentado 550-551 CP) + validador-calle (reordenó negativa tras identificación, desdobló "no lleva DNI"
  atípico de "se niega" grave, subió el resaltado del cacheo a mismo sexo/lugar reservado). Lenguaje
  orientativo en la detención; fecha de actualización visible.
- **Sinónimos de calle** de ese clúster (2026-09-10, commit `86fc3c4`, 1005 sinónimos): identificación
  (papeles, filiar, indocumentado, reseñar…), negativa (no colabora, se puso chulo, se encaró…) y cacheo
  (cachear, palpar, vaciar los bolsillos, camper habitada…), propuestos por validador-calle, con tests de
  regresión. Sin dato legal nuevo. Deseables de la siguiente ola sobre la guía: menores (&lt;14 inimputable,
  LO 5/2000), extranjeros (irregular ≠ delito), uso de fuerza proporcional (art. 5 LO 2/1986), grabar/ser
  grabado — requieren su propio pase de revisor-juridico.

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
  pagar) — sigue pendiente (necesita datos de carreteras, no están en el paquete). ~~Alcoholemia guiada~~
  **HECHA** (commit `30467e3`: `/guia-alcoholemia`, tasas + frontera penal + procedimiento, revisada; el
  revisor cazó y se corrigió que el coste del análisis de sangre estaba invertido). **Guía de
  identificación y cacheo HECHA** (`/guia-identificacion`, LOSC 16/20/36.6 + 556 CP): revisada por
  revisor-juridico (APTO) y estresada por validador-calle. Deseables de la siguiente ola sobre esta
  guía (validador): punto/enlace de **menores** (inimputable &lt;14, LO 5/2000), **extranjeros**
  (documentos válidos + "irregular ≠ delito", vía LOEX no penal), **uso de fuerza proporcional**
  (art. 5 LO 2/1986) y nota de grabar/ser grabado; + **sinónimos de calle** para el buscador (papeles,
  filiar, no colabora, se puso chulo, cachear por encima, mirar el coche, camper habitada…). Pendientes:
  documentos de PN (acta 520 LECrim, diligencia de detención) y búsqueda por voz.
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
