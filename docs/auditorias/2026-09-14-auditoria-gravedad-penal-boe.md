# Auditoría de clasificación penal (gravedadCp) contra el BOE — 2026-09-14

**Autor:** sesión Claude `gallant-haibt-97a235` (agente principal, cotejo directo del articulado
consolidado en el navegador). **Fuente:** Código Penal consolidado, **BOE-A-1995-25444** (texto
vigente, últimas reformas LO 14/2022 y LO 1/2026). **Motor afectado:** `evaluarDetencion` usa
`gravedadCp` (art. 13/33 CP) → un error de clasificación desvía la rama de detención.

> Esta auditoría **no edita `penalSeed.ts`** (había otra sesión escribiendo en ese fichero en
> paralelo; se evita la colisión). Son hallazgos para aplicar por quien tenga el turno de escritura.
> El desdoblamiento del hurto y la confirmación de la usurpación (arts. 234/245) ya se resolvieron
> en el [PR #1](https://github.com/Sausf93/Agente/pull/1).

## Resumen de hallazgos

| Ficha | Art. | Estado ficha | Veredicto auditoría | Acción |
|---|---|---|---|---|
| `del-atentado-agravado` | 551 | pendiente (menos_grave) | **Correcto como modelado** | Confirmar; limpiar "A verificar" |
| `del-favorecimiento-inmigracion-ilegal` | 318 bis | pendiente (**grave**) | **Sobre-clasifica** el tipo base | Reclasificar base a menos_grave (o desdoblar) |
| `del-apropiacion-indebida` | 253 | pendiente (menos_grave) | Gravedad OK, **citación errónea** | Corregir remisión 249 → 248/250 |
| `del-administracion-desleal` | 252 | pendiente (menos_grave) | Gravedad OK, **citación errónea** | Corregir remisión 249 → 248/250 |
| `del-estafa` | 249 | **VERIFICADA** (menos_grave) | Gravedad OK, **artículo fuente desactualizado** | Anclar/citar art. 248 (pena base tras LO 14/2022); limpiar "A verificar" |

---

## 1. `del-atentado-agravado` (art. 551 CP) — CONFIRMADO correcto

- **Art. 550.2 CP:** atentado contra **autoridad** = prisión 1-4 años; **en los demás casos**
  (agente/funcionario) = prisión 6 meses-3 años. **550.3:** autoridad cualificada (gobierno, juez,
  fiscal…) = prisión 1-6 años.
- **Art. 551 CP:** "penas **superiores en grado** a las respectivamente previstas en el artículo
  anterior" (arma/objeto peligroso, peligro para la vida, vehículo de motor, motín en prisión).
- **Cálculo (art. 70.1.1ª CP):** superior en grado a 6m-3a (agente) = **3 años y 1 día a 4 años y
  6 meses** → máx. ≤ 5 años → **MENOS GRAVE** (art. 33.3.a). Superior en grado a 1-4 años (autoridad)
  = 4 años y 1 día a 6 años → **GRAVE**; a 1-6 años (autoridad cualificada) = 6 a 9 años → **GRAVE**.
- **Veredicto:** la ficha modela el **atentado agravado a AGENTE** (caso de calle) → `menos_grave`
  es **correcto**; la nota ya advierte que contra AUTORIDAD es grave. Los importes del `penaTexto`
  ("3 a 4 años y 6 meses" agente / "4 a 6 años" autoridad) concuerdan.
- **Acción:** verificable. Quitar el "A verificar" del `penaTexto` y reformular la nota como
  confirmada (el matiz sujeto pasivo agente/autoridad ya está bien explicado). *(Alternativa
  conservadora: dejar `pendiente_revision` por depender de una pena "superior en grado" calculada;
  pero la clasificación del caso modelado es correcta.)*

## 2. `del-favorecimiento-inmigracion-ilegal` (art. 318 bis CP) — SOBRE-CLASIFICA el tipo base

- **318 bis.1:** ayudar a entrar/transitar irregularmente = **multa 3-12 meses o prisión 3 meses-1
  año** (mitad superior con ánimo de lucro). Prisión 3m-1a → menos grave; multa >3 meses → menos
  grave ⇒ **tipo base = MENOS GRAVE**. Cláusula humanitaria en el párrafo 2 (no punible).
- **318 bis.2:** ayudar a permanecer con ánimo de lucro = misma pena → **menos grave**.
- **318 bis.3:** prisión **4-8 años** si hay **organización** o peligro para la vida → **GRAVE**.
  **318 bis.4:** las mismas penas + inhabilitación si el autor se prevale de su condición de
  autoridad/agente/funcionario.
- **Problema:** la ficha fija `gravedadCp: 'grave'` porque modela el subtipo de **organización**
  (318 bis.3). Pero el tipo **base 318 bis.1** (el favorecimiento individual, más frecuente en la
  calle) es **menos grave**. Igual que ocurría con el hurto, clasificar toda la ficha como `grave`
  **sobre-orienta la detención** del caso base.
- **Acción recomendada:** modelar el **tipo base como `menos_grave`** (318 bis.1/.2), dejando en la
  nota el subtipo de **organización = GRAVE (318 bis.3)** y el prevalimiento de autoridad (318 bis.4);
  o **desdoblar** (`del-favorecimiento-inmigracion-ilegal` base menos grave + subtipo organizado
  grave), como se hizo con el hurto. Preservar SIEMPRE la **cláusula humanitaria** (318 bis.1, párr.
  2) y el deslinde con la **trata** (177 bis, protege a la víctima) y con la **infracción
  administrativa** del art. 54.1.b LO 4/2000 ("cuando el hecho no sea delito").

## 3. `del-apropiacion-indebida` (253) y `del-administracion-desleal` (252) — CITACIÓN ERRÓNEA

- **Art. 253.1 CP** (apropiación indebida) y **art. 252.1 CP** (administración desleal) remiten, ambos,
  a "las penas del **artículo 248** o, en su caso, del **artículo 250**" — **no al 249**.
- **Art. 248 CP** (pena base de la estafa, párr. 2): "Los reos de estafa serán castigados con la pena
  de **prisión de seis meses a tres años**"; y (párr. 3) si lo defraudado **≤ 400 €** → **multa de 1
  a 3 meses** (salvo circunstancias del 250) ⇒ **delito leve**.
- **Art. 252.2 / 253.2 CP:** si el perjuicio/lo apropiado **≤ 400 €** → **multa de 1 a 3 meses** →
  **LEVE** (ambas fichas ya lo anotan, aunque dicen "multa" genérica).
- **Veredicto:** `gravedadCp: 'menos_grave'` es **correcto** para el caso base (> 400 € → 6m-3a). Pero
  el `penaTexto`/nota citan "**art. 249**"; debe ser **art. 248** (base) **o 250** (agravada). Si
  concurre agravante del **250** (p. ej. defraudación > 50.000 €, o 250.2 → 4-8 años) el hecho pasa a
  **GRAVE** — conviene mencionarlo en la nota.
- **Acción:** corregir la remisión **249 → 248/250** en `penaTexto` y `notaRevision` de ambas.

## 4. `del-estafa` (art. 249) — YA VERIFICADA pero con ARTÍCULO FUENTE DESACTUALIZADO

- La ficha modela la **estafa por ENGAÑO** ("engaño bastante para producir error…"), que es la
  definición y **pena base del art. 248 CP** (prisión 6m-3a; ≤ 400 € → multa 1-3 meses → leve).
- Tras la **LO 14/2022** (vigente 12/01/2023), el **art. 249** dejó de ser la pena base y pasó a
  regular la **estafa informática y con tarjetas/instrumentos de pago** (misma pena, 6m-3a). La pena
  base de la estafa por engaño vive ahora en el **art. 248**.
- **Problema:** `del-estafa` **está en `VERIFICADOS_BOE`** con nota autogenerada "COTEJADO contra el
  BOE (Código Penal **art. 249**)…", y su artículo fuente es `ART_CP_249`. Para la estafa por engaño
  la fuente correcta es el **art. 248**. Además el `penaTexto` conserva el sufijo "**A verificar**"
  pese a estar marcada `verificado` (incoherencia de higiene).
- **Acción:** anclar la ficha al **art. 248** (definición + pena base) y actualizar `penaTexto`/nota;
  quitar "A verificar". **Nota de implementación:** hoy el paquete **no incluye `ART_CP_248`** (el
  test `penalSeed.test.ts` lista `249` pero no `248`); habría que **añadir `ART_CP_248`** al seed y a
  la lista de artículos del CP del test de `combinarSeeds`. El art. 249 puede mantenerse para una
  futura ficha de estafa informática/con tarjeta.

## Hallazgo transversal (higiene)

Varias fichas marcadas `verificado` conservan el sufijo "**A verificar**" dentro de `penaTexto`
(visible en la UI). Detectadas aquí: `del-estafa`. Conviene un barrido (`grep "A verificar"` en
`penalSeed.ts`) para limpiarlo en todas las que ya estén en `VERIFICADOS_BOE`.

---

## Segundo pase — doble-chequeo de las 8 fichas recién marcadas `verificado` por la sesión de `main`

Verificación independiente de las fichas que el commit `3a6cba9` (otra sesión) añadió a
`VERIFICADOS_BOE`, cotejando su `gravedadCp`/`penaTexto` contra el BOE. **Resultado: 7/8 confirmadas
correctas; 0 errores. 1 no re-cotejada en este pase** (el DOM del consolidado no expuso su ancla).

| Ficha | Art. | Pena en el BOE | gravedadCp | Veredicto |
|---|---|---|---|---|
| `del-rina-tumultuaria` | 154 | prisión 3m-1a **o** multa 6-24m | menos_grave | ✅ coincide exacto |
| `del-usurpacion-funciones` | 402 | prisión 1-3 años | menos_grave | ✅ correcto (≤5 años) |
| `del-allanamiento-establecimiento` | 203.1 | prisión 6m-1a + multa 6-10m | menos_grave | ✅ correcto (203.2 = multa 1-3m leve; 203.3 violencia 6m-3a) |
| `del-acoso-stalking` | 172 ter.1 | prisión 3m-2a **o** multa 6-24m | menos_grave | ✅ correcto |
| `del-trata-seres-humanos` | 177 bis.1 | prisión 5-8 años | grave | ✅ correcto (**art. 13.4**: 5 años cae en "hasta 5" y >5 en "grave" ⇒ grave) |
| `del-intrusismo` | 403 | multa 12-24m (o 6-12m); 403.2 prisión 6m-2a | menos_grave | ✅ correcto *(matiz: el `penaTexto` unifica como "multa 6-24m"; el 403.1 son dos tramos según el tipo de título — 12-24m académico / 6-12m oficial)* |
| `del-armas-prohibidas` | 563 | prisión 1-3 años | menos_grave | ✅ correcto |
| `del-maltrato-animal` | 340 bis | — | menos_grave | ⚠️ **no re-cotejado en este pase** (el consolidado no cargó el ancla `a340bis` en el DOM). Verificado en trabajo previo (Ola G, tras la LO 3/2023 que trasladó el maltrato del 337 al 340 bis). Pendiente de re-confirmar el ancla en una lectura posterior. |

**Conclusión del segundo pase:** las verificaciones penales de la otra sesión son **sólidas** (ningún
importe/gravedad mal). Único fleco: re-confirmar el articulado del **340 bis** cuando el consolidado
exponga su ancla.

## Barrido de patrón «subtipo agravado modelado como caso por defecto»

Es la clase de error que motivó el desdoblamiento del hurto: si `gravedadCp` refleja un subtipo
(agravado o atenuado) distinto del caso más frecuente, el motor **desvía la rama de detención**.
Revisadas todas las fichas `grave` y las `leve`:

- **Fichas `grave`** (138 homicidio, 139 asesinato, 163 detención ilegal, 174 torturas, 368 tráfico
  de drogas, 177 bis trata): todas correctas (prisión > 5 años, o 4-6/3-6/2-6 años → **grave por el
  art. 13.4**). **Única excepción: `del-favorecimiento-inmigracion-ilegal`** (grave modelando la
  organización 318 bis.3, cuyo base 318 bis.1 es menos grave) — ver §2.
- **Fichas `leve`**: `del-hurto-leve` y `del-usurpacion` correctas. **`del-defraudacion-fluido`
  (art. 255)** repite el patrón del hurto — modela el caso ≤ 400 € (multa 1-3 meses, 255.2 = leve),
  cuando > 400 € es multa de 3-12 meses (255.1 = **menos grave**). **Prioridad BAJA**: como ambos
  tramos son de SOLO MULTA, la orientación de detención apenas cambia (art. 492: no procede salvo
  garantías). Recomendación menor: una nota que aclare el tramo > 400 € (menos grave), o desdoblar
  para paridad plena con el hurto.

### Método (reutilizable)

Lectura del articulado sancionador desde el navegador in-app (los subagentes con WebFetch **no**
llegan al articulado; el agente principal sí): `document.getElementById('aNNN')` sobre el
consolidado `BOE-A-1995-25444` e iterar `nextElementSibling` hasta el siguiente `<h5>`. Regla de
clasificación recurrente confirmada: **prisión 3 meses-5 años = menos grave (33.3.a); multa > 3
meses = menos grave (33.3.j); multa ≤ 3 meses = leve (33.4.g); pena que solapa leve/menos grave ⇒
leve por el art. 13.4**.
