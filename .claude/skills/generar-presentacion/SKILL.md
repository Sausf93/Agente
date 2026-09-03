---
name: generar-presentacion
description: >-
  Regenera el PDF de presentación del proyecto a partir de su HTML, con máxima fidelidad, usando
  Chrome headless. Úsala cuando el usuario quiera actualizar, regenerar o exportar la
  presentación para el cofundador (docs/presentacion), o pida "haz el PDF" de la presentación.
---

# Generar el PDF de la presentación

La presentación se edita en HTML (autocontenido, sin recursos de red, SVG inline) y se exporta a
PDF A4 con Chrome headless.

## Fuente y salida
- HTML fuente: `docs/presentacion/presentacion.html` (o el que indique el usuario).
- PDF de salida: `docs/Agente-Presentacion.pdf`.

## Pasos

1. **Edita el HTML** si hay cambios. Reglas: un solo archivo, sin `<link>` externos ni CDNs,
   fuentes del sistema, todo el CSS inline, `@page { size:A4 }`, saltos con `page-break-before`,
   y `html{ print-color-adjust:exact; -webkit-print-color-adjust:exact; }`. Nada debe solaparse.

2. **Renderiza a PDF** con Chrome headless (Windows):
   ```bash
   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
     --no-pdf-header-footer \
     --print-to-pdf="C:/Users/Saulo.Santacruz/Desktop/AppPolicia/docs/Agente-Presentacion.pdf" \
     "file:///<ruta-absoluta-del-html>"
   ```

3. **Verifica visualmente**: haz una captura de página completa con Playwright
   (`p.chromium.launch(channel="chrome")`, viewport ancho, `page.screenshot`) y revisa que los
   bocetos y textos no se solapen ni se corten. Corrige y repite si hace falta.

4. **Entrega**: envía el PDF al usuario con `SendUserFile` y borra los PNG temporales de
   verificación.

## Nota
Si no hay `pypdf`/`pdfplumber` instalados, verifica con la captura de Playwright en vez de
extraer texto del PDF.
