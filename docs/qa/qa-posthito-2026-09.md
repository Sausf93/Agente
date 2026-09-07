# QA post-hito — Agente

> Pasada de calidad sobre `main` (rama limpia, commit `321afd1`). Solo lectura del código de
> features + consulta directa del `.db` real + este informe. No se ha tocado código de features.
> Fecha: 2026-09-08. Autor: qa-testing.
> Alcance del hito: ficha adaptativa/operativa, +13 fichas por cuerpo, ordenanzas municipales de
> Santa Cruz de Tenerife, derechos cooficiales, competencia autonómica.
> Comparación: informe anterior `docs/qa/qa-prebeta-2026-09.md` (2026-09-07).

## Veredicto para la beta del cofundador (viernes): **CASI — SÍ con una corrección**

La puerta de calidad está **en verde** (lint, typecheck y 593 tests sin fallos ni flaky) y la
integridad de contenido es **muy sólida**: importes en rango, gravedades coherentes, fuentes
presentes, ≥2 sinónimos en todas las infracciones, TODO en `pendiente_revision`, y las ordenanzas
municipales correctamente **etiquetadas** con `territorio_id`. Las reglas no negociables se cumplen
(cero red en la app, lenguaje orientativo en detención, sin escudos, offline, feedback privado).

Hay **un defecto real introducido por el hito** que conviene cerrar antes del viernes: el **buscador
no aplica el filtro territorial**, así que las 7 infracciones de ordenanza de Santa Cruz de Tenerife
(zona azul 60 €, perro suelto 90 €, patinete por la acera 200 €, etc.) **aparecen en la búsqueda de
cualquier agente**, esté donde esté. La pestaña Normas SÍ filtra bien; el buscador no. Es justo el
tipo de fallo que erosiona la confianza (un importe de otro municipio mostrado fuera de su
territorio), y la corrección es pequeña porque la función de filtro **ya existe** y se usa en Normas.

- **Recomendación:** apto para la prueba guiada del cofundador (GC Tráfico) **cerrando antes el
  bloqueante B-1** (filtro territorial en el buscador). El resto son deseables, no bloquean.

---

## 1. Puerta de calidad (ejecutada)

| Comando | Resultado |
|---|---|
| `corepack pnpm lint` (ESLint 9, todo el workspace) | **OK, sin avisos** |
| `corepack pnpm -r typecheck` (tsc estricto × 3 proyectos) | **OK** (shared, content-pipeline, mobile) |
| `corepack pnpm -r test` | **593 pruebas verdes** (0 fallos) |

Desglose por paquete (todo verde):

- **packages/shared — 180** (10 archivos). Núcleos críticos: `cuadrante` **58**, `detencion` **20**,
  `validators` **33**, `feedback` 16, `plantillas` 11, `territorio` 10, `contentPackage` 9, `sustancias` 8,
  `geografia` 8, `content` 7.
- **packages/content-pipeline — 118** (11 archivos): parser BOE-XML 18 + diff 3, cliente BOE 6,
  seeds (tráfico 13, penal 11, seguridad ciudadana 20, sustancias 9, ordenanzas **9**, extranjería/local **8**),
  build del paquete SQLite 14, contenido-calle 7.
- **apps/mobile — 295** (28 archivos): buscador 9+13 (unit + integración FTS5 real) + resaltar 10 +
  recientes 7, sustancias 24+5, normas 26+7, cuadrante serialize 9, documentos (html 14, plantillasSeed 11,
  iniciales 8, rutaPdf 3), ficha (ficha 20, detencion 5, format 7), derechos **19**, feedback serialize 20,
  vehiculos 9, solicitarOrdenanza 3, userDb integración 8, theme.accent 19, resto.

Fragilidad: **ninguna prueba flaky**. Corridas deterministas (<3 s por paquete); los núcleos son
funciones puras sin reloj ni red. Los tres núcleos que exige `CLAUDE.md` (buscador, motor de reglas
de consecuencias/detención, horas del cuadrante) siguen siendo la zona más densamente cubierta.

Evolución vs. pre-beta: **480 → 593 tests** (+113), sin regresiones de suite. `apps/landing` sigue
sin tests (correcto). El **panel `apps/admin` (Next.js) sigue sin existir** (solo `landing` y `mobile`
en `apps/`); no hay CRUD de contenido ni puerta de publicación por UI: hoy el gate es el pipeline + seeds.

---

## 2. Integridad de contenido (paquete real `contenido-0.1.0.db`)

Consultado directamente el SQLite empaquetado con `node:sqlite`. Volumen confirmado:
**15 normas · 3.044 artículos · 49 infracciones · 27 consecuencias · 7 sustancias · 460 sinónimos.**
(Coincide con lo esperado: 15 / ~3.044 / ~49.)

Integridad — **sin defectos de datos**:

| Comprobación | Resultado |
|---|---|
| Infracciones sin `articulo_id` | 0 |
| `articulo_id` huérfano (apunta a artículo inexistente) | 0 |
| Infracciones sin `texto_boletin` | 0 |
| Administrativas sin importe | 0 |
| Importe fuera de `[0, 600.000]` | 0 |
| Importe reducido > base | 0 |
| Puntos fuera de `[0, 8]` | 0 |
| Penales con importe administrativo | 0 |
| Consecuencias sin `fuente` | 0 |
| Consecuencias con `articulo_id`/`infraccion_id` huérfano | 0 |
| Artículos con texto vacío | 0 |
| Artículos con `norma_id` huérfano | 0 |
| Sustancias sin fuente | 0 |
| Infracciones con `<2` sinónimos | 0 |

Estado editorial: **las 49 infracciones en `pendiente_revision`** (correcto: nada auto-publicado como
verificado). Reparto: 38 administrativas (23 grave · 9 leve · 6 muy grave) + 11 penales (delito).
Las 7 sustancias, **todas** `pendiente_revision = 1`.

Gravedades — **coherentes**: ninguna administrativa lleva `gravedad_penal`; ningún penal lleva
gravedad administrativa; todos los penales son `delito`. Los importes muy graves por encima de 500 €
(p. ej. `inf-tacografo` 2.001 €, `ppp-sin-licencia` 2.404,06 €, `inf-sin-seguro` 601 €,
`inf-drogas-volante` 1.000 €) corresponden a marcos con rango propio (transporte, animales, seguro,
alcohol/drogas), no a los tramos fijos de tráfico — correcto según `validators.ts`.

**Ordenanzas municipales (SCTF) — bien acotadas en los datos:**

- Las 3 ordenanzas (`OM-CIRC-SCTF`, `OM-ANIM-SCTF`, `OM-RUIDO-SCTF`) llevan
  `territorio_id = mun-santa-cruz-de-tenerife` y `ambito = municipal`.
- Sus **7 infracciones** llevan todas su `territorio_id = mun-santa-cruz-de-tenerife`. **Cero fugas**
  a nivel de dato: no hay infracción municipal sin `territorio_id`, ni con territorio de otro municipio.
- La pestaña **Normas** filtra correctamente por la cadena territorial del perfil
  (`filtroTerritorialSql` en `normas.ts`): lo municipal solo aparece si el municipio está en el perfil.

**Aviso a validar como decisión (no defecto):** las normas de tráfico/transporte/animales/seguro
(`LSV`, `RGC`, `RGV`, `LOTT`, `LPPP`, `LRCSCVM`) y las ordenanzas **no incluyen `policia_nacional`** en
su lista de `cuerpos`. Un agente de PN con "solo mi cuerpo" no vería tráfico. Es defendible, pero
conviene fijarlo como decisión explícita antes de abrir a PN. Para el cofundador (GC Tráfico) es
indiferente.

---

## 3. Reglas no negociables

- **Datos de tercero fuera del dispositivo — CUMPLE.** Cero llamadas de red en `apps/mobile/src`
  (sin `fetch`/`axios`/`supabase`/`http`). El PDF se genera y comparte desde el móvil; los campos de
  tercero no se pre-rellenan ni memorizan.
- **"Solicitar mi ordenanza" — CUMPLE.** `solicitarOrdenanza.ts` compone SOLO "Municipio (CCAA)";
  no toca datos de tercero. Se guarda en el dispositivo y el envío abre el compositor de correo.
- **Feedback — CUMPLE.** `serialize.ts::composeEmailBody` incluye solo contexto de dominio (tipo,
  fecha, versión/plataforma, cuerpo, territorio de segmento, pantalla, `articuloId`, `infraccionId`)
  y el texto que escribe el propio agente. Sin capturas automáticas ni datos de tercero.
- **Lenguaje orientativo en detención — CUMPLE.** Las 11 consecuencias de `detencion` usan
  "procede valorar la detención / no procede salvo…" con el pie de responsabilidad ("la valoración
  de los indicios y del riesgo corresponde al agente y al juez"). El barrido heurístico por lenguaje
  imperativo solo marcó citas legales ("deber de detener cuando concurre una causa del art. 490"),
  no órdenes al agente.
- **Sin escudos / denominaciones oficiales — CUMPLE** (revisión de código; iconografía Lucide neutra).
  Nota menor heredada: el árbol de detención usa iconos genéricos `shield-*` de Lucide (icono de UI,
  no emblema); confirmación rápida de diseño recomendable por lo sensible de la regla.
- **Funciona sin red — CUMPLE.** El paquete viaja empaquetado como asset; cuadrante, plantillas y
  derechos son locales.

**Mejora respecto a pre-beta:** el correo de feedback ya NO es un placeholder (`beta@agente.app`);
es `saulodlsf@gmail.com` (dirección real del socio, con test que verifica que no es el placeholder).
Se cierra uno de los 3 bloqueantes del informe anterior.

---

## 4. Regresiones de features previas

- **buscar → ficha → documento → compartir:** cableado intacto. La ficha pre-rellena el documento
  solo con campos del agente; el PDF se genera con `expo-print` y se comparte por la hoja nativa. Sin backend.
- **Cuadrante v3 (anclaje por día+turno):** serialización y núcleo de horas verdes (58 tests
  `cuadrante` + 9 `serialize`); bordes de medianoche/mes/nocturna/festivo cubiertos. Sin regresión.
- **Derechos (art. 520 + cooficiales):** 19 tests verdes; los idiomas cooficiales van marcados
  "pendiente de cotejo" (honesto). Sin regresión.
- **Sustancias:** umbrales coherentes y monótonos, todas con fuente y `pendiente_revision`; el
  orientador rechaza cantidades ≤0 y purezas fuera de (0,100]. Sin regresión.
- **Vehículos:** los enlaces sin URL fija se marcan `estado: 'pendiente'` (con test) en vez de
  mostrarse rotos. Mejora respecto a pre-beta (ya no es una pantalla a medias silenciosa).

---

## 5. Defectos priorizados

### Bloqueante para la beta (cerrar antes del viernes)

**B-1 · El buscador NO filtra por territorio → las ordenanzas de SCTF se muestran a todos.**
`buscarInfracciones` / `buscarTodo` (`apps/mobile/src/features/buscador/search.ts`) y su store
(`store.ts:63`, `buscarTodo(runner, termino)`) **no reciben ni aplican la cadena territorial** del
perfil, a diferencia de `listarNormas`. Consecuencia reproducible sobre el `.db` real:

- Buscar **"zona azul"** devuelve `inf-estacionamiento-indebido` (estatal) **y** `ord-sctf-zona-azul`
  (municipal SCTF, **60 €**).
- Buscar **"perro suelto"** devuelve `ppp-sin-bozal` (estatal) **y** `ord-sctf-perro-suelto`
  (municipal SCTF, **90 €**).
- Igual para patinete por la acera (200 €), excrementos (90 €), ruido (300 €), etc. — algunas hasta
  con sinónimos "zona azul tenerife" / "zona azul santa cruz", pensados para SCTF, visibles en todo el país.

**Severidad: alta.** Área: buscador / territorial. Un agente de Murcia o Madrid vería un importe
municipal de otro territorio como si fuera aplicable — exactamente el fallo de confianza que este QA
debe evitar. **Reproducción:** perfil sin municipio o de municipio ≠ SCTF → buscar "zona azul".
**Esperado:** las infracciones municipales de un territorio NO deben salir a agentes de otro
territorio (comportamiento ya correcto en Normas). **Fix pequeño:** propagar la cadena territorial del
perfil a `buscarInfracciones`/`buscarTodo` y filtrar por `infraccion.territorio_id` reutilizando la
lógica de `filtroTerritorialSql` (que ya existe y está testeada). Mitigación parcial actual: la ficha
puede etiquetar el ámbito, pero no evita que el importe erróneo aparezca en la lista de resultados.

### Deseables (no bloquean la beta; sí el lanzamiento)

- **D-1 · Penal sin `pena_texto`.** `inf-negativa-prueba` (art. 383 CP) es `penal`/`delito` con
  `pena_texto = null` e `importe_eur = null`: su ficha no mostraría la pena del propio delito. Además,
  `validarMinimosPublicacion` **no exige** `pena_texto` en penales, por lo que este hueco no lo caza
  ningún validador. Recomendación: rellenar la pena (art. 383: prisión y privación del permiso) y
  añadir la comprobación al validador. Severidad: media (contenido; mitigado por `pendiente_revision`).
- **D-2 · Gate jurídico del contenido que se va a tocar.** Las 49 infracciones + consecuencias + 7
  sustancias siguen `pendiente_revision`. Antes de que el cofundador se fíe de un importe o un "procede
  detención", el tráfico/penal/sustancias que probará debe pasar por `revisor-juridico` / skill
  `revisar-contenido`. No impide abrir la app; impide fiarse del dato (que es el producto).
- **D-3 · Cuerpos de tráfico sin `policia_nacional`** (ver §2): fijarlo como decisión explícita antes
  de abrir a PN.
- **D-4 · Correo de feedback = Gmail personal del socio** (`saulodlsf@gmail.com`). Funciona para la
  beta; conviene un buzón de proyecto antes del lanzamiento público.
- **D-5 · Enlaces de Vehículos** aún `pendiente` (honestos, pero vacíos): aportar URLs o mantener el
  aviso.
- **Camino a "producto final" (fuera del alcance del hito):** mapa/PK offline (Fase 4), firma Ed25519
  + CDN + swap desde red (hoy stub, `firma_algoritmo=ed25519` en meta pero contenido bundled), pagos
  RevenueCat + freemium (Fase 5), panel admin Next.js, ficha de tienda/privacidad/borrado de datos,
  icono propio, Sentry, e2e (Maestro/Detox/Playwright).

---

## 6. Cómo reproducir esta pasada

```bash
corepack pnpm lint
corepack pnpm -r typecheck
corepack pnpm -r test
# Integridad del contenido (SQLite empaquetado real):
node <script> apps/mobile/assets/content/contenido-0.1.0.db   # ver comprobaciones del §2
# B-1 (fuga territorial del buscador):
#   SELECT DISTINCT infraccion_id FROM sinonimo
#   WHERE termino_normalizado='zona azul' AND infraccion_id IS NOT NULL;
#   -> incluye ord-sctf-zona-azul aunque el perfil no sea de Santa Cruz de Tenerife
```

Las comprobaciones de integridad se hicieron con `node:sqlite` sobre el `.db` real (mismas consultas
que corren en los tests de integración de mobile/pipeline).
