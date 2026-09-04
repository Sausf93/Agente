# src/features

Lógica y componentes por **dominio funcional**, no por tipo de archivo. Cada
feature agrupa su UI, su estado (Zustand) y sus consultas a datos. La navegación
(rutas) vive en `app/` (Expo Router) y solo compone estas features.

Previsto (lo construye `mobile-dev` a partir de la Fase 1):

- `buscar/` — buscador FTS5 + ranking (jerga de calle) + voz. Es el núcleo.
- `normas/` — navegación del articulado, favoritos, novedades.
- `documentos/` — plantillas → PDF en dispositivo (expo-print) + envío nativo.
- `cuadrante/` — patrón + excepciones manuales sagradas + contador de horas.
- `mas/` — mapa/PK, lectura de derechos, sustancias, vehículos, ajustes, suscripción.

Reglas transversales (ver `CLAUDE.md`):
- Ningún dato de terceros sale del dispositivo.
- Toda ficha muestra artículo fuente + fecha.
- Lenguaje orientativo (nunca imperativo) en consecuencias sensibles.
- Tipos siempre desde `@agente/shared` (fuente única).
