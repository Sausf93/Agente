# Feedback (sugerencias y reportes)

Sugerencias y reportes del socio durante la beta. **Local-first, offline y anónimo**
(ver `docs/DECISIONES.md`, ADR-011). Nada sale a un servidor: cada aportación **queda
registrada en el propio dispositivo con un ESTADO** (`enviada` → `en_estudio` →
`aplicada`/`descartada`) y el socio decide cuándo mandársela a los fundadores con el
compositor nativo. Ya **no se pierde en un correo**: vive en "Mis sugerencias".

## Ciclo de vida y respuesta (petición del socio)

- **Registro primero, envío después.** Al pulsar "Guardar" la aportación se persiste en
  `user.db` (queda registrada). El envío a los fundadores es un paso **aparte y opcional**
  que **nunca** bloquea el registro.
- **Estado** (`EstadoFeedback` en `@agente/shared`): `enviada` (registrada por el socio),
  `en_estudio`, `aplicada`, `descartada`. Chip de color + texto en "Mis sugerencias".
- **Respuesta del equipo**: campo `respuesta` que el socio ve en el detalle, en el mismo
  apartado.
- ⚠️ **HOY NO hay backend.** El estado se gestiona **solo en local** (el socio puede
  marcarlo en el detalle) y `respuesta` llega siempre vacía. **El cambio de estado remoto
  y la respuesta bidireccional llegarán con Supabase (Fase 5)**; el esquema y la UI ya
  dejan el terreno preparado sin hacer ninguna llamada de red.

## Piezas

- `serialize.ts` — **lógica pura** (testeada con Vitest): mapeo fila SQLite ↔ `Feedback`
  (incluye `estado`/`respuesta`), etiquetas (`TIPO_/ESTADO_FEEDBACK_LABEL`), generación de
  id, texto del correo (`composeEmailBody`), `FOUNDERS_EMAIL` y los reducers puros del
  store (`markItemsSent`, `setItemEstado`). Sin RN.
- `estadoUi.ts` — mapeo estado → tono del `Badge` (color + texto).
- `send.ts` — envío desde el dispositivo: `mailto:` vía `Linking` (Expo Go) y, si no hay
  correo configurado, fallback a la hoja de compartir (`Share`). Reexporta `FOUNDERS_EMAIL`.
- `store.ts` — estado Zustand: carga, alta, envío del pendiente, `updateEstado` (local) y
  borrado.
- `FeedbackScreen.tsx` — UI de alta (formulario + aviso de privacidad) + acceso a "Mis
  sugerencias" + botón de envío del pendiente.
- `MisSugerenciasScreen.tsx` — lista del registro local con estado y fecha (reciente
  primero), estado vacío amable y navegación al detalle.
- `SugerenciaDetalleScreen.tsx` — texto completo + estado + respuesta del equipo (o aviso
  de que aún no la hay) + gestión local del estado.
- `../../db/userDb.ts` — persistencia SQLite de la base **local del usuario**
  (`insertFeedback`, `listFeedback`, `updateFeedbackEstado`, `markFeedbackSent`,
  `deleteFeedback`).
- Rutas: `app/feedback.tsx` (alta), `app/mis-sugerencias.tsx` (lista) y
  `app/sugerencia/[id].tsx` (detalle), fuera de las pestañas, abiertas desde **Más**.

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
que prerrellenan el formulario (p. ej. `tipo=error_contenido&infraccionId=...`).

**Ya está enganchado desde la ficha.** Al pie de `features/ficha/FichaScreen.tsx` hay una
acción discreta ("¿Ves algo mal? Avísanos") que navega a `app/feedback.tsx` con el tipo
`error_contenido` seleccionado y el contexto de la infracción. Los parámetros los construye
la función pura `features/ficha/reportarError.ts` (`reportarErrorFichaLink`, con test):
`tipo=error_contenido`, `infraccionId=<id de la ficha>` y `pantalla=ficha:<id>`. Coherente
con el badge "En revisión" del contenido en beta; sigue sin capturar datos de terceros (el
socio escribe el texto y el aviso de privacidad sigue fijo). También se usa desde **Más**,
donde el formulario llega vacío.

## Cuando exista Supabase (Fase 5, pendiente)

- Sincronización en segundo plano del feedback (campo `enviado` ya lo contempla) para no
  depender del correo manual.
- **Cambio de estado remoto** (`enviada → en_estudio → aplicada/descartada`) y **respuesta
  bidireccional**: el equipo mueve el `estado` y escribe `respuesta` desde `apps/admin`, y
  el socio lo ve en "Mis sugerencias". El modelo (`estado`, `respuesta`) ya existe; solo
  falta el transporte.
- Vista en el panel `apps/admin` para triar sugerencias y reportes por tipo/cuerpo/estado.
- Nada de esto cambia el modelo de `@agente/shared`: solo añade transporte.
