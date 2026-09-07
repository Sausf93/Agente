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
| `plantillasSeed.ts` | Seed de 3 plantillas (`boletin_denuncia`, `acta_inmovilizacion`, `diligencia_identificacion`) + descriptores de campo | Sí (`plantillasSeed.test.ts`) |
| `campos.ts` | Tipo `CampoPlantilla` / `PlantillaDoc` (metadatos de formulario) | — |
| `iniciales.ts` | Valores iniciales del formulario (precedencia prefill > recordado > fecha/hora; terceros nunca) | Sí (`iniciales.test.ts`) |
| `html.ts` | Markdown → HTML de imprenta + `buildDocumentHtml` + `nombreArchivoSeguro` (con **escape**) | Sí (`html.test.ts`) |
| `generarPdf.ts` | `expo-print` (HTML → PDF) + renombrado a nombre legible | No (efectos) |
| `compartir.ts` | `expo-sharing` (hoja de compartir con el PDF) + `mailto` (texto) | No (efectos) |
| `DocumentosScreen.tsx` | Lista de plantillas (pestaña) | No (UI) |
| `RellenarScreen.tsx` | Formulario + generar/compartir/enviar | No (UI) |

## Flujo

1. **Documentos** → elegir plantilla → `/documento/<plantillaId>`.
2. `RellenarScreen` prerrellena fecha/hora (ahora) y los campos del agente recordados; los datos
   de terceros empiezan vacíos.
3. **Generar PDF**: `renderPlantilla` → `buildDocumentHtml` → `expo-print`. Se memorizan solo los
   campos del agente `recordar`. Si quedan huecos, se avisa (se imprimen como línea a rellenar).
4. **Compartir o enviar**: hoja de compartir (Mail, WhatsApp, Archivos…) con el PDF adjunto, o
   correo con la copia en texto. Todo desde el dispositivo.

También se entra desde la **ficha** ("Generar documento"): abre el boletín con norma, artículo,
importe, puntos, gravedad y hecho ya rellenos (solo campos del agente; nada de terceros).

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
