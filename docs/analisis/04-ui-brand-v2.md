# Agente — Identidad de marca y sistema visual v2 (nivel producto premium)

> Dirección de arte / marca senior. Eleva la identidad de la app (nombre provisional "Agente") a nivel **producto premium**, manteniéndola **sobria y de confianza**, **sin apariencia oficial** de ningún cuerpo. Prohibido por diseño y por ley: escudos, emblemas, coronas, laureles, banderas, denominaciones oficiales, siluetas de agente/coche patrulla.
>
> Este documento **profundiza** sobre `docs/perspectivas/02-ui.md` (sistema base ya definido: color neutro, gravedad, tipografía, `theme.ts`) y `docs/ESPECIFICACION.md` §5. **No repite** los tokens base: los da por vigentes y añade la **capa de marca**, los refinamientos de acabado "premium" y las decisiones que en 02-ui quedaron solo esbozadas (nombre, logotipo, monograma, wordmark, icono de tienda, biblioteca de componentes con especificación visual, guía de pantallas de alta fidelidad).
>
> Todo en español para la UI; identificadores de código en inglés.

---

## 0. TL;DR (30 segundos)

- **Nombre finalista recomendado: `Baliza`.** Alternativas fuertes: `Hito` y `Cotejo`. Neutros, memorables, con connotación técnica de carretera/verificación, sin símbolos de autoridad.
- **Concepto de marca**: *instrumento profesional de consulta*, no institución. Personalidad: preciso, sereno, fiable, discreto. La autoridad se transmite por **rigor visible** (artículo + fecha + fuente), no por símbolos de poder.
- **Monograma**: marca abstracta tipo **baliza/marcador** (barra vertical con nodo superior), con dos variantes de reserva (**chevron-hito** y **punto cardinal/brújula**). Cero heráldica.
- **La marca es el 90 % neutros + un único azul pizarra `#2E5AAC`.** Lo "premium" no viene de más color, sino de: hairlines de 1 px, aire (espaciado generoso), números tabulares, sombras en dos capas muy sutiles, tracking negativo en titulares y un wordmark cuidado.
- **Un solo acento no semántico** (`signal` graphite-teal `#2F6F76`) reservado a la marca y al **PK/mapa**, nunca a gravedad.
- Entrega técnica: `brand.ts` que **compone** con el `theme.ts` de 02-ui (no lo sustituye).

---

## 1. Exploración de nombre

### 1.1 Criterios de cribado

Un nombre válido para esta app debe: (a) ser **neutro** y no evocar cuerpo concreto ni autoridad; (b) evitar términos problemáticos de marca —"Policía", "Guardia", "Agente" genérico, "Placa", "Escudo", "Patrulla", "Ley" en seco—; (c) ser **corto y pronunciable** por un compañero de viva voz ("bájate la Baliza"); (d) tener connotación de **precisión / referencia / carretera / verificación**, que es el alma del producto; (e) sortear **colisiones obvias** de marca y de App Store; (f) permitir `.es`/`.app` y un handle razonable.

> Nota sobre colisiones: comprobación *mental* de choques evidentes (marcas notorias, apps conocidas, palabras vulgares). No sustituye a la búsqueda registral OEPM/EUIPO ni al despeje de dominios, que deben hacerse antes de decidir.

### 1.2 Candidatos (10–15)

| # | Nombre | Idea / connotación | Pros | Contras |
|---|---|---|---|---|
| 1 | **Baliza** | Marcador/beacon de carretera y de señalización | Técnico, abstracto, ligado a vía/PK; sonoro; buen monograma (marcador); sin autoridad | Palabra común (defensa marcaria "media"); despejar apps homónimas |
| 2 | **Hito** | Mojón kilométrico / milestone; "punto de referencia" | Cortísimo, memorable, liga con el PK (diferencial); metáfora de "referencia" | Muy común; posibles colisiones (gestión de proyectos usa "hitos"); marca débil sola |
| 3 | **Cotejo** | Acto jurídico de comparar/verificar | Distintivo, profesional, "de fiar"; poco usado en apps | Menos memorable, cuesta deletrear; suena algo severo |
| 4 | **Miliario** | Columna miliaria romana (mojón de vía) | Elegante, culto, evoca carretera y perdurabilidad; muy ownable | Obscuro para el usuario medio; largo |
| 5 | **Norte** | Punto cardinal; "tener norte", orientación | Memorable, cálido, metáfora de guía | Palabra hipercomún → alto riesgo de colisión y SEO pobre |
| 6 | **Brújula** | Orientación, criterio | Metáfora clara de guía; buen icono | Muy usada en marcas (medios, edu); cliché "orientación" |
| 7 | **Vademécum** | Manual de consulta que se lleva encima | Significa literalmente "ve conmigo"; encaja con app de bolsillo | Largo, latinismo anticuado, difícil de teclear |
| 8 | **Baremo** | Escala de importes/puntos | Liga con importe/puntos; técnico | Frío, poco marca; connota "tasación" |
| 9 | **Pauta** | Guía, criterio de actuación | Corto, neutro, profesional | Genérico; poca fuerza distintiva |
| 10 | **Cardinal** | Punto cardinal / esencial | Doble lectura (orientación + "lo esencial"); internacional | Anglo-colisión (marcas Cardinal); menos "de calle" |
| 11 | **Rumbo** | Dirección, curso de acción | Memorable, positivo, metáfora de guía | Muy usado (viajes, finanzas) |
| 12 | **Vía** | Carretera / cauce legal | Cortísimo, doble sentido tráfico+derecho | Demasiado genérico y colisionable |
| 13 | **Índex** | Índice de consulta | Idea de acceso rápido a lo que aplica | Tecnicismo anglicado; frío |
| 14 | **Deslinde** | Fijar límites con precisión (término jurídico) | Muy distintivo, culto, "precisión" | Obscuro; suena rígido |
| 15 | **Enclave** | Punto delimitado, posición | Sonoro, moderno | Sin conexión clara con el dominio |

*Descartados de partida por riesgo de marca/autoridad o connotación desafortunada:* "Agente" (genérico, débil como marca y ambiguo), "Placa"/"Escudo"/"Charol" (símbolos de autoridad), "Mojón" (vulgar en español coloquial), "Faro" (cliché saturado), "247"/"Código 10" (jerga que roza lo institucional).

### 1.3 Tres finalistas recomendados

1. **Baliza — recomendación principal.** Es lo más cercano al ideal: abstracto pero con **anclaje real en el dominio** (señalización viaria, orientación), fácil de decir y recordar, y con un **monograma natural** (el marcador). No evoca ningún cuerpo ni autoridad; comunica "señal fiable que te orienta". Marca de fuerza media-alta si se combina con un símbolo propietario y un dominio despejado (`baliza.app`, `apusar—` verificar `baliza.es`).

2. **Hito.** Ganchо emocional con el **PK** (el diferencial tangible de la app) y brevedad imbatible. Su debilidad es marcaria: al ser palabra tan común conviene reforzarla con un sufijo o lockup ("Hito ·" con el marcador) y verificar colisiones en la categoría Productividad/Referencia.

3. **Cotejo.** La apuesta más "seria y jurídica": literalmente *verificar contrastando fuentes*, que es lo que hace la app con cada ficha (artículo + fecha). Menos pegadizo, pero muy **distintivo y defendible**, y transmite rigor sin un gramo de autoridad institucional.

> Decisión sugerida: avanzar con **Baliza** como marca de trabajo y despejar registralmente los tres antes de fijar icono de tienda.

---

## 2. Concepto de marca

### 2.1 Personalidad (arquetipo)

**El instrumento de precisión.** No es un mando ni un símbolo de poder: es la herramienta fiable que un profesional lleva encima y de la que se fía. Cinco rasgos:

- **Preciso** — cada dato con su fuente y su fecha. Nada aproximado.
- **Sereno** — baja el ruido; ayuda en un momento de tensión sin añadir dramatismo.
- **Fiable** — previsible, consistente, sin sorpresas. La confianza nace de la repetición.
- **Discreto** — no llama la atención sobre sí mismo; el protagonista es el dato y el agente.
- **Respetuoso con el criterio** — orienta, nunca ordena ("procede / no procede", jamás "detén").

### 2.2 Tono de voz

- **Directo y en español llano**, con el término técnico cuando aporta ("inmovilización", "PK", "flagrancia").
- **No imperativo** en todo lo sensible (detención, sustancias): describe la norma y devuelve la decisión al agente.
- **Con fuente, siempre**: "según art. 490 LECrim", "Actualizado el 12/06/2026 · BOE-A-…".
- **Sin marketing en la calle**: cero exclamaciones, cero "¡enhorabuena!", cero gamificación. El único elogio que la app se permite es un discreto "Copiado".

### 2.3 Territorio visual (qué la hace "premium" sin ser oficial)

Lo caro no se ve, se siente. La percepción premium aquí se construye con **acabado**, no con adornos:

- **Hairlines de 1 px** (bordes `border`) en vez de sombras pesadas para separar; el detalle fino lee como cuidado.
- **Aire**: márgenes y paddings generosos, retícula de 4 pt respetada al píxel, densidad de datos *controlada* (no amontonada).
- **Números tabulares** en todo dato legal (importes, puntos, horas, PK): las cifras no bailan y transmiten instrumento de medida.
- **Tracking negativo** sutil en titulares (`-0.2 a -0.5`), tracking positivo en microetiquetas en mayúsculas → jerarquía editorial de producto serio.
- **Sombras en dos capas** muy tenues (una de contacto + una de ambiente) en vez de una sombra dura.
- **Un solo acento** propietario (`signal`) usado con extrema disciplina. La riqueza está en los grises.

### 2.4 Concepto de logotipo (wordmark + monograma)

**Logotipo = wordmark tipográfico + símbolo abstracto opcional.** Nunca escudo. El wordmark manda; el símbolo existe para el **icono de app** (donde no cabe la palabra) y para usos pequeños (favicon, marca de agua del PDF).

**Wordmark** — "Baliza" (o el nombre elegido) en una geométrica neutra de peso **600–700**, tracking `-0.5`, caja alta solo en la inicial. Se permite una geométrica de marca (Inter / Söhne / SF) **solo para el logo**, nunca para la UI (que sigue con fuentes del sistema). Colores: `brand500` sobre fondo claro, blanco sobre `brand500`, o `ink` (near-black `#0E1420`) para documentos. Prohibido rojo-gualda, verde GC, azul PN.

### 2.5 Tres conceptos de monograma abstracto (SVG)

Todos: caja de 64×64, `viewBox 0 0 64 64`, trazo redondeado, **sin heráldica**, legibles a 16 px y en una sola tinta. Van con `currentColor` para heredar `brand`/blanco/`ink`.

**Concepto A — Baliza / marcador (recomendado).** Una barra vertical con un nodo superior: la abstracción de un hito kilométrico / baliza de señalización. Lee como "punto de referencia fiable" y como una "A" estilizada si se quiere leer el nombre "Agente".

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none"
     stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
  <!-- nodo superior (la "cabeza" de la baliza / punto en el mapa) -->
  <circle cx="32" cy="16" r="7" fill="currentColor" stroke="none"/>
  <!-- fuste del marcador -->
  <path d="M32 25 V52"/>
  <!-- base / suelo -->
  <path d="M20 52 H44"/>
</svg>
```

**Concepto B — Chevron / hito ascendente.** Dos ángulos apilados que evocan un galón **abstracto** (progreso, grado) sin ser un galón militar reconocible, y a la vez la punta de un mojón. Sensación de "avance" y "orden".

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none"
     stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M16 34 L32 20 L48 34"/>
  <path d="M16 46 L32 32 L48 46"/>
</svg>
```

**Concepto C — Punto cardinal / brújula.** Un rombo/estrella de cuatro puntas reducido a lo esencial: orientación, criterio, "tener norte". Neutro y geométrico, cero simbología de autoridad.

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none"
     stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M32 8 L40 32 L32 56 L24 32 Z"/>
  <path d="M32 26 L32 38" stroke-width="6"/>
</svg>
```

**Recomendado: Concepto A (baliza/marcador)**, por su vínculo directo con el diferencial (PK/mapa), su lectura como referencia fiable y su versatilidad a tamaño mínimo. B y C quedan como reserva de sistema (p. ej. B para material de cuadrante, C para el módulo de mapa).

### 2.6 Icono de app (tienda) — reglas

- Fondo `brand500` (o `ink`) liso; símbolo **A (baliza)** en blanco, centrado, con **safe area** amplia. Sin degradados llamativos, sin bisel, sin texto.
- Variante monocroma para modo tinta y para el **watermark del PDF** (símbolo al 6 % de opacidad).
- **Prohibido** en el icono: escudo, corona, laurel, bandera, silueta de agente/coche, estrella de sheriff (requisito de revisión de Apple/Google y §10 de la especificación).

---

## 3. Sistema visual definitivo (design tokens — capa de marca y acabado)

> El sistema base (neutros, gravedad, tipografía, espaciado, radios, elevación, toques) **permanece vigente tal cual en `02-ui.md` §9 `theme.ts`**. Aquí se añade la **capa de marca** y los refinamientos "premium". Los valores de más abajo se **componen** con el tema base; no lo reemplazan.

### 3.1 Tinta de marca y acento único

| Token | HEX claro | HEX oscuro | Uso |
|---|---|---|---|
| `ink` | `#0E1420` | `#0E1420` | Tinta de marca para wordmark en documentos/PDF y titulares de máxima jerarquía |
| `paper` | `#FBFBFC` | — | Fondo "papel" ligerísimamente más cálido que `neutral50` para pantallas de lectura larga (Normativa, PDF preview). Opcional |
| `signal` | `#2F6F76` | `#5FB3BC` | **Acento único no semántico**: marca, PK/mapa, marcador de posición. **Nunca** gravedad ni estado |
| `signalBg` | `#E1EEF0` | `#12262A` | Relleno tenue del chip de PK / activo del módulo Mapa |
| `hairline` | `#E4E7EC` | `#232A33` | Borde de 1 px premium (más claro que `border`, para divisiones internas finas) |

> `signal` es un teal graphite desaturado: se distingue con claridad del azul de marca y de todos los semánticos (amarillo/naranja/rojo/verde), por lo que puede convivir sin ambigüedad. Contraste `signal #2F6F76` sobre blanco ≈ 4.9:1 (AA). Regla de disciplina: si dudas, no uses `signal`; usa neutro o `brand`.

### 3.2 Tipografía — refinamientos premium (sobre la escala base)

La escala de 02-ui (`displayL`…`caption`) no cambia. Se añaden **tracking** y un rol de microetiqueta:

| Refuerzo | Valor | Uso |
|---|---|---|
| `trackTight` | `letterSpacing: -0.5` | `displayL`, `titleXL`, `titleL` (titulares densos, look editorial) |
| `trackTeslaBody` | `letterSpacing: 0` | Cuerpo (sin tocar; legibilidad primero) |
| `trackCaps` | `letterSpacing: 0.6`, `textTransform: 'uppercase'`, tamaño 12–13, peso 600 | **Overline / microetiqueta** de sección ("NORMA", "IMPORTE", "CONSECUENCIAS"), en `textSecondary`. Aporta el aire de producto premium sin añadir color |
| `numeric` | `fontVariant: ['tabular-nums']` | Todo dato legal (ya en base; se reafirma como obligatorio) |

### 3.3 Elevación premium (dos capas)

Sustituye/afina los tokens `e1–e2` de la base para acabado más fino en claro (en oscuro se sigue prefiriendo borde + superficie):

| Nivel | Claro (dos sombras) | Nota |
|---|---|---|
| `e1` | contacto `#0E1420 @0.05, radius 1, y 1` **+** ambiente `#0E1420 @0.05, radius 10, y 4` | Tarjeta. Más suave y "flotante" que una sola sombra dura |
| `e2` | contacto `@0.06, r 2, y 1` **+** ambiente `@0.10, r 20, y 10` | FAB, toast, chip de PK elevado |
| `e3` | overlay `#0E1420 @0.55` + ambiente `@0.16, r 28, y 14` | Bottom sheet / modal |

### 3.4 Radios — matiz de marca

Se mantienen los radios base (8/12/16/24/999). Regla de acabado: **el símbolo de baliza y el chip de PK usan `radiusPill`**; las tarjetas de dato legal usan `radiusLg 16`. La coherencia del radio por tipo de contenido es parte de la firma visual.

### 3.5 `brand.ts` (tokens de marca, listos y componibles)

```typescript
// brand.ts — Capa de marca "Baliza" (nombre provisional).
// COMPONE con theme.ts de 02-ui (no lo reemplaza).
// Uso: import { brandLight, brandDark, wordmark, monogram } from './brand';
//      const t = { ...useTheme(), brand: useColorScheme()==='dark' ? brandDark : brandLight };

export const brandInk = {
  ink:   '#0E1420',   // tinta de marca (wordmark documentos, titular máximo)
  paper: '#FBFBFC',   // fondo lectura larga (opcional, sobre neutral50)
} as const;

// Acento ÚNICO no semántico. Marca + PK/mapa. NUNCA gravedad/estado.
export const signal = {
  light: { signal: '#2F6F76', signalBg: '#E1EEF0', hairline: '#E4E7EC' },
  dark:  { signal: '#5FB3BC', signalBg: '#12262A', hairline: '#232A33' },
} as const;

export const brandLight = {
  ...brandInk,
  ...signal.light,
  wordmarkColor: '#2E5AAC',   // brand500
  monogramOnBrand: '#FFFFFF',
} as const;

export const brandDark = {
  ...brandInk,
  ...signal.dark,
  wordmarkColor: '#8FB0E6',   // brand300
  monogramOnBrand: '#0A0C10',
} as const;

// Refuerzos tipográficos premium (se aplican SOBRE typography.scale de theme.ts)
export const brandType = {
  trackTight: { letterSpacing: -0.5 },
  overline: {
    fontSize: 12, fontWeight: '600' as const, lineHeight: 16,
    letterSpacing: 0.6, textTransform: 'uppercase' as const,
  },
} as const;

// Elevación premium en dos capas (iOS: usar shadowPath; Android: elevation aproximada)
export const brandElevation = {
  e1: [
    { shadowColor: '#0E1420', shadowOpacity: 0.05, shadowRadius: 1,  shadowOffset: { width: 0, height: 1 } },
    { shadowColor: '#0E1420', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  ],
  androidE1: { elevation: 2 },
} as const;

// Wordmark (uso del logo — solo geométrica de marca en el logo, NO en la UI)
export const wordmark = {
  text: 'Baliza',
  fontFamily: 'Inter',      // o Söhne / SF; solo para el logo
  fontWeight: '700' as const,
  letterSpacing: -0.5,
} as const;

// Monograma recomendado (Concepto A · baliza/marcador) como path para react-native-svg
export const monogram = {
  viewBox: '0 0 64 64',
  strokeWidth: 6,
  head:  { cx: 32, cy: 16, r: 7 },      // nodo (círculo relleno)
  stem:  'M32 25 V52',                  // fuste
  base:  'M20 52 H44',                  // suelo
} as const;
```

---

## 4. Biblioteca de componentes (especificación visual)

> Cada ficha: **acabado premium** (qué cambia respecto a 02-ui §5) + **medidas/tokens** + **estados**. Anatomía y a11y detalladas ya están en 02-ui §5; aquí se elevan y se añaden los que faltaban (celda de cuadrante, tarjeta de PK, semáforo de detención).

### 4.1 Buscador (`SearchBar`)
- **Acabado premium**: contenedor `surfaceAlt` con `hairline` 1 px (no borde grueso) y `e1` de dos capas al foco; lupa en `textSecondary`, no en color. El micrófono vive en una **pastilla circular** de 44 con `surface` para separarse del campo. Al foco, el borde pasa a `focusRing` 2 px y aparece sombra sutil.
- **Medidas**: alto 56, texto `bodyL 18`, radios `radiusMd`. Placeholder rotatorio en `textSecondary` con fade 180 ms.
- **Estados**: reposo / foco (borde marca + e1) / dictando (icono pulsa, borde `signal` no `brand`, para diferenciar "escuchando" de "activo") / con texto (aparece limpiar).

### 4.2 Chip de gravedad (`SeverityChip`)
- **Acabado premium**: pastilla `radiusPill`, relleno `bg`, texto `fg`, icono 16 en `fg`. Añadido: **micro-overline opcional** encima en pantallas densas ("GRAVEDAD"). El chip nunca lleva sombra (es información, no acción).
- **Medidas/estados**: alto 32, padding H 12, gap 6, texto `label 15/600`. Variantes `leve|grave|muyGrave|delito` (tokens de 02-ui §2.3). Regla no-negociable: color + etiqueta + icono, siempre.

### 4.3 Chip de consecuencia con fuente (`ConsequenceChip`)
- **Acabado premium**: tarjeta `radiusSm`, `hairline`, dos líneas — línea 1 `bodyStrong 16` (consecuencia + icono de objeto: grúa/candado/documento), línea 2 `caption 14` `textSecondary` con la fuente ("art. 104 LSV"). El icono toma color semántico **solo** si es coercitiva (detención → `danger`); el resto en `textSecondary`.
- **Detención (dominio sensible)**: lenguaje no imperativo ("Detención: procede según art. 490 LECrim" / "no procede salvo art. 495"). Copy fijo al pie de la sección.
- **Táctil**: pulsar abre el artículo (bottom sheet). Área ≥ 44.

### 4.4 Tarjeta de turno (`ShiftCard`)
- **Acabado premium**: `surface`, `radiusLg`, `e1` dos capas, `hairline` interior para separar la fila de contador. Overline "HOY" en `trackCaps`. Hora en `titleL` **tabular**; contador del mes en `displayL` tabular con etiqueta "Este mes" en `caption`.
- **Color de tipo de servicio**: paleta propia (mañana verde, tarde ámbar, noche índigo, saliente gris, libre outline verde) — **nunca** la de gravedad, **siempre** con etiqueta de texto. El color va como **barra lateral de 3 px**, no como fondo, para no gritar.
- **Estados**: con turno / "Libras hoy" (tono neutro-verde, icono, sin alarma).

### 4.5 Ficha de infracción (`InfractionSheet`)
- Orden fijo de 02-ui §5.5 / ESPECIFICACION §4.4. **Elevación premium**: cada bloque separado por `hairline`, con **overline** de sección ("NORMA", "IMPORTE", "TEXTO PARA EL BOLETÍN", "CONSECUENCIAS", "COMPETENCIA"). Importe en `displayL` tabular con "−50 % pronto pago" en `bodyStrong` y puntos con icono. Caja del boletín en `surfaceAlt` con botón copiar pegado. Barra de acciones sticky abajo. Pie `FooterSource` siempre presente.

### 4.6 Botón copiar boletín (`CopyBulletinButton`)
- **Acabado premium**: primario ancho, alto 52, `radiusMd`, fondo `brand`, texto `textOnBrand` `label 16/600`, icono copiar 24. Micro-scale 0.98 en press. Al copiar → cross-fade 1.200 ms a estado éxito (`success`, check, "Copiado") + háptico `notificationSuccess` + `announceForAccessibility`. Sin sombra en reposo (botón pegado a la caja); `e2` solo si flota.

### 4.7 Celda de cuadrante (`RosterCell`)
- **Anatomía premium**: cuadrado ≥ 44 (idealmente 48), `radiusSm`. Número de día arriba-izquierda `caption` tabular; **barra de color del tipo de servicio de 3 px** en el borde inferior; **abreviatura** ("N/M/T/S/L") centrada `label`; marcadores en fila inferior (punto = nota, campana = alarma, punto `danger` = festivo). Nunca solo color: color + letra + posición.
- **Estados**: hoy = borde `focusRing` 2 px; seleccionado = relleno `brand` tenue; festivo = número en `danger` + subrayado + punto rojo; fuera de mes = `textTertiary` al 40 %.
- **A11y**: label completo ("Sábado 14, turno de noche, festivo, con alarma").

### 4.8 Semáforo de detención (`DetentionStatus`)
- **Propósito**: mostrar el **resultado del árbol LECrim** (art. 490/492/493/495 + art. 33 CP) de un vistazo, con lenguaje **no imperativo** y **nunca solo color**.
- **Anatomía**: barra/tarjeta con **tres estados discretos** (no un gradiente): 
  - `procede` — indicador **verde-azulado neutro** (usar `success`), icono `check-circle`, etiqueta **"Procede la detención"** + artículo.
  - `puedeProceder` — **ámbar** (`warning`), icono `circle-alert`, etiqueta **"Puede proceder (valorar indicios y riesgo)"** + artículos 492.3/492.4.
  - `noProcede` — **rojo** (`danger`), icono `minus-circle`, etiqueta **"No procede salvo excepción"** + art. 495.
- **Regla anti-color**: cada estado lleva **posición fija** (segmentos ordenados procede→puede→no), **icono distinto** y **texto explícito**; el color es la cuarta señal, no la única. Nunca se usa un semáforo real (rojo-ámbar-verde apilado vertical que evoque autoridad); se usa una **tira de tres segmentos** con el activo resaltado.
- **Copy fijo al pie** (obligatorio): "Orientación basada en LECrim; la valoración de los indicios y del riesgo corresponde al agente."
- **Medidas**: segmento alto 56, activo con `bg` semántico + `fg`; inactivos en `surfaceAlt` + `textTertiary`. Debajo, lista de `ConsequenceChip` con las fuentes.
- **A11y**: se anuncia el resultado y su fundamento ("Puede proceder la detención; valorar indicios racionales y riesgo de incomparecencia, artículos 492.3 y 492.4 LECrim").

### 4.9 Tab bar (`TabBar`)
- 5 pestañas (Inicio · Normativa · Plantillas · Cuadrante · Mapa). **Acabado premium**: barra `surface` con `hairline` superior; activo por **color `brand` + icono relleno + etiqueta** (tres señales), inactivo `textSecondary` + icono outline. Indicador opcional: pequeña **pastilla** `surfaceAlt` bajo el icono activo (segunda señal de forma). Altura 56 + safe area.

### 4.10 Tarjeta de PK (`PkCard`)
- **Propósito**: mostrar la posición viaria calculada y copiarla / usarla en documento. Es el punto donde el acento **`signal`** vive.
- **Anatomía**: tarjeta `surface`, `radiusLg`, `e1`. Overline "POSICIÓN" `trackCaps`. Línea principal **"A-7 · PK 623+450"** en `titleL` **tabular** (números que no bailan al recalcular). Segunda línea "sentido Murcia" en `body` `textSecondary` con icono `signal` de flecha. Chip `signal`/`signalBg` "GPS ±8 m" o "Interpolado". Dos botones: **Copiar** (secundario) y **Usar en documento** (primario `brand`).
- **Estados**: calculando (skeleton + "Ajustando al tramo…"), fijado (valores en `textPrimary`), fallback sin red de PK (muestra calle y número con icono `map-pin`, sin `signal`, y nota "Sin red de PK en la zona").
- **A11y**: "Autovía A-7, punto kilométrico 623 más 450 metros, sentido Murcia, precisión 8 metros".

---

## 5. Guía de pantallas de alta fidelidad (lista para maquetar)

Retícula: ancho de contenido con **16 px** de margen lateral; separación entre bloques **12–16**; safe areas respetadas; tab bar 56 + inset. Modo por defecto: sigue el sistema (oscuro de noche).

### 5.1 Buscar (Inicio)
Cabecera fina: saludo "Hola, agente" (`titleM`) + subtítulo "Guardia Civil · Murcia" (`caption` `textSecondary`), y a la derecha icono de ajustes (24, área 44). Debajo, **`SearchBar` grande (56)** ocupando todo el ancho, con placeholder rotatorio ("faro roto", "sin seguro", "móvil…"). Bajo el buscador, fila de **accesos rápidos** (4–6 chips outline con icono `signal`/neutro, `radiusMd`, alto 44). Después, **`ShiftCard`** (turno de hoy + contador del mes). A continuación dos secciones con **overline**: "MÁS USADAS EN TU CUERPO" (lista de 3–5 filas pulsables con título + `SeverityChip` a la derecha) y "TUS FAVORITAS". Si hay novedades normativas, **banner** discreto arriba (fondo `infoBg`, borde izquierdo 3 px, icono `bell`, "2 cambios desde tu última visita"). Sin carruseles, sin ilustraciones.

### 5.2 Ficha
Barra superior con flecha atrás + acciones (favorito `star`, compartir `share-2`). Título corto `titleL` `trackTight`. Debajo, **overline "NORMA"** + "RGV art. 11.1 · Anexo I" (`bodyStrong` `textSecondary`). Fila de chips: `SeverityChip` + chip tipo (administrativa/penal, outline). Bloque **"IMPORTE"**: cifra grande `displayL` tabular, "con pronto pago (−50 %): 50 €" y "Puntos: −3" con iconos. Bloque **"TEXTO PARA EL BOLETÍN"**: segmented control de variantes (delantero/trasero) + caja `surfaceAlt` con texto `bodyL 18` seleccionable + **`CopyBulletinButton`** pegado. Bloque **"CONSECUENCIAS"**: lista de `ConsequenceChip` con fuente. Bloque **"COMPETENCIA"**: chips outline. Acordeón "Ver artículo completo" + "Abrir en BOE". **Barra sticky** inferior: Copiar · Favorito · Generar documento · Compartir. **`FooterSource`** al final. Todo separado por `hairline`.

### 5.3 Cuadrante
Cabecera con mes/año (`titleL` tabular) + flechas ‹ ›, y a la derecha "Hoy" (vuelve al mes actual). **Cuadrícula 7×7** de `RosterCell` (≥ 44), con cabecera de días L-M-X-J-V-S-D en `caption`. Bajo la cuadrícula, **resumen mensual** en tres tarjetas pequeñas (`surface`, `e1`): "Totales 148 h", "Nocturnas 40 h", "Festivas 16 h", todas en `displayL`/`titleM` tabular con overline. Botón "Exportar mes" (secundario). Al tocar un día → bottom sheet de edición (tipo de servicio, cambio, nota, alarma). Festivos y hoy marcados como en §4.7.

### 5.4 Mapa / PK
Mapa a pantalla completa (MapLibre, teselas OSM), con **marcador `signal`** en la posición GPS. **`PkCard`** flotante abajo (§4.10) con `e2`, ocupando el ancho menos 16 de margen. Botón flotante de recentrar (FAB circular 48, `surface`, icono `locate`, `e2`) sobre la esquina. Al pulsar "Usar en documento" → navega a Plantilla con el PK autocompletado. Sin cromo institucional; el mapa es neutro (estilo claro/oscuro según tema).

### 5.5 Plantilla / PDF
Lista de tipos de documento (boletín, acta de inmovilización, acta de intervención, diligencia de identificación, lectura de derechos, información a la víctima) como filas con icono `file-text` y `chevron`. Al elegir → **formulario** con secciones (overline): "DATOS FIJOS" (norma, artículo, texto legal, importe — rellenados y en `textSecondary`, no editables) y "COMPLETA TÚ" (fecha, hora, **lugar con botón 'Traer PK'**, vehículo/persona con **aviso `infoBg` 'Solo en este dispositivo, no se envía'**, observaciones). Botón primario **"Generar PDF"**. Tras generar → **previsualización** (fondo `paper`, watermark de monograma al 6 %, encabezado neutro en texto) con acciones: Guardar · Compartir · Enviar a mi correo. Nota al pie: el escudo oficial solo si el agente lo sube desde su galería.

### 5.6 Semáforo de detención
Se llega desde una ficha penal ("¿Procede detención?"). Cabecera con el delito y su gravedad CP (`SeverityChip` variante `delito` + chip "menos grave / grave" derivado del art. 33 CP). Debajo, **`DetentionStatus`** (§4.8): tira de tres segmentos (Procede / Puede proceder / No procede) con el activo resaltado por color + icono + texto + posición. Debajo, **lista de fundamentos** (`ConsequenceChip` con art. 490/492/493/495). **Copy fijo** al pie en `caption` `textSecondary`: "Orientación basada en LECrim; la valoración de los indicios y del riesgo corresponde al agente." Ninguna palabra imperativa en toda la pantalla. `FooterSource` con la fecha de actualización.

---

## 6. Iconografía y motion

### 6.1 Iconografía (recomendación)
- **Set: Lucide** (primario), licencia ISC, trazo de línea uniforme (grosor 2, redondeado), paquete oficial RN (`lucide-react-native` + `react-native-svg`). Motivo: claridad técnica sobria, cobertura del dominio (grúa, candado, alerta, mapa, documento, copiar, micrófono), coherente con "instrumento profesional". Tamaño base 24; 16 en chips; 28 en cabeceras. Color `currentColor`.
- **Refuerzo de estados con Phosphor** *solo si* se necesita `fill` para tab activo/inactivo; **no mezclar** ambos sets en el resto de la UI.
- **Mapa de conceptos** (ya en 02-ui §6.3): objeto/acción, nunca autoridad. Detención con `handcuffs` (Phosphor) o `link` estilizado + lenguaje no imperativo; delito con `gavel`, nunca escudo. **Prohibido**: escudo, estrella de sheriff, gorra, coche patrulla, emblemas nacionales.

### 6.2 Motion mínimo
Principio: **el movimiento confirma, no entretiene**. Respeta reduce-motion. Duraciones: `100 ms` press, `180 ms` fade de chips/placeholder, `240 ms` transiciones y bottom sheet. Curvas `easeStd (0.2,0,0,1)` entradas, `easeOut (0,0,0,1)` salidas. Preferir transform (opacity/translate/scale). **Interacción clave** — copiar boletín: háptico + cross-fade a "Copiado" 1.200 ms + anuncio a11y. Micrófono escuchando: pulso de onda con borde `signal`. Resultados: fade+translate 8 px, stagger 20 ms, tope 240 ms. Nada más; sin parallax, sin splash animado.

---

## 7. Cómo transmitir "serio y de fiar" sin parecer oficial

La palanca es **estética de instrumento, no de institución**. En concreto:

1. **Rigor visible antes que símbolo de poder.** Cada ficha lleva artículo, fecha y fuente citada (`FooterSource` fijo). La confianza nace del dato trazable, no de un escudo. Este es el sustituto legítimo de la "autoridad" visual.
2. **Paleta fría y desaturada + 90 % neutros.** Azul pizarra `#2E5AAC` como único color de marca, deliberadamente sin bandera. Un solo acento propietario (`signal`) para el PK. Cero rojo-gualda, verde GC o azul PN.
3. **Retícula estricta y densidad controlada.** Aire, hairlines de 1 px, alineación al píxel, números tabulares: lenguaje de herramienta de precisión (más cercano a una app de referencia técnica/legal que a una web institucional).
4. **Tipografía del sistema, jerarquía por tamaño y peso.** Sin fuentes decorativas, sin degradados, sin ilustraciones humanas ni fotos de policía. El wordmark propio se reserva al logo.
5. **Lenguaje no imperativo y sin marketing.** "Procede / puede proceder / no procede", nunca "detén". Sin gamificación, sin pop-ups de valoración en la calle. El único feedback afectivo es un discreto "Copiado". Y, por diseño y por revisión de tienda: **cero escudos, emblemas, banderas, coronas, laureles o denominaciones oficiales** en nombre, icono, iconografía, capturas y plantillas por defecto.

---

## 8. Checklist de marca (para QA, además del de accesibilidad de 02-ui §10)
- [ ] Ni el nombre, ni el icono, ni las capturas contienen escudo/emblema/bandera/corona/laurel/denominación oficial.
- [ ] Colisión de nombre despejada en OEPM/EUIPO y en las tiendas antes de fijar el icono.
- [ ] Un único color de marca (`brand`) + un único acento (`signal`) restringido a PK/mapa/marca; jamás en gravedad/estado.
- [ ] Wordmark solo con la geométrica de marca; UI siempre con fuente del sistema.
- [ ] Watermark del PDF = monograma al 6 %, encabezado neutro en texto; escudo solo si lo sube el usuario.
- [ ] Semáforo de detención: nunca solo color, siempre posición + icono + texto + copy no imperativo con fuente.
