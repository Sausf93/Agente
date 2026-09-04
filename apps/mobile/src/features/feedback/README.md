# Feedback (sugerencias y reportes)

Sugerencias y reportes del socio durante la beta. **Local-first, offline y anónimo**
(ver `docs/DECISIONES.md`, ADR-011). Nada sale a un servidor: se guarda en el
dispositivo y el propio socio decide cuándo mandárselo a los fundadores con el
compositor nativo.

## Piezas

- `serialize.ts` — **lógica pura** (testeada con Vitest): mapeo fila SQLite ↔
  `Feedback`, generación de id y el texto del correo (`composeEmailBody`). Sin RN.
- `send.ts` — envío desde el dispositivo: `mailto:` vía `Linking` (Expo Go) y, si no
  hay correo configurado, fallback a la hoja de compartir (`Share`). `FOUNDERS_EMAIL`
  es la dirección de los fundadores (confirmar antes de publicar la beta).
- `store.ts` — estado Zustand: carga, alta, envío del pendiente y borrado.
- `FeedbackScreen.tsx` — UI (formulario + lista + aviso de privacidad + botón enviar).
- `../../db/userDb.ts` — persistencia SQLite de la base **local del usuario**.
- Ruta: `app/feedback.tsx` (fuera de las pestañas), abierta desde **Más**.

## Decisión de persistencia: `expo-sqlite` (no un store efímero)

Se persiste en **`expo-sqlite`** (base `user.db`), no solo en memoria/Zustand:

- Coherente con **ADR-010 (punto 4)**: los datos de lectura/escritura del usuario
  viven en una base SQLite **separada del paquete de contenido**, para poder sustituir
  el contenido sin tocar lo del usuario. El feedback es el primer inquilino de esa base
  (luego llegarán cuadrante, favoritos y "mi ordenanza personal").
- **Durabilidad**: un reporte de la beta no puede perderse al cerrar la app. Un store en
  memoria se perdería; `AsyncStorage` no da consultas ni migraciones.
- **Migraciones** versionadas con `PRAGMA user_version` (ADR-010 punto 6): los datos del
  usuario deben sobrevivir a cualquier actualización.
- Compatible con **Expo Go** (no añade dependencias nativas nuevas).

La lógica no-trivial (mapeo, texto del correo, id) se extrae a `serialize.ts` como
funciones puras para poder testearla con Vitest sin el runtime de React Native ni SQLite.

## Privacidad (regla no negociable de CLAUDE.md)

- Aviso **fijo** en pantalla: no incluir matrículas, nombres, DNI ni datos de
  intervenciones.
- **Anónimo**: solo se guarda contexto de segmento no identificativo (`cuerpo`,
  `territorio`) y el texto que escribe el socio. **Sin capturas automáticas.**

## Gancho "reportar error" desde una ficha

La ruta admite parámetros opcionales `tipo`, `articuloId`, `infraccionId`, `pantalla`
que prerrellenan el formulario (p. ej. `tipo=error_contenido&articuloId=...`). Aún no
hay fichas; de momento se usa solo desde **Más**, pero el terreno queda listo.

## Cuando exista Supabase (pendiente)

- Sincronización en segundo plano del feedback (campo `enviado` ya lo contempla) para no
  depender del correo manual.
- Vista en el panel `apps/admin` para triar sugerencias y reportes por tipo/cuerpo.
- Nada de esto cambia el modelo de `@agente/shared`: solo añade transporte.
