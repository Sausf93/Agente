# QA integral pre-beta — Agente

> Pasada de calidad sobre `main` (rama limpia). Solo lectura del código de features + este informe.
> Fecha: 2026-09-07. Autor: qa-testing. Alcance: ¿qué falta para estar "cerca del producto final"
> y poder pasárselo al cofundador agente (GC Tráfico) para probar de verdad?

## Veredicto

**CASI.** La app que existe (las 5 pestañas) tiene una calidad notable: puerta de calidad en verde,
integridad de contenido impecable, y las reglas no negociables (privacidad de datos de tercero,
lenguaje orientativo en detención, sin escudos oficiales, offline) se cumplen en el código. **No
hay ningún bloqueante técnico grave.** Lo que separa el estado actual del listón "cerca del producto
final" es sobre todo (a) que TODO el contenido está `pendiente_revision` —el cofundador no debe
fiarse aún de un importe o una consecuencia—, (b) piezas de producto que la planificación considera
parte del bucle central y aún no existen (mapa/PK, pagos, panel admin), y (c) un par de placeholders
que romperían la prueba (correo de feedback ficticio, enlaces de Vehículos vacíos).

Recomendación: **apto para una prueba guiada y acotada del cofundador** (buscador, ficha, cuadrante,
documentos, derechos) **en cuanto se cierren los 3 bloqueantes de abajo**; **no apto todavía** para
el listón "producto final" que fija `PLANIFICACION.md` (faltan fases 4 y 5 enteras).

---

## 1. Puerta de calidad (ejecutada)

| Comando | Resultado |
|---|---|
| `corepack pnpm lint` (ESLint 9, todo el workspace) | **OK, sin avisos** |
| `corepack pnpm -r typecheck` (tsc estricto × 3 proyectos) | **OK** (shared, content-pipeline, mobile) |
| `corepack pnpm -r test` | **480 pruebas verdes** |

Desglose de tests y cobertura de las zonas críticas:

- **packages/shared — 166** (10 archivos). Núcleos críticos: `cuadrante` **58**, `detencion` **20**,
  `sustancias` 8, `validators` 26, `plantillas` 11, `feedback` 12, `territorio`/`geografia`/`content`/`contentPackage`.
- **packages/content-pipeline — 89** (8 archivos): parser BOE-XML 18 + diff 3, seeds (tráfico 11,
  penal 11, seguridad ciudadana 20, sustancias 9), build del paquete SQLite 11, cliente BOE 6.
- **apps/mobile — 225** (24 archivos): buscador 7+7 (unit+integración FTS5 real) + resaltar 10,
  sustancias 24+5, normas 23+4, cuadrante serialize 9, documentos (html 14, plantillasSeed 11,
  iniciales 8, rutaPdf 3), ficha (detencion 5, format 7), derechos 15, userDb integración 7, etc.

Fragilidad: **ninguna prueba flaky observada**; corridas rápidas (<2 s por paquete) y deterministas
(los núcleos son funciones puras, sin reloj ni red). Los tres núcleos que CLAUDE.md exige testar
(buscador, motor de reglas, horas del cuadrante) tienen la cobertura más densa del repo. No se
encontró ningún test roto que arreglar.

**Aviso de alcance:** el runner reporta *"Scope: 3 of 4 workspace projects"*. El 4.º proyecto es
`apps/landing` (sin tests, correcto). **El panel `apps/admin` de Next.js que menciona CLAUDE.md /
Fase 0 NO existe todavía** (en `apps/` solo hay `landing` y `mobile`). Sin admin no hay CRUD de
contenido ni gate de publicación por UI; hoy el contenido se gestiona por los seeds del pipeline.

---

## 2. QA de contenido (paquete real `contenido-0.1.0.db`)

Consultado directamente el SQLite empaquetado. Volumen: **7 normas, 2.485 artículos, 29 infracciones,
16 consecuencias, 7 sustancias, 265 sinónimos.**

Integridad — **sin defectos**:

- Infracciones sin `articulo_id`: **0**. Sin `texto_boletin`: **0**. Con `<2` sinónimos: **0**.
- Importes fuera de `[0, 600.000]` o reducido > base: **0**. Administrativas sin importe: **0**.
- Puntos fuera de `[0, 8]`: **0**. `articulo_id` huérfano (apunta a artículo inexistente): **0**.
- Consecuencias sin `fuente`: **0**. Artículos con texto vacío: **0**.
- Estado editorial: **las 29 infracciones en `pendiente_revision`** (correcto: nada auto-publicado
  como verificado). Tipos: 24 administrativas + 5 penales.

Detalles verificados a mano:

- **16 artículos con texto muy corto** son todos marcadores legítimos `**(Derogado)**` / `**(Anulado)**`
  (CP y LECrim). No es un hueco de datos.
- **Consecuencias (16): 100 % lenguaje orientativo, 0 imperativo.** Todas con artículo fuente. Las 5
  de `detencion` llevan además el pie de responsabilidad ("la valoración de los indicios y del riesgo
  corresponde al agente y al juez") y su `regla` con el escenario base para rehidratar el árbol.
- **Sustancias:** umbrales coherentes y monótonos por potencia (cannabis 100 g de acopio … heroína 3 g,
  MDMA 2,4 g, anfetamina 0,9 g, metanfetamina 0,3 g), todas con fuente (INTCF + Acuerdo TS 19/10/2001).
- **Fuente + fecha:** el paquete trae `meta.fecha` y cada ficha/artículo/sustancia la muestra; las
  consecuencias e infracciones llevan artículo fuente. Cumple la regla de "fuente y fecha visibles".

Observación de producto (no defecto): **RGC, LSV y RGV NO incluyen `policia_nacional`** en su lista de
cuerpos. Un agente de PN con el filtro "solo mi cuerpo" no vería la normativa de tráfico. Es
defendible (PN no hace tráfico interurbano), pero conviene **validarlo como decisión explícita** antes
de abrir a PN. Para el cofundador (GC Tráfico) es indiferente.

---

## 3. QA de flujos (revisión de código de pantalla)

- **buscar → ficha → generar documento → compartir:** cableado correcto. La ficha pre-rellena el
  documento **solo con campos del agente** (norma, artículo, importe, hecho); el PDF se genera en el
  dispositivo (`expo-print`) y se comparte por la hoja nativa. Sin backend.
- **árbol de detención → orientación:** `DetencionTree` rehidrata la entrada desde la `regla` de la
  consecuencia y llama al motor puro `evaluarDetencion` en vivo; presentación color **+ texto** (nunca
  solo color). La lógica jurídica vive y se prueba en `@agente/shared`.
- **Cuadrante v3 (anclaje por días seguidos):** **converge** para los 4 patrones predefinidos y el
  botón "Empezar a usarlo" solo se habilita cuando queda **una** posición compatible. El caso
  "no encaja" (0 compatibles) se gestiona con aviso + "corregir último día" / "fue una excepción".
  No hay riesgo de bucle infinito. *Borde a vigilar:* patrones muy repetitivos (p. ej. oficina L–V)
  pueden exigir hasta ~L días de respuestas para desambiguar; converge, pero puede cansar. No bloquea.
- **Filtro de Normas por cuerpo:** perfil **sin cuerpo (`null`) → todas las normas** (arranque neutro);
  norma sin etiquetar → visible para todos (conservador). Parseo defensivo de la columna `cuerpos`.
- **Orientador de sustancias:** `parseCantidadG` rechaza `≤ 0` y no numéricos; `parsePurezaPct`
  rechaza fuera de `(0, 100]`. La reducción por pureza es una multiplicación: **no hay división por
  cero ni cantidades negativas** posibles. Muestra siempre el pie y avisa cuando calcula sobre bruto.

Casos borde de fecha/hora del cuadrante (medianoche, cruce de mes, franja nocturna que envuelve,
festivo trabajado, reparto de una noche entre dos días) están cubiertos por los 58 tests de `cuadrante`.

---

## 4. Cumplimiento de reglas no negociables

- **Datos de tercero fuera del dispositivo:** **cero llamadas de red** en `apps/mobile/src` (sin
  `fetch`/`axios`/`supabase`). Los campos de tercero van marcados `esDatoTercero`, se piden en sección
  aparte con aviso fijo, **nunca se pre-rellenan ni se memorizan** (`iniciales.ts`/`valoresRecordables`),
  y el PDF solo sale si el agente lo comparte desde su móvil. **Cumple.**
- **Lenguaje orientativo en detención:** verificado en contenido (0 imperativo) y en el motor
  (`evaluarDetencion` devuelve "procede valorar / puede proceder / no procede salvo" + pie). **Cumple.**
- **Sin escudos / denominaciones oficiales:** iconografía Lucide (metáforas), plantillas y HTML de
  PDF sobrios y neutros. *Nota menor:* el árbol de detención usa iconos genéricos `shield-*` de
  Lucide (escudo genérico, no emblema de ningún cuerpo). Es un icono de UI, no un símbolo oficial;
  conviene una confirmación rápida de diseño por lo sensible de la regla.
- **Funciona sin red:** el paquete de contenido viaja **empaquetado como asset** (no hay descarga);
  cuadrante, plantillas y derechos son locales. **Cumple.**

---

## 5. Lista priorizada de lo que falta

### Bloqueantes para pasárselo al cofundador a probar (pocos y acotados)

1. **Gate jurídico del contenido que va a tocar.** Las 29 infracciones + consecuencias + 7 sustancias
   están `pendiente_revision`. Antes de que el cofundador se fíe de un importe o de un "procede
   detención", el tráfico + penal + sustancias que probará deben pasar por `revisor-juridico` /
   skill `revisar-contenido`. (No impide "abrir la app"; impide "fiarse del dato" — que es el producto.)
2. **Correo de feedback real.** `FOUNDERS_EMAIL = 'beta@agente.app'` es un placeholder con `TODO`.
   El canal de feedback de la beta iría a una dirección inexistente. Confirmar dirección definitiva.
3. **Sección Vehículos con enlaces vacíos.** Marcada "Enlace pendiente" (TODO del cofundador). O se
   rellenan los enlaces o se oculta la sección para la prueba, para no enseñar una pantalla a medias.

### Deseables / camino a "producto final" (no bloquean la prueba, sí el lanzamiento)

- **Mapa offline + PK** (Fase 4): el bucle central de `PLANIFICACION.md` lo incluye (carretera/PK en
  la denuncia) y **aún no existe**. Es diferencial frente a SPPLB.
- **Firma Ed25519 + CDN + swap atómico desde red:** hoy es un **stub documentado** (`firma: null`) y
  el contenido va bundled. Verificación de firma en dispositivo pendiente. Bloqueante de **lanzamiento**,
  no de beta.
- **Pagos (Fase 5):** RevenueCat, paywall, freemium de 5 consultas/día, restaurar compras: no existen.
- **Panel admin (Next.js):** no creado; sin CRUD de contenido ni gate de publicación por UI.
- **Ficha de tienda / cumplimiento (Fase 5):** política de privacidad, borrado de datos accesible,
  icono y splash propios (`app.json` no define `icon`: usa el de Expo por defecto), textos de tienda.
- **Ordenanzas municipales:** razón de pago del policía local (perspectiva Local); no presentes.
- **Observabilidad:** sin Sentry / crash reporting.
- **e2e y admin:** no hay Maestro/Detox ni Playwright; el panel admin no tiene tests (no existe).

---

## 6. Cómo reproducir esta pasada

```bash
corepack pnpm lint
corepack pnpm -r typecheck
corepack pnpm -r test
# Integridad del contenido (SQLite empaquetado):
node <script> apps/mobile/assets/content/contenido-0.1.0.db   # ver comprobaciones del §2
```

Las comprobaciones de integridad del §2 se hicieron con `node:sqlite` sobre el `.db` real
(mismas consultas que corren en los tests de integración de mobile/pipeline).
