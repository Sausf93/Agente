# Documentos (plantillas → PDF en el dispositivo)

Pestaña **Documentos** (§4.8): el agente rellena una plantilla y genera un **PDF en su propio
teléfono**. Es el pilar "ahorra trabajo de oficina". Todo **offline**, **local-first** y
**compatible con Expo Go**.

## Regla crítica de privacidad

Los **datos de terceros** (matrículas, nombres, DNI, domicilios) y el **PDF generado** NUNCA
salen del dispositivo ni van a un servidor (no hay servidor). En la UI:

- Los campos de vehículo/persona van marcados `esDatoTercero` y se piden en una sección aparte
  con un **aviso fijo** ("Solo en este dispositivo").
- **No se persisten como borrador**: solo se "recuerdan" campos del agente marcados `recordar`
  (p. ej. su unidad), y solo esos (ver `documento_campo_recordado` en `userDb`).
- El PDF se **comparte/envía desde el propio teléfono** (hoja de compartir con el PDF adjunto, o
  `mailto` con una copia en texto). El pie del PDF lo recuerda.

Encabezado **NEUTRO**: cuerpo y unidad son **texto** que rellena el agente. La app no imprime
escudos ni denominaciones oficiales por defecto (§10, CLAUDE.md).

## Piezas

| Fichero | Qué es | Puro/testeado |
|---|---|---|
| `@agente/shared` → `plantillas.ts` | Motor `renderPlantilla` / `extraerVariables` (variables `{{campo}}`, escape, campos faltantes) | Sí (`plantillas.test.ts`) |
| `plantillasSeed.ts` | Seed de 4 plantillas (`boletin_denuncia`, `acta_inmovilizacion`, `acta_intervencion_sustancias`, `diligencia_identificacion`) + descriptores de campo | Sí (`plantillasSeed.test.ts`) |
| `campos.ts` | Tipo `CampoPlantilla` / `PlantillaDoc` + `CampoSeccion`/`seccionDe` (metadatos de formulario) | — |
| `iniciales.ts` | Valores iniciales del formulario (precedencia prefill > recordado > fecha/hora; terceros nunca) | Sí (`iniciales.test.ts`) |
| `html.ts` | Markdown → HTML de imprenta + `buildDocumentHtml` + `nombreArchivoSeguro` (con **escape**) | Sí (`html.test.ts`) |
| `generarPdf.ts` | `expo-print` (HTML → PDF) + renombrado a nombre legible | No (efectos) |
| `compartir.ts` | `expo-sharing` (hoja de compartir con el PDF, con título adaptable) + `mailto` (texto) | No (efectos) |
| `DocumentosScreen.tsx` | Catálogo de actas ("mis actas") + fila a Lectura de derechos | No (UI) |
| `RellenarScreen.tsx` | Formulario por secciones + generar + enviar/compartir | No (UI) |

## El documento NACE de la consulta

La vía principal es la **ficha** → "Generar documento": abre el boletín con **todo lo legal ya
relleno** (norma, artículo, texto/hecho, importe, puntos, gravedad — solo campos del agente, nada
de terceros). El agente no reescribe esa parte. La pestaña Documentos es el catálogo de actas para
cuando el documento **no** parte de una infracción.

### Secciones del formulario (`CampoSeccion`)

Los huecos se agrupan por lo que significan, no por su orden en el Markdown:

- `legal` — lo rellena la app desde la infracción. Bloque "Ya rellenado por la app" (fondo tenido de
  acento cuando llega prerrelleno). Editable solo si procede.
- `identidad` — cuerpo, unidad y **nº de TIP**. Se `recordar`an en el dispositivo para no
  reescribirlos. Nunca son datos de terceros.
- `servicio` — fecha, hora, lugar/PK y lo propio de cada acta. Lo mínimo a mano, al final.
- Los `esDatoTercero` van **siempre** a su sección aparte con el aviso fijo "Solo en este
  dispositivo, no se envía".

## Flujo

1. **Ficha** → "Generar documento" (con prefill legal) **o** **Documentos** → elegir acta.
2. `RellenarScreen` agrupa por secciones, prerrellena fecha/hora y lo recordado; terceros vacíos.
3. **Generar PDF**: `renderPlantilla` → `buildDocumentHtml` → `expo-print`. Se memorizan solo los
   campos del agente `recordar`. Si quedan huecos, se avisa (se imprimen como línea a rellenar).
4. **Enviarme a mi correo** / **Compartir o imprimir**: la acción grande tras generar. Hoja de
   compartir (Mail con el PDF adjunto, WhatsApp, Archivos, imprimir) con el título adaptado al
   gesto. Atajo "solo el texto" vía `mailto`. La idea del socio: genera → te lo mandas/compartes →
   lo imprimes en la oficina y pones la fecha y un par de datos a mano. Todo desde el dispositivo.

## Por qué el seed vive en la app (y no en el paquete de contenido)

En v1 las plantillas viajan como **seed estático** en la app, no en el paquete SQLite firmado, para
poder iterarlas durante la beta sin regenerar/re-firmar el paquete y mantenerlo 100 % offline. El
tipo `Plantilla` de `@agente/shared` sigue siendo la fuente de verdad (el seed se valida contra él
en test). Cuando el panel de administración las edite, se moverán al paquete **sin cambiar el
contrato** de la app. Ver ADR-017.

## Probar

- Tests (sin dispositivo): `corepack pnpm -F @agente/mobile test` y `corepack pnpm -F @agente/shared test`.
- En dispositivo (Expo Go): `corepack pnpm -F @agente/mobile start`. `expo-print` y `expo-sharing`
  funcionan en Expo Go; no añaden módulos que rompan el bundle.
