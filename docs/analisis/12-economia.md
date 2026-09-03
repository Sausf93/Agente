# Economía del proyecto: ingresos, costes y beneficio

> Estimaciones para alinear a los dos socios. Cifras redondeadas y **conservadoras**; marcadas
> como estimación. No incluye impuestos propios (IRPF/IS), que dependen de la forma jurídica.
> Precio decidido: **2,99 €/mes** (ADR-005). Fecha: 2026-09-03.

## 1. Cuánto nos llega por cada suscriptor

El agente paga **2,99 €/mes**, pero no nos llega entero:

| Concepto | Se lleva | Nos queda (aprox.) |
|---|---|---|
| Precio que paga el agente | — | 2,99 € |
| IVA (lo gestiona la tienda, 21 %) | ~0,52 € | 2,47 € |
| Comisión de la tienda (15 % pequeña empresa) | ~0,37 € | **~2,10 €** |
| RevenueCat (~1 % a partir de cierto volumen) | ~0,02 € | ~2,08 € |

**Nos quedan ~2,10 € por suscriptor y mes** (escenario conservador). En el mejor caso (según cómo
compute la tienda el IVA) puede acercarse a **~2,54 €**. Usamos **2,10 €** para no engañarnos.

## 2. Qué cuesta mantener la app (¡muy poco!)

Es lo importante: la app es **local-first** (el contenido vive en el móvil), **sin cuentas** y el
**cobro lo gestiona la tienda**, así que no hay servidores caros ni pasarela de pago que mantener.

### 2.0 Lo REALMENTE obligatorio (el mínimo para lanzar y mantener)

| Coste imprescindible | Importe |
|---|---|
| Cuenta de desarrollador **Apple** | 99 €/año (~8 €/mes) |
| Cuenta de desarrollador **Google Play** | 25 € **una sola vez** |
| **Política de privacidad** publicada (la exigen las tiendas) | **0 €** (GitHub Pages) |
| **Total real para arrancar y mantener** | **≈ 8 €/mes** |

**Todo lo demás de la tabla siguiente es OPCIONAL y tiene plan gratuito**: solo empiezas a pagar
cantidades pequeñas **si la app crece** (y para entonces ya estás ingresando). RevenueCat es
gratis hasta ~2.500 $/mes de ingresos; Supabase, Sentry y el CDN tienen plan gratis; el correo es
~0 € porque no hay cuentas. Es decir: **para empezar es prácticamente solo Apple.**

| Coste (mensual, en efectivo) | Arranque/beta | A escala (~2.500 subs) |
|---|---|---|
| Cuenta de desarrollador Apple (99 €/año) | ~8 € | ~8 € |
| Cuenta Google Play (25 € una vez) | ~0 € | ~0 € |
| Backend / base de datos (Supabase) | 0 € (gratis) | ~25 € |
| CDN del contenido (paquete pequeño) | ~0 € | ~10 € |
| Correo transaccional | ~0 € (¡sin cuentas!) | ~0-10 € |
| RevenueCat (gestión de suscripciones) | 0 € (gratis) | ~50-70 € |
| Errores/monitorización (Sentry) | 0 € (gratis) | ~26 € |
| Dominio + landing | ~2 € | ~2 € |
| **Total en efectivo** | **~15-40 €/mes** | **~130-180 €/mes** |
| *(Opcional) gestoría si montáis una S.L.* | — | *~60-80 €/mes* |

> **El coste real no es dinero, es tiempo:** desarrollar la app (lo pone el socio técnico) y
> mantener el contenido al día (lo cura el socio agente). En efectivo, son **decenas de euros al
> mes**. Por eso casi todo lo que entra es **beneficio a repartir entre los dos**.

**Punto de equilibrio:** con **~15-20 suscriptores** ya se cubren los costes en efectivo. A partir
de ahí, todo suma.

## 3. Cuánto ganamos (beneficio neto, a repartir entre dos)

Ingreso neto por sub ≈ **2,10 €/mes** (conservador). Restados los costes en efectivo:

| Suscriptores | % de los ~250.000 agentes | Ingreso neto/mes | − costes | **Beneficio/mes** | **Para cada socio** |
|---:|---:|---:|---:|---:|---:|
| 100 | 0,04 % | 210 € | 30 € | 180 € | **~90 €** |
| 250 | 0,10 % | 525 € | 30 € | 495 € | **~248 €** |
| **500** | **0,20 %** | 1.050 € | 50 € | 1.000 € | **~500 €** ✅ |
| 1.000 | 0,40 % | 2.100 € | 90 € | 2.010 € | **~1.005 €** |
| 2.500 | 1,0 % | 5.250 € | 180 € | 5.070 € | **~2.535 €** |
| 5.000 | 2,0 % | 10.500 € | 300 € | 10.200 € | **~5.100 €** |

> **El triunfo está cerca:** con **~500 suscriptores —el 0,2 % de los agentes de España— ya son
> ~500 € al mes para cada uno.** Y eso es un escenario pequeño: hablamos de 5 de cada 1.000
> agentes. En el mejor caso (2,54 €/sub), 2.500 subs son **~3.000 € al mes para cada socio**.

## 4. Inversión inicial (una vez)

- Cuenta Apple 99 € + Google 25 € = **~124 €**.
- Diseño de marca/icono: **0 €** (lo hacemos nosotros).
- Desarrollo: **tiempo** del socio técnico (0 € en efectivo).
- (Opcional) constituir S.L. y acuerdo de socios: unos cientos de € si se hace con gestoría;
  no hace falta para arrancar la beta, sí antes de facturar en serio.

**Riesgo económico a la baja: casi nulo.** Se puede lanzar gastando ~120 € y unos euros al mes.

## 5. Supuestos y avisos

- Neto por sub 2,10 € = 2,99 € − IVA 21 % − comisión 15 %. Si Apple aplica su programa de pequeña
  empresa y el cómputo de IVA es más favorable, sube hacia 2,54 €.
- Comisiones de tienda a fecha 2026 (15 % pequeña empresa / suscripciones); **revisar antes de
  lanzar** por si cambian.
- No incluye **impuestos propios** (IRPF/IS) sobre el beneficio: dependen de la forma jurídica.
- El churn (bajas) obliga a **reponer** suscriptores cada mes; las cifras son de suscriptores
  *activos* sostenidos (ver embudo en `05-marketing-v2.md`).
- Todo son **estimaciones** para decidir, no contabilidad.
