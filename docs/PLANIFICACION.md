# Agente — Planificación maestra

> Documento de síntesis. Une la especificación (`ESPECIFICACION.md`, fuente de verdad) con el
> análisis de siete perspectivas (`perspectivas/`) y las decisiones tomadas (`DECISIONES.md`).
> Fecha: 2026-09-03. Estado: **Fase 0 — cimientos**.

---

## 1. Qué estamos haciendo (en tres frases)

Una app para agentes de las FCSE de España que responde, en la calle y sin cobertura, a la
pregunta operativa real: **"veo esto — ¿qué artículo es, cuánto es, y qué hago con el
vehículo/la persona?"** Y que después les ahorra el trabajo de oficina con una **plantilla de
denuncia rellenada** y les gestiona su **cuadrante** sin perder datos. Sustituye a SPPLB
haciéndolo bien donde SPPLB falla: contenido que resuelve (no solo el artículo), cuadrante
fiable y actualización demostrable.

### El bucle central (validado por el fundador agente)

```
  Ve una infracción (ej. luna/faro roto)
        │
        ▼
  Busca en lenguaje de calle ("luna rota")  ── sin cobertura, una mano, 3 s
        │
        ▼
  FICHA:  artículo · importe (con pronto pago) · puntos
          └─▶ CONSECUENCIA: ¿grúa/inmoviliza o sigue circulando?  ◀── lo decisivo
        │
        ├─▶ [Copiar boletín]  (texto listo, 2 toques, sin scroll)
        ├─▶ PK / carretera del hecho  (mapa offline → "A-7, PK 623+450, sentido Murcia")
        └─▶ [Generar documento] → plantilla PDF rellenada
                     │
                     ▼
             Se la envía a su correo (compositor nativo) → la registra en oficina
        ─────────────────────────────────────────────
  Y aparte:  CUADRANTE  (turnos, nocturnas, festivos, horas) que NO se borra
```

---

## 2. Convergencia de las siete perspectivas

Siete análisis independientes (UX, UI, marketing, competencia, Policía Local, Guardia Civil,
Policía Nacional) coinciden en lo mismo. Esto da mucha confianza sobre dónde poner el esfuerzo:

| Hallazgo convergente | Quién lo dijo | Implicación |
|---|---|---|
| **La ficha debe dar la consecuencia operativa** (grúa/inmoviliza/detención), no solo el artículo | Local, GC, Nacional, UX, Competencia | Es el diferencial #1. Va sobre el pliegue. |
| **Cuadrante fiable = batalla de la retención** (SPPLB pierde datos) | Todos | Separar patrón generado de excepciones manuales (sagradas). Guardado atómico. |
| **Cuenta diferida / sin login** | UX y Marketing (y confirma la intuición del fundador) | ADR-001. Menos fricción, menos RGPD. |
| **El buscador ES el producto** | UX | Home = "Buscar". Ranking con jerga de calle. |
| **Actualización visible con fecha y fuente por norma** | GC, Competencia | Combatir el pecado de SPPLB. Fecha en cada ficha. |
| **Ordenanzas municipales** son la razón de pago del policía local | Local | Modelo por capas + "mi ordenanza personal" editable. |
| **PK offline de verdad**, con indicador de fiabilidad y edición manual | GC, UX | Nunca inventar un PK falsamente preciso: avisar. |
| **Lenguaje orientativo, nunca imperativo** en detención | Nacional, spec | "Procede según art. X", con pie fijo. Semáforo con texto. |
| **Boca a boca es el canal**; sindicatos con pinzas (SPPLB es de un sindicato) | Marketing | El fundador agente es el vendedor. Referidos instrumentados. |

---

## 3. Posicionamiento y diferenciación

**Propuesta de valor (una frase):** *"El boletín correcto, con su artículo e importe, en 3
segundos y sin cobertura. Siempre al día."*

**Frente a SPPLB (gratis):** SPPLB solo te da el artículo, tiene el cuadrante roto y la versión
iOS está abandonada (Android sí se mantiene — no exagerar este punto). Agente te dice **qué
hacer** (importe + puntos + consecuencia + texto listo), tiene cuadrante que no se borra y
demuestra su actualización con fecha y fuente por norma.

**Foso defensivo (por orden de construcción):**
1. Ficha "qué hago" con consecuencia y fuente. *(barato, altísimo valor)*
2. Buscador de jerga de calle que se automejora con las búsquedas sin resultado. *(barato)*
3. Cuadrante fiable con contador de horas. *(medio)*
4. Pipeline de contenido siempre al día. *(el trabajo de fondo continuo)*
5. Plantillas PDF rellenadas + mapa con PK. *(caro, segunda ola, difícil de copiar)*

---

## 4. Arquitectura (resumen; detalle en DECISIONES.md)

- **App:** Expo + React Native + TypeScript. Navegación propuesta: **Buscar · Normas ·
  Documentos · Cuadrante · Más** (Mapa baja a apoyo contextual — ADR-003).
- **Offline:** expo-sqlite + FTS5. El contenido llega como **paquete SQLite firmado** por
  `ContentVersion` y se sustituye atómicamente.
- **Sin login (ADR-001):** perfil, favoritos y cuadrante en el dispositivo. Pagos por la
  tienda con RevenueCat (id anónimo). Backend mínimo (ADR-002): CDN de contenido + panel
  admin + analítica anónima.
- **Modelo de datos:** implementado como esquemas Zod en `packages/shared` (fuente única de
  tipos para app, admin y pipeline).
- **Contenido:** `packages/content-pipeline` (BOE/DGT → validación → SQLite firmado).
- **Reglas no negociables:** ver `CLAUDE.md` (sin datos de terceros al servidor, fuente+fecha
  en todo, offline, sin escudos oficiales, lenguaje orientativo, tests obligatorios).

---

## 5. Roadmap por fases (ajustado a los hallazgos)

El orden prioriza que la beta tenga algo **útil de verdad** pronto y que el feedback llegue
mientras se construye el resto. Cambios respecto a la spec marcados con ⚑.

### Fase 0 · Cimientos *(en curso)*
- ✅ Monorepo pnpm con `apps/*` y `packages/*`.
- ✅ `packages/shared`: esquemas Zod del modelo de datos + validadores de calidad + tests.
- ✅ Documentación: especificación, perspectivas, decisiones, planificación.
- ⬜ App Expo vacía con navegación de 5 pestañas y tema (claro/oscuro) del sistema visual.
- ⬜ Panel admin Next.js mínimo (CRUD de infracciones y sinónimos).
- ⬜ CI (lint, typecheck, test) en GitHub Actions. Sentry.
- ⚑ **Sin auth** en Fase 0 (antes E-02). Onboarding = perfil local (cuerpo/territorio).

### Fase 1 · Consulta de tráfico *(la que engancha)*
- Pipeline BOE para **LSV, RGC, RGV** + parseo del codificado DGT.
- Paquete SQLite + descarga y verificación de firma en app.
- **Buscador** FTS5 + sinónimos + ranking con jerga de calle + búsqueda por voz.
- **Ficha completa**: importe/pronto pago/puntos, texto de boletín copiable con variantes,
  **consecuencia con fuente** (grúa/inmoviliza), fecha y fuente visibles.
- Favoritos, "más usadas", novedades, evento anónimo de "búsqueda sin resultado".
- **Entrega beta 1** a la unidad del cofundador (Guardia Civil de Tráfico, según marketing).

### Fase 2 · Resto de normativa y capa penal
- LO 4/2015, Código Penal + **LECrim con árbol de detención** (orientativo, con fuente),
  extranjería, menores, armas, animales, transportes, VMP.
- Tabla de sustancias. Lectura de derechos multilingüe. Sección Vehículos.
- **Entrega beta 2.**

### Fase 3 · Cuadrante *(en paralelo desde antes; es retención)*
- Patrones por cuerpo (6+saliente+3, 7x7, locales), **excepciones manuales sagradas**,
  festivos por territorio, contador de nocturnas/festivas, exceso sobre jornada configurable
  (no 37,5 h genéricas — GC lo exige), export para cotejar nómina, backup opcional cifrado.

### Fase 4 · Plantillas/PDF y mapa/PK
- Motor de plantillas Markdown + variables, PDF en dispositivo, envío por correo nativo.
- Mapa offline por provincia, proyección GPS→PK con **indicador de fiabilidad** y edición
  manual, integración con las plantillas.

### Fase 5 · Lanzamiento
- RevenueCat (mensual 2,99 € / anual 24,99 € destacado / prueba 14 días / freemium 5
  consultas-día), pantalla de pago, restaurar compras, códigos beta.
- Landing, política de privacidad, borrado de datos, fichas de tienda (sin escudos),
  revisión Apple/Google. Ordenanzas de los municipios beta.

### Fase 6 · Después
- Estimación de complementos salariales, audio de derechos, más territorios, widgets de turno.

---

## 6. Estrategia de mercado (resumen; detalle en perspectivas/03-marketing.md)

- **Mercado:** ~233.000–250.000 agentes (PN ~75k, GC ~74k, local ~65k). 2.500 subs ≈ 1 %.
- **Precio (decisión del fundador — ADR-005): mensual 2,99 € como protagonista.** Estrategia
  **volumen sobre ARPU**: "3 cafés al mes", se paga sin fricción y el objetivo es que la tenga
  el máximo número de agentes posible. El anual (p. ej. 24,99 €) queda como opción secundaria
  y discreta para quien lo pida, no como opción destacada. Prueba de 14 días + freemium de 5
  consultas/día como muro de conversión. A 2,99 €, 2.500 subs ≈ 6.000–7.000 €/mes tras
  comisiones de tienda; la palanca es el número de agentes que la adoptan, no el precio.
- **Captación priorizada:** (1) el cofundador agente vende a su unidad (CAC≈0); (2) grupos de
  WhatsApp/Telegram de compañeros; (3) referidos instrumentados; (4) academias de oposición;
  (5) sindicatos al final y con neutralidad estricta. Único paid: Apple Search Ads sobre marca.
- **Segmentación:** GC Tráfico → Policía Local (municipio a municipio) → Nacional → autonómicas.
  Territorio inicial: Murcia y Canarias (boca a boca físico concentrado).

---

## 7. Riesgos principales y mitigación

| Riesgo | Mitigación |
|---|---|
| Contenido desactualizado (el fallo de SPPLB) | Pipeline automático + cola de revisión + fecha/fuente visible por ficha |
| Error en importe o consecuencia | Validadores de rango (`shared/validators`), revisión a dos ojos, "reportar error" en la ficha |
| Responsabilidad por orientación de detención | Reglas con artículo, lenguaje orientativo, pie fijo, sin imperativo |
| Lanzar con menos temario que SPPLB → pierde "la más completa" | Paridad mínima de temario antes del lanzamiento público; beta con lo que engancha |
| Expectativa de "gratis" que fija SPPLB | Discurso "pagas la herramienta, no la ley"; freemium que retiene |
| PK incompleto en algunas zonas (autonómicas) | Fallback a dirección; priorizar provincias beta; nunca fingir precisión |
| Sobrecarga del fundador técnico | Una épica por sesión; cada fase entrega algo usable |

---

## 8. Próximos pasos inmediatos (cuando exista el repo)

1. Crear el repositorio **privado** en GitHub y subir este scaffold (Fase 0).
2. `pnpm install` y verificar `pnpm -F @agente/shared test` en verde.
3. Confirmar las decisiones abiertas clave: **ADR-001 (sin login)** y **ADR-003 (navegación)**.
4. Arrancar la app Expo vacía con las 5 pestañas y el `theme.ts` del sistema visual
   (`perspectivas/02-ui.md`).
5. Empezar Fase 1 por el cliente del BOE y el parser XML → artículos (mostrar el RGC antes de
   seguir, según el guion del Apéndice B de la especificación).

> Regla de oro (del CLAUDE.md): cuando la realidad choque con un documento, gana la realidad;
> se corrige el documento y se sigue.
