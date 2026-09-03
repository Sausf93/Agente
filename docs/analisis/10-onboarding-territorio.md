---
title: "Agente — Onboarding y adaptación por cuerpo/territorio (principio «adaptado a mí»)"
autor: "Product Designer — Agente"
fecha: "2026-09-03"
estado: "Decisiones cerradas para construir"
base: "Profundiza docs/analisis/03-ux-v2.md §1.f y §3.4, docs/analisis/04-ui-brand-v2.md §5, y ESPECIFICACION.md §4.1/§4.2/§2.2. No reabre debates cerrados (barra de 5 pestañas, cuenta diferida, tokens visuales, gravedad color+texto)."
---

# Onboarding y adaptación por cuerpo/territorio

> **Tesis.** El principio de producto nº 3 («Adaptado a mí», ESPECIFICACION §1.4)
> deja de ser un ajuste y pasa a ser la **primera experiencia**: al entrar, la app
> pregunta a qué cuerpo perteneces y tu territorio, y a partir de ahí **solo ves lo
> que te aplica**. El contenido vive en **capas** Estado → Comunidad → Municipio, y
> el onboarding decide **qué capas se encienden** para ti. Un guardia civil de
> Tráfico no ve zona azul; un local de Bilbao ve estatal + Ertzaintza + ordenanza
> de Bilbao; un guardia civil de Cataluña ve estatal + (lo aplicable de) Cataluña,
> pero no la Guardia Urbana de un municipio.

Convenciones heredadas (no se reabren):
- Gravedad y ámbito **siempre color + texto + forma**, nunca solo color.
- Cuerpo (56 dp+), toque ≥ 48 dp, cuerpo ≥ 17 pt, modo oscuro real por defecto.
- Acento `signal` (teal) solo para PK/marca; **el ámbito usa su propio código de
  color de etiqueta**, distinto del de gravedad (ver §2.3).
- Sin apariencia oficial: cero escudos, banderas, emblemas o denominaciones.

Código de **ÁMBITO** (nuevo en este documento, sistémico en toda la app):

```
🌐 ESTATAL        · azul pizarra (brand)     · Estado
🟪 AUTONÓMICO     · morado (violet)          · Comunidad
🏛 MUNICIPAL      · morado ordenanza + nombre · Municipio (solo Local)
```

> El chip de ámbito **no compite** con la gravedad: gravedad = amarillo/naranja/
> rojo (semántico); ámbito = azul/morado (procedencia). Nunca se solapan de color.

---

## 1. Flujo de onboarding sin registro (< 60 s, 0 correo)

Regla dura: **de instalar a primera copia en < 60 s, sin correo**. El correo se
difiere a cuando de verdad hace falta (enviar PDF, sincronizar cuadrante,
suscribirse). Ruta: **cuerpo → CCAA → provincia → (municipio SOLO si Local) →
unidad opcional**, con GPS que rellena CCAA+provincia de un toque.

Mapa de pantallas (condicional, se salta lo que no aplica):

```
 P0 Bienvenida (1 frase + 1 botón)
      │
 P1 ¿Qué cuerpo?  ─── Guardia Civil ─┐
      │                P. Nacional ──┤→ estatal
      │                P. Local ─────┼→ necesita municipio
      │                P. Autonómica ┴→ necesita elegir cuál
      │
 P1b (solo P. Autonómica) ¿Cuál? Mossos / Ertzaintza / Foral / Canaria
      │       (esto ya fija la CCAA: Ertzaintza ⇒ País Vasco, etc.)
      │
 P2 Territorio (autodetección GPS)  "Parece que estás en Murcia. ¿Correcto?"
      │   ├─ Sí  → rellena CCAA + provincia de un toque
      │   └─ Cambiar → selector CCAA → provincia (listas cortas, buscables)
      │
 P3 (solo P. Local) Municipio  → buscador de municipio de la provincia
      │   └─ desambiguación autonómica/local si la CCAA tiene policía propia
      │
 P4 Unidad/especialidad (OPCIONAL, se puede saltar)
      │   Tráfico · Seguridad Ciudadana · Fiscal/Rural · ...
      │
 P5 Listo → cae en «Buscar» ya personalizado (accesos rápidos de su cuerpo)
```

### P0 · Bienvenida (una frase, un botón)

```
┌───────────────────────────────────────┐
│                                        │
│        ▍●   Agente                     │ ← monograma baliza, neutro
│                                        │
│   Tu normativa, adaptada a ti.         │ titleL
│   Sin registro. Funciona sin           │ body textSecondary
│   cobertura.                           │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │            Empezar                │  │ ← 56 dp, brand, zona pulgar
│  └──────────────────────────────────┘  │
│   Ya tengo cuenta · Iniciar sesión     │ ← texto pequeño, secundario
└───────────────────────────────────────┘
```

Decisiones: sin carrusel de intro, sin vídeo, sin permisos en seco. Un solo botón.

### P1 · ¿A qué cuerpo perteneces? (tarjetas grandes, 1 toque, sin «siguiente»)

```
┌───────────────────────────────────────┐
│ ‹                                 1/4  │ ← progreso honesto (máx. 4 pasos)
│ ¿A qué cuerpo perteneces?              │ titleL
│ Elige el tuyo. Podrás cambiarlo.       │ caption textSecondary
│                                        │
│ ┌─────────────────┐ ┌────────────────┐ │
│ │ 🌐              │ │ 🌐             │ │ ← tarjetas 2×2, ≥96 dp alto
│ │ Guardia Civil   │ │ Policía        │ │
│ │ Estatal         │ │ Nacional       │ │
│ └─────────────────┘ └────────────────┘ │
│ ┌─────────────────┐ ┌────────────────┐ │
│ │ 🏛              │ │ 🟪             │ │
│ │ Policía Local   │ │ Policía        │ │
│ │ Municipal       │ │ Autonómica     │ │
│ └─────────────────┘ └────────────────┘ │
└───────────────────────────────────────┘
```

Decisiones:
- **Tocar la tarjeta = elige y avanza** (sin botón «siguiente»). 1 toque.
- Cada tarjeta lleva su **icono de ámbito** (adelanta el modelo mental de capas).
- El orden pone los dos estatales arriba (mayor volumen de usuarios) y las dos
  variables (Local necesita municipio; Autonómica necesita elegir cuerpo) abajo.

### P1b · ¿Qué policía autonómica? (solo si eligió «Autonómica»)

```
┌───────────────────────────────────────┐
│ ‹                                 1/4  │
│ ¿Qué policía autonómica?               │
│                                        │
│ ┌───────────────────────────────────┐ │
│ │ Mossos d'Esquadra    · Cataluña   │ │ ← nombre + CCAA que fija
│ └───────────────────────────────────┘ │
│ ┌───────────────────────────────────┐ │
│ │ Ertzaintza           · País Vasco │ │
│ └───────────────────────────────────┘ │
│ ┌───────────────────────────────────┐ │
│ │ Policía Foral        · Navarra    │ │
│ └───────────────────────────────────┘ │
│ ┌───────────────────────────────────┐ │
│ │ Policía Canaria      · Canarias   │ │
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘
```

Decisiones:
- Elegir el cuerpo autonómico **fija la CCAA automáticamente** (Ertzaintza ⇒ País
  Vasco). En P2 la comunidad ya viene puesta; solo se confirma provincia por GPS.
- Solo se ofrecen las cuatro con policía autonómica integral. Un agente de una
  CCAA sin cuerpo propio (p. ej. Andalucía) no llega aquí: es GC/CNP/Local.

### P2 · Territorio con autodetección GPS (confirmación de un toque)

```
┌───────────────────────────────────────┐
│ ‹                                 2/4  │
│ ¿Dónde trabajas habitualmente?         │
│                                        │
│  ◉ Ubicación detectada                 │ ← chip signal, discreto
│  Parece que estás en Murcia (Región    │
│  de Murcia).                           │ titleL, dato grande
│                                        │
│  ┌──────────────────────────────────┐  │
│  │        Sí, es correcto            │  │ ← 56 dp, brand. Rellena CCAA+prov.
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │        Elegir otro territorio     │  │ ← outline, abre selector manual
│  └──────────────────────────────────┘  │
│                                        │
│  Solo usamos la ubicación para esto.   │ caption textSecondary
│  No se guarda ni se envía.             │
└───────────────────────────────────────┘
```

Fallback sin permiso de GPS (o «Elegir otro»): selector manual encadenado, listas
cortas y buscables, nunca un desplegable gigante:

```
┌───────────────────────────────────────┐
│ Comunidad autónoma                     │
│ 🔍 Busca tu comunidad…                 │
│ Andalucía · Aragón · Asturias · …      │ ← lista, alto de fila ≥ 48 dp
└───────────────────────────────────────┘
   → al elegir CCAA, abre Provincia (solo las de esa CCAA)
```

Decisiones:
- **Autodetección = 1 toque** en lugar de dos selectores encadenados. El GPS
  rellena CCAA **y** provincia; el usuario solo confirma.
- Permiso de ubicación **en contexto** (esta pantalla lo explica antes de pedirlo);
  si lo deniega, cae al selector manual sin drama.
- Si vino de P1b (autonómica), la CCAA ya está fijada; el GPS solo afina provincia.

### P3 · Municipio (SOLO si es Policía Local)

```
┌───────────────────────────────────────┐
│ ‹                                 3/4  │
│ ¿En qué municipio prestas servicio?    │
│ Necesario para tus ordenanzas.         │ ← explica el porqué
│                                        │
│ 🔍 Busca tu municipio…                 │
│ ┌───────────────────────────────────┐ │
│ │ Murcia                            │ │ ← sugeridos por provincia/GPS
│ │ Cartagena                         │ │
│ │ Lorca                             │ │
│ │ Molina de Segura                  │ │
│ └───────────────────────────────────┘ │
│                                        │
│ ✎ Mi municipio no aparece             │ ← puente (ver §4)
└───────────────────────────────────────┘
```

Caso especial **CCAA con policía autonómica + local** (elegir cuál eres):

Este cruce solo importa para un **Policía Local que trabaja en una CCAA que
además tiene cuerpo autonómico** (Bilbao, Barcelona…). El agente ya dijo en P1
que es **Local**, así que NO hay ambigüedad de cuerpo: la app le encenderá su
capa estatal + la autonómica de su comunidad + la ordenanza de su municipio. La
desambiguación Ertzaintza-vs-Policía-Municipal-de-Bilbao / Mossos-vs-Guardia-
Urbana **se resuelve en P1**, no aquí:

```
Quien es Ertzaintza  → P1 «Autonómica» → P1b «Ertzaintza» → NO pide municipio.
Quien es Policía                                                   ↑ capas: Estado
Municipal de Bilbao  → P1 «Local» → P2 País Vasco → P3 Bilbao.      + País Vasco
                                                                   + ord. Bilbao
Quien es Mossos      → P1 «Autonómica» → P1b «Mossos» → NO municipio.
Quien es Guardia                                                   ↑ capas: Estado
Urbana de Barcelona  → P1 «Local» → P2 Cataluña → P3 Barcelona.    + Cataluña
                                                                  + ord. Barcelona
```

Decisiones:
- La pregunta «¿autonómica o local?» **es la pregunta de cuerpo (P1)**. No se
  duplica. Elegir Local en una CCAA con cuerpo propio hereda la capa autonómica
  automáticamente (un local de Bilbao también aplica normativa vasca).
- Municipio es **obligatorio solo para Local** (ESPECIFICACION §2.2); para el
  resto ni se muestra P3.

### P4 · Unidad / especialidad (opcional, saltable)

```
┌───────────────────────────────────────┐
│ ‹                                 4/4  │
│ ¿Tu unidad? (opcional)                 │
│ Afina tus accesos rápidos.             │
│                                        │
│ [ Tráfico ] [ Seguridad Ciud. ]        │ ← chips por cuerpo
│ [ Fiscal/Rural ] [ Atestados ]         │   (GC: Tráfico/Fiscal/Seguridad/USECIC)
│                                        │   (CNP: Seguridad/Extranjería/…)
│                                        │   (Local: Atestados/Medio ambiente/…)
│  ┌──────────────────────────────────┐  │
│  │             Entrar                │  │
│  └──────────────────────────────────┘  │
│  Saltar este paso                      │ ← saltable, sin culpa
└───────────────────────────────────────┘
```

Decisiones:
- Es el **único paso 100 % opcional** y afina los accesos rápidos (un GC de
  Tráfico ve interurbano y PK arriba; uno de Seguridad Ciudadana ve armas/LO 4/2015).
- Chips **según el cuerpo elegido**: no se ofrece «Extranjería» a un Local.

### P5 · Listo → cae en «Buscar» ya personalizado

Sin pantalla de «enhorabuena». Aterriza directo en Buscar, campo enfocado, con
accesos rápidos y placeholder **de su cuerpo** desde el primer segundo:

```
GC/Tráfico : [Alcohol][Sin seguro][Velocidad][ITV][PK]
CNP        : [Detención][Identificación][Extranjería][Derechos 520][Sustancias]
Local      : [Zona azul][Móvil][Ordenanza][Perro suelto][Grúa]
Autonómica : estatal + sus atajos autonómicos (p. ej. Mossos: seguridad + trànsit)
```

**Presupuesto de tiempo** (objetivo < 60 s): P0 3 s · P1 4 s · P2 5 s (GPS) ·
P3 8 s (solo Local) · P4 saltado. Un GC/CNP termina en ~15 s; un Local en ~25 s.

Decisiones globales del flujo:
- **0 campos de texto libre obligatorios, 0 correo, 0 splash bloqueante.**
- Progreso honesto («2/4»); nunca más de 4 pasos, y el 4º es opcional.
- **Todo cambiable en Ajustes**, dicho en P0 y P1 para bajar la ansiedad.
- Botón `‹` atrás en cada paso sin perder lo elegido.

---

## 2. Cómo se adapta la app tras el onboarding

El perfil `{cuerpo, ccaa, provincia, municipio?, unidad?}` **enciende capas** y
reordena cinco superficies. Nada se «oculta con candado»: lo que no te aplica
simplemente no se prioriza, y si lo buscas, se te avisa (§2.5).

### 2.1 Home / Buscar — accesos rápidos por cuerpo

```
┌───────────────────────────────────────┐
│ Hola, agente          Guardia Civil ⚙ │ ← subtítulo: cuerpo · territorio
│ Guardia Civil · Murcia                 │
│ ┌───────────────────────────────┐ 🎤  │
│ │🔍 Busca infracción o artículo │     │
│ └───────────────────────────────┘     │
│ REPETIR ÚLTIMA ↻  Alcoholemia 0,60     │
│ [Alcohol][Sin seguro][Velocidad][ITV]  │ ← accesos de SU cuerpo/unidad
│───────────────────────────────────────│
│ MÁS USADAS EN TU CUERPO                │ overline
│  Uso de móvil al volante        🟠     │
│  Circular sin seguro            🟠     │
└───────────────────────────────────────┘
```

- Accesos rápidos, placeholder rotatorio y «más usadas» **filtrados por cuerpo**
  (agregado anónimo del mismo cuerpo). Un Local no ve PK arriba; un GC sí.
- El subtítulo `cuerpo · territorio` es también el **atajo a cambiar de perfil**
  (§3): tocarlo abre el conmutador.

### 2.2 Buscador — prioriza tu territorio (no censura)

Ranking de resultados (sobre el de ESPECIFICACION §4.3), con el territorio como
**desempate y realce**, nunca como filtro que esconde:

```
1º  Coincidencia exacta de sinónimo
2º  Coincidencia en título
3º  ── realce por ámbito aplicable a MI perfil ──   (sube posiciones)
4º  Coincidencia en texto
5º  Popularidad en mi cuerpo
```

- Lo **aplicable a mi territorio va primero**; lo de otra competencia aparece
  **más abajo y con su chip de ámbito** + aviso (§2.5), nunca eliminado.
- Filtro rápido de ámbito disponible pero **no impuesto**:
  `[ Todo ]  [ 🌐 Estatal ]  [ 🟪 Autonómico ]  [ 🏛 Mi municipio ]`.
- Para un Local, «zona azul» prioriza **su** ordenanza; si no la tiene cargada,
  cae al puente de §4.

### 2.3 Fichas — chip de ÁMBITO (estatal/autonómico/municipal)

Se añade a la ficha de 03-ux-v2 §3.1 un **chip de ámbito** en la cabecera, junto
a (no fundido con) la gravedad:

```
┌───────────────────────────────────────────┐
│ ‹ Volver                    ★    Reportar  │
│ Estacionamiento sobre paso de peatones     │ título
│ 🏛 ORDENANZA · MURCIA        art. 25   ▸   │ ← CHIP DE ÁMBITO (morado ordenanza)
│                                            │
│ 🚛 GRÚA si obstaculiza                     │ consecuencia operativa (banda color)
│ 🟠 GRAVE · Administrativa                  │ gravedad (color+texto+forma)
│ [ 200 € ] [ 100 € p.pago ] [ 0 pts ]       │ tiles
│ ┌────────────────────────────────────────┐│
│ │ 📋  COPIAR HECHO DENUNCIADO            ││
│ └────────────────────────────────────────┘│
│ Actualizada 02/2026 · BOP Murcia           │ pie: fuente + fecha
└───────────────────────────────────────────┘
```

Variantes del chip de ámbito (siempre color **+ texto + icono**, y el nombre del
territorio cuando aplica):

```
🌐 ESTATAL                     ← LSV/RGC/RGV/CP… (azul brand)
🟪 AUTONÓMICO · CATALUÑA       ← normativa de la CCAA (morado violet)
🏛 ORDENANZA · MURCIA          ← ordenanza municipal (morado ordenanza + municipio)
```

- El chip es **tocable** (`▸`): despliega «Por qué te aplica / a quién aplica».
- **Competencia y vía** (§4.4-L de la ficha) sigue existiendo debajo
  («Urbana → Local», «Interurbana → Guardia Civil»); el chip de ámbito responde
  «¿de qué capa sale esta norma?», la competencia responde «¿quién la aplica?».

### 2.4 Normativa — agrupada por capas

La pestaña Normativa agrupa el articulado por las tres capas, en el orden del
modelo mental Estado → Comunidad → Municipio, con las capas de tu perfil arriba:

```
┌───────────────────────────────────────┐
│ Normativa                         🔍   │
│ 🌐 ESTATAL                             │ overline de capa
│  Ley de Tráfico (LSV)                  │
│  Reglamento General de Circulación     │
│  Código Penal · LECrim · LO 4/2015     │
│ 🟪 AUTONÓMICO · MURCIA                 │
│  Normativa autonómica de la Región…    │
│ 🏛 MUNICIPAL · MURCIA                  │
│  Ordenanza de Movilidad de Murcia      │
│  Ordenanza de Convivencia              │
│  ─ Otros municipios (buscar) ─         │ ← acceso, no prioridad
└───────────────────────────────────────┘
```

- Un GC/CNP ve Estatal + Autonómico (si su CCAA aporta); **no ve la capa
  Municipal** como sección propia (no le compete), pero puede buscarla.
- Un Local ve las **tres capas**, con la municipal de **su** ayuntamiento.
- Badge «cambió el dd/mm» por artículo se mantiene (ESPECIFICACION §4.5).

### 2.5 Aviso «esto es de otra competencia» (no censura, orienta)

Cuando abres algo fuera de tu capa (un GC abre una ordenanza local; un Local abre
extranjería estatal de competencia CNP), banner sobrio en la ficha, **nunca un
bloqueo**:

```
┌───────────────────────────────────────────┐
│ ℹ Esto suele ser competencia de Policía    │ ← infoBg, borde 3 px, icono
│   Local (vía urbana). Te lo muestro por    │
│   si lo necesitas.                    ▸    │
└───────────────────────────────────────────┘
```

- Tono informativo, **no restrictivo**: «te lo muestro por si lo necesitas».
- Aparece **bajo el título**, sobre la consecuencia, para que se lea antes de
  copiar; no oculta ningún dato de la ficha.
- Distinto del chip de ámbito: el chip dice **de qué capa es**; el aviso dice
  **que a ti no suele tocarte** (y por qué).

---

## 3. Cambiar de perfil y multi-territorio

Dos necesidades reales: el agente que **se traslada** (cambio permanente) y el que
**trabaja en dos sitios** o refuerza en otra demarcación (cambio puntual). Ambos
sin fricción y sin rehacer el onboarding.

### 3.1 Conmutador de perfil (desde el subtítulo del home)

Tocar `Guardia Civil · Murcia` (cabecera) abre un **bottom sheet**, no una
pantalla de ajustes:

```
┌───────────────────────────────────────┐
│ Tu perfil activo                   ✕  │
│ ● Guardia Civil · Murcia (Tráfico)     │ ← activo, radio marcado
│ ─────────────────────────────────────  │
│ Cambiar territorio  ›   Murcia         │ ← cambia solo CCAA/prov/mun
│ Cambiar cuerpo      ›   Guardia Civil  │
│ Unidad              ›   Tráfico        │
│ ─────────────────────────────────────  │
│ + Añadir otro destino                  │ ← multi-territorio (§3.2)
└───────────────────────────────────────┘
```

- **Cambiar territorio** reordena capas y contenido al instante; **no toca** ni
  favoritos ni cuadrante (son del usuario, no del territorio).
- Cambio reversible con toast «Deshacer». Nada modal ni bloqueante.
- El mismo control vive también en Ajustes (ESPECIFICACION §4.1), pero el atajo
  del home es el camino corto.

### 3.2 Multi-territorio (dos destinos guardados)

Para quien alterna (p. ej. Local que cubre dos municipios, o GC en dos
demarcaciones), se guardan **hasta 3 destinos** y se cambia con un toque:

```
┌───────────────────────────────────────┐
│ + Añadir otro destino                  │
│ ┌───────────────────────────────────┐ │
│ │ ● Murcia (activo)                 │ │
│ │ ○ Cartagena                       │ │ ← toque = activa esa capa municipal
│ │ ○ Lorca                           │ │
│ └───────────────────────────────────┘ │
│ Cambia solo qué ordenanzas y festivos  │
│ ves. Tu cuadrante y favoritos no       │
│ cambian.                               │
└───────────────────────────────────────┘
```

- **Autodetección opcional**: si activas «seguir mi ubicación», al entrar en otro
  municipio guardado la app **propone** cambiar («Estás en Cartagena. ¿Ver sus
  ordenanzas?») con confirmación de un toque; nunca cambia sin avisar.
- Los **festivos del cuadrante** (nacional + autonómico + local) siguen al destino
  activo; al cambiar de municipio, el cómputo de festivos locales se ajusta y se
  avisa igual que en 03-ux-v2 §4.1 («N días editados a mano se mantienen»).

### 3.3 Traslado permanente

Es «Cambiar territorio» a secas: se actualiza el perfil y punto. La app pregunta
una sola vez si quiere **conservar el municipio anterior** como destino guardado
(útil el primer mes tras el traslado). Cuadrante y favoritos intactos.

---

## 4. El caso Policía Local (ordenanzas + estatal/autonómico)

El Local es el usuario con **las tres capas encendidas** y el diferencial más
fuerte frente a SPPLB (que ignora la ordenanza). Ve, mezclado y **etiquetado**:
estatal (LSV/RGC/RGV, CP) + autonómico (si su CCAA aporta) + **ordenanza de su
municipio**.

### 4.1 Ordenanzas junto a lo estatal/autonómico

- En **buscador** aparecen mezcladas; cada resultado lleva su **chip de ámbito**.
  «Doble fila» puede devolver a la vez el RGC (🌐 estatal) y la ordenanza (🏛
  municipal), y el Local ve de un vistazo cuál invocar.
- En **ficha**, badge `🏛 ORDENANZA · [Municipio]` en morado ordenanza, con
  fuente **BOP + fecha** (crítico: las ordenanzas cambian por pleno municipal).
- En **Normativa**, la ordenanza de su municipio es una sección de primer nivel
  (§2.4), no un anexo escondido.

### 4.2 Puente «mi ordenanza personal» (si el municipio aún no está)

No todos los municipios estarán cargados en beta (ESPECIFICACION §4.5 empieza por
los municipios de los usuarios beta). Si el municipio del agente no tiene
ordenanza cargada, **nunca un callejón**:

```
┌───────────────────────────────────────────┐
│ 🏛 Tu municipio (Molina de Segura) aún no  │
│    tiene ordenanza cargada.                │
│    Te muestro la normativa estatal          │
│    aplicable mientras tanto.                │
│                                            │
│ [ ✎ Añadir mi importe / artículo ]         │ ← ordenanza personal (solo móvil)
│ [ ⬆ Solicitar mi ordenanza ]               │ ← lo priorizamos para cargarla
└───────────────────────────────────────────┘
```

- **Ordenanza personal**: el agente teclea el artículo y el importe de **su**
  ordenanza para una infracción; queda **solo en su dispositivo**, reutilizable,
  y se copia en el boletín como cualquier otra. Es un puente, no contenido oficial
  (lleva marca «tuyo, no verificado»).
- **Solicitar mi ordenanza**: manda a la cola de contenido (anónimo) qué municipio
  falta; alimenta la priorización de carga.
- Cuando la app **carga oficialmente** esa ordenanza, avisa: «Ya tienes la
  Ordenanza de Molina de Segura. ¿Sustituyo tus notas personales?» (no pisa sin
  preguntar).

### 4.3 Badge de ámbito municipal (especificación mínima)

```
Componente: AmbitoChip variante "municipal"
Contenido : 🏛  + "ORDENANZA"  + " · " + nombreMunicipio
Color     : morado ordenanza (violet fuerte, distinto del autonómico)
Forma     : pastilla radiusPill, icono 16, texto label 15/600 uppercase overline
Regla     : nunca solo color → icono 🏛 + palabra "ORDENANZA" + municipio
Tocable   : ▸ despliega "Por qué te aplica" + fuente BOP + fecha
Personal  : si es ordenanza personal, sufijo "· TUYO" en textSecondary + icono ✎
```

---

## 5. Microcopys (español, literales)

**Bienvenida / onboarding:**
- P0 título: `Tu normativa, adaptada a ti.`
- P0 sub: `Sin registro. Funciona sin cobertura.`
- P1 título: `¿A qué cuerpo perteneces?`
- P1 ayuda: `Elige el tuyo. Podrás cambiarlo cuando quieras en Ajustes.`
- P1b título: `¿Qué policía autonómica?`
- P2 título: `¿Dónde trabajas habitualmente?`
- P2 detección: `Parece que estás en {provincia} ({comunidad}). ¿Correcto?`
- P2 confirmar: `Sí, es correcto` · P2 alternativa: `Elegir otro territorio`
- P2 privacidad: `Solo usamos la ubicación para esto. No se guarda ni se envía.`
- P2 sin permiso: `Sin ubicación no pasa nada: elígelo tú en dos toques.`
- P3 título: `¿En qué municipio prestas servicio?`
- P3 ayuda: `Lo necesitamos para mostrarte tus ordenanzas.`
- P3 no aparece: `Mi municipio no aparece`
- P4 título: `¿Tu unidad? (opcional)` · P4 ayuda: `Afina tus accesos rápidos.`
- P4 saltar: `Saltar este paso`
- P5 (no hay pantalla; aterriza en Buscar).

**Chips y avisos de ámbito:**
- Estatal: `🌐 ESTATAL`
- Autonómico: `🟪 AUTONÓMICO · {comunidad}`
- Municipal: `🏛 ORDENANZA · {municipio}`
- Personal: `🏛 ORDENANZA · {municipio} · TUYO`
- «Por qué te aplica»: `Sale de la {capa}. En tu perfil ({cuerpo} · {territorio}) sí aplica.`

**Aviso «otra competencia» (no bloquea):**
- Genérico: `Esto suele ser competencia de {cuerpo} ({vía}). Te lo muestro por si lo necesitas.`
- Local abre estatal CNP: `Competencia habitual de Policía Nacional. Disponible por si lo consultas.`
- GC abre ordenanza: `Ordenanza municipal (vía urbana). La aplica normalmente la Policía Local.`

**Puente ordenanza (Local):**
- Sin ordenanza: `Tu municipio ({municipio}) aún no tiene ordenanza cargada. Te muestro la normativa estatal aplicable mientras tanto.`
- Añadir personal: `Añadir mi importe / artículo`
- Solicitar: `Solicitar mi ordenanza`
- Marca de personal: `Tuyo · no verificado · solo en este móvil`
- Al cargarse la oficial: `Ya tienes la Ordenanza de {municipio}. ¿Sustituyo tus notas personales?`

**Cambiar de perfil / multi-territorio:**
- Conmutador: `Tu perfil activo`
- Añadir: `+ Añadir otro destino`
- Nota multi: `Cambia solo qué ordenanzas y festivos ves. Tu cuadrante y favoritos no cambian.`
- Propuesta por GPS: `Estás en {municipio}. ¿Ver sus ordenanzas?`
- Deshacer: `Perfil cambiado a {territorio}. Deshacer`
- Traslado: `¿Guardas {municipio anterior} como destino, por si acaso?`

**Tranquilidad transversal:**
- `Todo esto se cambia en Ajustes › Cuerpo y territorio.`

---

## 6. Especificación de 2 pantallas para maquetar

### 6.1 Pantalla (a) — Selección de cuerpo (P1)

```
Layout (mobile, safe-area, margen lateral 16)
├─ TopBar: [‹ atrás]           [progreso "1/4" · caption textSecondary]
├─ Título  "¿A qué cuerpo perteneces?"   titleL · trackTight
├─ Ayuda   "Elige el tuyo. Podrás cambiarlo."  caption · textSecondary
├─ Grid 2×2 (gap 12), tarjetas CuerpoCard (≥96 dp alto, radiusLg, e1, hairline):
│    · icono de ámbito 28 (🌐/🏛/🟪)  arriba-izquierda
│    · nombre del cuerpo  bodyStrong 18
│    · ámbito             caption textSecondary ("Estatal"/"Municipal"/…)
│    · press: scale .98 + háptico selección → navega (autonómica → P1b)
└─ (sin botón "siguiente": la tarjeta ES el avance)

Datos:  cuerpos = [Guardia Civil, Policía Nacional, Policía Local, Policía Autonómica]
Estado: selección única; al tocar guarda perfil.cuerpo y rutea.
A11y:   cada card = botón; label "Guardia Civil, ámbito estatal".
Tokens: título titleL+trackTight · card surface+e1+hairline · icono ámbito
        (brand / violet) NUNCA color de gravedad.
Modo oscuro: surface sobre #121212, hairline #232A33.
Reglas de campo: toque ≥ 96 dp, texto ≥ 17 pt, 4 objetivos grandes 2×2.
```

### 6.2 Pantalla (b) — Resultado/ficha con chip de ámbito y capas

Ejemplo: Local busca «doble fila» y obtiene **dos** resultados de distinta capa;
abre la ficha de la ordenanza municipal.

```
Vista LISTA (dos capas, cada una con su chip de ámbito):
┌───────────────────────────────────────────┐
│🔍 doble fila                          ✕ 🎤 │
│ [Todo][🌐 Estatal][🟪 Auton.][🏛 Municipio]│ ← filtro de ámbito (no impuesto)
│─────────────────────────────────────────── │
│ 🚛 Parada en doble fila                     │ ← consecuencia + título
│    🏛 ORDENANZA · MURCIA · 🟠 GRAVE · 200€  │ ← ámbito + gravedad + importe
│ 📝 Parada que obstaculiza circulación       │
│    🌐 ESTATAL · RGC 91 · 🟠 GRAVE · 200€    │ ← misma búsqueda, capa estatal
└───────────────────────────────────────────┘

Vista FICHA (abre la municipal):
┌───────────────────────────────────────────┐
│ ‹ Volver                    ★    Reportar  │  A) navegación (arriba, poco tocable)
│ Parada en doble fila                       │  B) título 22pt · trackTight
│ 🏛 ORDENANZA · MURCIA        art. 25   ▸   │  C) CHIP DE ÁMBITO (morado ord.)
│ ┌────────────────────────────────────────┐ │
│ │ ℹ Vía urbana. Competencia Policía Local ││  C') aviso de competencia (si el
│ └────────────────────────────────────────┘ │      perfil no es Local; aquí no sale)
│ 🚛 GRÚA si obstaculiza                      │  D) consecuencia operativa (banda)
│ 🟠 GRAVE · Administrativa                   │  E) gravedad color+texto+forma
│ [ 200 € ] [ 100 € p.pago ] [ 0 pts ]        │  F) tiles tabulares
│ ┌────────────────────────────────────────┐ │
│ │ 📋  COPIAR HECHO DENUNCIADO            ││  G) acción primaria 60 dp, zona pulgar
│ └────────────────────────────────────────┘ │
│      ▽  desliza para ver el texto  ▽        │
│─────────────────────────────────────────── │  (bajo el pliegue)
│ COMPETENCIA                                 │  overline
│ Urbana → Policía Local                      │
│ CAPAS RELACIONADAS                          │  overline
│  🌐 RGC art. 91 (equivalente estatal)  ▸    │ ← salta a la ficha estatal
│ Actualizada 02/2026 · BOP Murcia · art. 25  │  pie: fuente + fecha
└───────────────────────────────────────────┘

Orden de prioridad (cerrado): A navegación → B título → C chip de ámbito →
[C' aviso si aplica] → D consecuencia → E gravedad → F tiles → G copiar →
[bajo pliegue] competencia → capas relacionadas → pie fuente/fecha.

Tokens/reglas:
· Chip ámbito: AmbitoChip "municipal" (morado ordenanza) — nunca color gravedad.
· Gravedad: SeverityChip (naranja) — separado del ámbito, sin fundir colores.
· "Capas relacionadas" enlaza la misma conducta en otra capa (municipal↔estatal),
  clave para el Local que duda qué invocar.
· A11y: se lee "Ordenanza de Murcia, artículo 25; grúa si obstaculiza; grave;
  200 euros" en ese orden.
· Campo: fila de resultado ≥ 64 dp, COPIAR 60 dp ancho completo, contraste AA
  (AAA en importe y gravedad), modo oscuro real.
```

---

## 7. Decisiones cerradas (resumen)

1. Onboarding **sin registro, < 60 s, 0 correo**; ruta cuerpo → CCAA → provincia →
   (municipio solo Local) → unidad opcional; GPS confirma territorio de un toque.
2. La disyuntiva **autonómica vs. local** se resuelve en la **pregunta de cuerpo
   (P1)**, no en una pantalla aparte: un local de Bilbao/Barcelona hereda su capa
   autonómica automáticamente además de su ordenanza.
3. El perfil **enciende capas** Estado → Comunidad → Municipio y reordena home,
   buscador, fichas y Normativa. **Nunca censura**: lo de otra competencia aparece
   más abajo, etiquetado, con aviso informativo.
4. **Chip de ÁMBITO** sistémico (🌐 estatal / 🟪 autonómico / 🏛 municipal),
   con código de color propio (azul/morado) **separado del de gravedad**.
5. **Cambiar de perfil** desde el subtítulo del home (bottom sheet, reversible);
   **multi-territorio** con hasta 3 destinos y propuesta por GPS con confirmación.
6. **Local sin ordenanza cargada**: puente «mi ordenanza personal» (solo móvil) +
   «solicitar mi ordenanza», sin callejón; la carga oficial no pisa lo personal
   sin preguntar.

*Fin. Documento vivo: se recalibra con el embudo de onboarding (en qué paso se
abandona) y con las solicitudes de ordenanza (qué municipios cargar primero).*
