---
title: "Agente — Lógica jurídica del árbol de detención: MENOR y EXTRANJERÍA"
autor: "Revisión jurídica (control de calidad de contenido; NO asesoramiento jurídico)"
fecha: "2026-09-08"
estado: "Especificación accionable — para mobile-dev / ingesta. NO implementado aún."
alcance:
  - "packages/shared/src/detencion.ts (motor evaluarDetencion)"
  - "packages/shared/src/enums.ts (nuevos enums de entrada)"
  - "apps/mobile/src/features/ficha/detencion.ts (circunstancias del árbol interactivo)"
verificacion: "Arts. citados cotejados contra BOE consolidado (LO 5/2000 = BOE-A-2000-641; LO 4/2000 = BOE-A-2000-544). TODO marcado «a verificar» por jurista antes de publicar."
---

# 0. Naturaleza de este documento

Define la LÓGICA ORIENTATIVA que amplía el árbol de detención con dos ramas nuevas:
**(A) autor MENOR de edad** y **(B) EXTRANJERÍA / estancia irregular**. Es especificación,
no código. Todo es **orientativo, nunca imperativo** ("procede valorar", "no es detención
penal"; nunca "detén"). Cada salida lleva sus **fuentes** y un **pie de responsabilidad**.

> Control de calidad de contenido legal, no asesoramiento jurídico. Artículos cotejados con
> el BOE consolidado, pero todos los datos (plazos, importes, precedencia) van **a verificar**
> por un jurista antes de publicar una `ContentVersion`.

# 1. Modelo de entrada nuevo

## 1.1 Edad del autor — selector de 3 tramos
Nuevo enum `TramoEdadAutor = 'menor_14' | 'menor_14_17' | 'adulto'` (enums.ts). En
`EntradaDetencion`: `edadAutor` (default `'adulto'`). UI: selector de 3 opciones (excluyentes,
NO toggle), al INICIO del árbol (la edad puede cortocircuitar el árbol penal):
- Menor de 14 → `menor_14` — Inimputable penalmente (art. 3 LO 5/2000).
- 14 a 17 → `menor_14_17` — Régimen penal del menor (LO 5/2000), con especialidades.
- 18 o más → `adulto` — Régimen penal ordinario.

## 1.2 Marca "solo hecho migratorio, sin ilícito penal"
Booleano `soloHechoMigratorio` (default false) en `EntradaDetencion`. UI: toggle "Solo estancia
irregular (sin delito)" con ayuda anti-error: la estancia irregular NO es delito (art. 53.1.a
LO 4/2000); si además hay un ilícito penal, NO lo marques (se sigue el árbol penal). Es un
discriminador de rama, no un agravante.

# 2. Salida nueva: cuarto valor de orientación
`OrientacionDetencion` pasa a incluir **`'no_detencion_penal'`** (menor<14 / extranjería
administrativa): NO encajan en `no_procede_salvo` (ahí no hay "salvo"). Presentación en
`ORIENTACION_VISUAL`: `{ tono: 'noProcede', etiqueta: 'No es detención penal', icono: 'shield-x' }`
(mismo tono rojo, etiqueta propia). El título/motivo los aporta el motor por rama.

# 3. Precedencia del árbol ampliado (el primero que coincide gana)
1. `edadAutor === 'menor_14'` → RAMA A1 (inimputable, protección de menores).
2. `soloHechoMigratorio === true` → RAMA B1 (vía administrativa extranjería). Si además es
   menor, añade aviso de protección de menores / posible MENA.
3. `edadAutor === 'menor_14_17'` → árbol penal LECrim actual + OVERLAY especialidades (RAMA A2).
4. `adulto` (defecto) → árbol penal LECrim actual, SIN cambios.

# 4. RAMA A — MENOR
## 4.1 A1 · Menor de 14 (inimputable) — art. 1.1 y 3 LO 5/2000
- orientacion: `no_detencion_penal`
- titulo: "No procede la detención penal: autor menor de 14 años"
- motivo: "El autor es menor de catorce años y es penalmente inimputable (art. 1.1 y 3 LO
  5/2000): no se le aplica el régimen penal ni cabe detención penal. Procede su identificación
  con las cautelas propias de un menor, la entrega a sus representantes legales o, en su
  defecto, la puesta a disposición de la Entidad Pública de protección de menores, y la
  comunicación al Ministerio Fiscal (art. 3 LO 5/2000, en relación con la LO 1/1996)."
- fuentes: ['LO 5/2000 art. 1.1', 'LO 5/2000 art. 3', 'LO 1/1996']; pie: PIE_DETENCION_MENOR

## 4.2 A2 · Menor 14-17 (régimen del menor) — art. 17 LO 5/2000
La detención penal SÍ puede proceder: se ejecuta el árbol LECrim actual SIN cambios y se
SUPERPONEN las especialidades. El título/motivo base salen del motor; A2 AÑADE avisos+fuentes:
- fuentes += 'LO 5/2000 art. 17'
- avisosMenor: "Régimen del menor (14-17 años): si se detiene, la detención policial no puede
  exceder de 24 horas (art. 17.4 LO 5/2000, a verificar); custodia separada de los mayores
  (art. 17.3); información inmediata y notificación a representantes legales y al Ministerio
  Fiscal de Menores —no al juzgado de instrucción ordinario— (art. 17.1); puesta a disposición
  del Ministerio Fiscal (art. 17.4-17.5). Si es extranjero, aviso a autoridades consulares."
- pie: PIE_DETENCION_MENOR. (El título base NO se toca: hay imputabilidad; cambian procedimiento
  y garantías.)

# 5. RAMA B — EXTRANJERÍA
## 5.1 B1 · Solo hecho migratorio (estancia irregular, sin delito) — LO 4/2000
- orientacion: `no_detencion_penal`
- titulo: "No es detención penal: la estancia irregular es infracción administrativa"
- motivo: "La estancia irregular en España es una infracción administrativa grave, no un
  delito (art. 53.1.a LO 4/2000): no procede detención penal por ese motivo. Procede la
  identificación y, en su caso, la incoación del procedimiento administrativo sancionador de
  extranjería, cuya sanción puede ser multa (art. 55.1) o, con preferencia en la estancia
  irregular, la expulsión (art. 57), con prohibición de entrada (art. 58). El posible
  internamiento en CIE es una MEDIDA CAUTELAR que acuerda la autoridad judicial a instancia de
  la Administración (arts. 61 y 62 LO 4/2000), no una detención penal policial."
- fuentes: ['LO 4/2000 art. 53.1.a','art. 55.1','art. 57','art. 58','art. 61','art. 62']; pie: PIE_EXTRANJERIA
- Si `edadAutor` ∈ {menor_14, menor_14_17}: añadir aviso de protección de menores / posible MENA.

## 5.2 B2 · Hecho migratorio + ilícito penal
Si `soloHechoMigratorio === false` y hay delito (quebrantar prohibición de entrada, documentación
falsa, resistencia…): árbol penal LECrim de siempre (adulto o A2 si menor). El hecho migratorio
no rebaja la evaluación penal; se tramita en paralelo por su vía administrativa. No requiere
lógica nueva: el agente no marca `soloHechoMigratorio`.

# 6. Pies por rama
- PIE_DETENCION_MENOR: "Orientación basada en la LECrim y en la LO 5/2000 (responsabilidad penal
  del menor); la valoración de los indicios, del riesgo y del régimen aplicable corresponde al
  agente y, en su caso, al Ministerio Fiscal de Menores y a la autoridad judicial."
- PIE_EXTRANJERIA: "Orientación basada en la LO 4/2000 (extranjería); la calificación del hecho,
  la sanción (multa o expulsión) y el eventual internamiento corresponden al procedimiento
  administrativo y a la autoridad judicial, no a una detención penal policial."

# 7. Avisos de seguridad no negociables
1. Menor → Ministerio Fiscal de Menores, NO juzgado ordinario; notificación a representantes legales (17.1).
2. Menor<14 → no hay detención penal, sino protección de menores.
3. Extranjería-solo → NO es detención penal (administrativa).
4. CIE ≠ detención policial: medida cautelar JUDICIAL (art. 62). Nunca "detiene para CIE".
5. Importe expulsión/multa orientativo: la sanción principal en estancia irregular suele ser la
   expulsión (art. 57). Validar con RANGOS_IMPORTE_EXTRANJERIA (art. 55.1).
6. Lenguaje siempre orientativo.

# 8. Qué sigue siendo del agente/juez
Apreciación de indicios/riesgo/flagrancia; estimación de la edad cuando no hay documento fiable
(la app solo ofrece el selector; la determinación de minoría de edad es de la autoridad);
calificación penal; decisión de expulsión e internamiento CIE (Administración + juez); duración
concreta dentro de los máximos.

# 9. Tareas para el implementador
enums.ts: `TramoEdadAutor`; `'no_detencion_penal'` en `OrientacionDetencion`.
detencion.ts (shared): `edadAutor` y `soloHechoMigratorio` en `EntradaDetencion`; `avisosMenor?`
en `ResultadoDetencion`; `PIE_DETENCION_MENOR`/`PIE_EXTRANJERIA`; precedencia §3; tests de las 4
ramas × combinaciones.
apps/mobile ficha/detencion.ts: selector de 3 tramos de edad; toggle `soloHechoMigratorio` con
ayuda anti-error; `no_detencion_penal` en `ORIENTACION_VISUAL`; render del bloque `avisosMenor`.

# 10. Estado de verificación (cotejo BOE 2026-09-08)
Verificado BOE: menor 14-18 LORPM (art. 1.1), menor<14 inimputable (art. 3), estancia irregular
infracción grave (53.1.a), multa por tramos (55.1), efectos expulsión (58), medidas cautelares
(61), CIE medida cautelar judicial (62). A VERIFICAR por jurista: plazos art. 17 LO 5/2000 (24 h)
y art. 62 LO 4/2000 (60 días CIE); doctrina de preferencia de la expulsión (art. 57, TJUE C-38/14).
Antes de publicar: revisión a dos ojos (§8.3) por el cofundador agente + jurista.
