# Normas (§4.5) — articulado consolidado offline

Navegación del articulado que viaja en el paquete de contenido (`norma`, `articulo`), en tres
niveles, más marcadores locales. Todo **offline** y con el sistema visual v2 (`useAppTheme`,
componentes de `src/ui`).

## Navegación (Expo Router, stack anidado bajo la pestaña Normas)

```
app/(tabs)/normas/
  _layout.tsx                  Stack propio (cabecera con back, colores del tema)
  index.tsx        →  /normas                    Lista de normas + acceso a "mis marcadores"
  norma/[normaId]  →  /normas/norma/<id>         Articulado de la norma + buscador dentro
  articulo/[id]    →  /normas/articulo/<id>      Texto del artículo (Markdown) + fuente
  marcadores.tsx   →  /normas/marcadores         Artículos guardados en el dispositivo
```

## Piezas

- **`normas.ts`** — núcleo agnóstico del motor (depende solo de `SqlRunner`, como el buscador y la
  ficha). Consultas `listarNormas` / `listarArticulos` / `cargarArticulo` + lógica **pura**:
  `ordenarArticulos` (por `orden` documental y número ascendente numérico), `filtrarArticulos`
  (buscador dentro de la norma: prefijo por número, texto normalizado en otro caso),
  `esResumenOrientativo` (detecta los textos de seed) y `estadoCambio` (indicador "cambió el…").
- **`marcadoresStore.ts`** — Zustand sobre `user.db` (migración `user_version = 5`, tabla
  `marcador_articulo`). Local-first (ADR-001): los marcadores viven SOLO en el dispositivo, con el
  código/número/título **desnormalizados** para pintar "mis marcadores" sin abrir el paquete y para
  sobrevivir a un cambio de versión de contenido.
- **`BookmarkToggle.tsx`** — icono de marcador (relleno = marcado, dos señales, área táctil ≥ 44).
- **`ui/markdown/`** — `parse.ts` (parser Markdown mínimo y PURO: encabezados, listas, tablas,
  citas, párrafos + **negrita**/*cursiva*/`código`) y `Markdown.tsx` (renderer con primitivas de RN
  y tokens del tema). Sin dependencias nativas → compatible con Expo Go.

## Notas de contenido

- El paquete `--offline` de Fase 1 trae el RGC (≈231 artículos) más artículos de seed de otras
  normas (LSV, RGV, LRCSCVM, CP). Los textos de seed terminan en "Resumen orientativo": la ficha del
  artículo lo avisa con un `Banner`.
- Orden de artículos: se respeta `articulo.orden` (lo fija el pipeline) y, a igualdad, el número
  ascendente. Las disposiciones sin número van al final.

## Tests

- `normas.test.ts` — lógica pura (orden, filtro, resumen, indicador de cambio).
- `normas.integration.test.ts` — SQL real contra `assets/content/contenido-0.1.0.db` (se salta si
  el paquete no está generado; ver `../buscador/README.md` para regenerarlo).
- `../../ui/markdown/parse.test.ts` — parser de Markdown.
