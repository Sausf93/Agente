# Estado del proyecto y traspaso de contexto

> Documento para **no perder contexto** (p. ej. tras formatear el PC o en una sesión nueva).
> Resume qué es, qué se ha decidido, qué está hecho y cómo retomar. Fecha: 2026-09-03.

## Qué es
**Agente** (nombre provisional): app móvil para las Fuerzas y Cuerpos de Seguridad de España que
sustituye a la app SPPLB. En la calle y sin cobertura te dice, ante una infracción: **qué
artículo, cuánto (importe/puntos), qué haces con el vehículo/persona (grúa/inmovilización/
detención), dónde fue (PK)** y te deja la **denuncia lista** y el **cuadrante**. Fuente de verdad
del producto: [`ESPECIFICACION.md`](ESPECIFICACION.md).

## Socios
- **Socio técnico** (usuario): construye y publica. Trabaja por cuenta ajena; tiene 036/400 (IGIC
  Canarias). GitHub: `Sausf93`.
- **Socio agente**: Guardia Civil. Aportó la idea, cura el contenido y vende (boca a boca).

## Estado actual: Fase 0 (cimientos) — hecho
- Monorepo pnpm: `apps/` (vacío aún), `packages/shared`, `packages/content-pipeline`.
- **`packages/shared`**: modelo de datos completo en Zod (contenido, usuario, cuadrante de dos
  capas, multi-territorio) + validadores de calidad. **24 tests en verde.**
- Documentación completa en `docs/` (ver índice abajo).
- Equipo del proyecto en `.claude/`: **8 agentes + 3 skills**.
- **Aún no empezado:** la app Expo (`apps/mobile`), el panel (`apps/admin`), el pipeline real de
  contenido, y la infraestructura/CI.

## Decisiones clave (detalle en [`DECISIONES.md`](DECISIONES.md))
- **ADR-001 · Sin login (local-first):** perfil, favoritos y cuadrante en el dispositivo; pagos por
  la tienda con RevenueCat (id anónimo). Nunca salen datos de terceros del móvil.
- **ADR-002 · Backend mínimo:** CDN de contenido + panel admin + analítica anónima. Sin Auth en v1.
- **ADR-003 · Navegación:** Buscar · Normas · Documentos · Cuadrante · Más (Mapa/PK contextual).
- **ADR-004 · Ficha:** consecuencia operativa y botón "Copiar boletín" sobre el pliegue.
- **ADR-005 · Precio: 2,99 €/mes protagonista** (volumen sobre ARPU; "3 cafés"). Anual discreto.
- **ADR-006..009 · Multi-territorio:** contenido por capas Estado→Comunidad→Municipio; el perfil
  ve su cadena territorial; `desplazaId` para sustituir/añadir; competencia como aviso (no filtro);
  un solo paquete SQLite filtrado en cliente; "mi ordenanza personal" en tabla local. **Ya en
  código** (`packages/shared/src/territorio.ts`, `content.ts`, `enums.ts`).

## Economía (detalle en [`analisis/12-economia.md`](analisis/12-economia.md))
- Neto ≈ **2,10 €/sub** (2,99 − IVA 21 % − comisión tienda 15 %).
- **Coste real obligatorio ≈ 8 €/mes** (Apple 99 €/año + Google 25 € único + política de privacidad
  gratis). Lo demás (backend, RevenueCat, Sentry, CDN) es gratis al inicio.
- **Punto de equilibrio ~15-20 subs. Inversión inicial ~124 €.**
- Beneficio a repartir: **500 subs (0,2 %) ≈ 500 €/mes cada uno**; 2.500 (1 %) ≈ 2.535 € cada uno.

## Fiscal/societario (detalle en [`analisis/13-estructura-fiscal-societaria.md`](analisis/13-estructura-fiscal-societaria.md))
- Arranque: **el socio técnico factura como autónomo** (036/400 + alta RETA); reparto declarado;
  **S.L.** cuando se supere ~1.500 €/cabeza.
- ⚠️ **Pendiente crítico:** resolver la **incompatibilidad del socio Guardia Civil** (Ley 53/1984 +
  régimen GC) con asesoría jurídica **antes** de asociarlo/facturar. Consultar todo con una gestoría.

## Competencia (SPPLB)
Datos verificados (iOS): v2.5.5, parada desde 2-nov-2023, 3,29★/121 reseñas, dev Antonio Puche
Bañón (sindicato de policía local). Android sí se mantiene, misma UI/fallos. Debilidades: solo da
el artículo, cuadrante roto, contenido incoherente, UI 2017. Detalle en `analisis/01-spplb-teardown.md`.

## Cómo retomar (siguiente sesión)
```bash
pnpm install
pnpm -F @agente/shared test   # deben salir 24 tests en verde
```
Luego, por orden:
1. Invocar el agente **`arquitecto-software`** para marcar los cimientos de `apps/mobile` (Expo +
   estructura + estrategia offline/estado/datos) y del pipeline.
2. **Fase 1 · Tráfico** (el MVP que ya gana): pipeline BOE para LSV/RGC/RGV + codificado DGT,
   buscador FTS5 + sinónimos, ficha completa con consecuencia, cuadrante GC fiable.
3. Validar con `revisor-juridico` (contenido) y `qa-testing` (pruebas) antes de cada entrega.

## Índice de documentación
- [`ESPECIFICACION.md`](ESPECIFICACION.md) — fuente de verdad del producto.
- [`PLANIFICACION.md`](PLANIFICACION.md) — plan maestro y roadmap.
- [`DECISIONES.md`](DECISIONES.md) — ADRs.
- [`LEGAL-PLAGIO-Y-RESPONSABILIDAD.md`](LEGAL-PLAGIO-Y-RESPONSABILIDAD.md)
- [`Agente-Presentacion.pdf`](Agente-Presentacion.pdf) — presentación (19 págs) para el socio.
- [`analisis/00-SINTESIS.md`](analisis/00-SINTESIS.md) — síntesis del análisis profundo.
- `analisis/01`…`13` — teardown, estrategia, UX/UI/marca, marketing, motor de contenido, cuadrante,
  multi-territorio, competencias, economía, fiscal.
- [`perspectivas/`](perspectivas/) — UX, UI, marketing, competencia y las 3 perspectivas de cuerpo.
- Equipo: `.claude/agents/` (8 agentes) y `.claude/skills/` (3 skills).
