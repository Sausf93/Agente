# Hoja de ruta: paridad (y superación) con SPPLB

Objetivo del fundador: **no ser peores que SPPLB en información ni en orden** — igualar su
estructura y su volumen de catálogo, con nuestras ventajas (offline, adaptado por cuerpo/territorio,
detención orientativa, derechos con audio, cuadrante inteligente). Todo el contenido de fuentes
**públicas** (BOE + codificado DGT); redacción propia, nunca copiar la de SPPLB.

Última actualización: 2026-09-09. Fuente del árbol: pantallazos del fundador de la app SPPLB.

## Árbol de SPPLB (mapeado)

Menú "Consultas" (11 áreas): Más usadas · Tráfico · Seguridad Ciudadana · Transporte · Armas ·
Extranjeros · Menores · Animales Peligrosos · Lectura de Derechos · Código Penal · Control de Vehículos.

- **Tráfico** (submenú): Reglamento Gral. Circulación · Ley Seguridad Vial · R. Conductores ·
  Centros de Reconocimiento · Reglamento Gral. Vehículos · Seguro Obligatorio · Escuela de
  Conductores · Consultas Gral. · VMP. → dentro de cada norma, lista de infracciones (art · importe · puntos).
- **Transporte** (submenú): Límites de velocidad · Tacógrafo · M. Peligrosas · Trans. Público/Privado ·
  Trans. de Viajeros · Obligación con la Admón. · M. Perecederas · Trans. Escolar · Consultas Gral.
- **Código Penal** (submenú): De las Penas · De los Responsables · De los Delitos (línea policial) ·
  Habeas Corpus · C. Eximentes · C. Atenuantes · C. Agravantes · Delitos Leves · Tabla Res. Penas · LECrim.
- **Seguridad Ciudadana**: Ley 4/2015 · Infracciones y Sanciones.
- **Armas**: infracciones del Reglamento de Armas (RD 137/1993).
- **Extranjeros**: infracciones (RD 240/2007, RD 557/2011, LOEX…).
- **Menores**: cajón de leyes (LO 1/1996, igualdad/discapacidad…). Baja prioridad (grab-bag).
- **Animales Peligrosos**: Animales Peligrosos · RD 287/2002 · Infracciones y Sanciones · Ley 50/99.
- **Control de Vehículos** (HERRAMIENTAS, no infracciones): Nac. Matrícula · Periodos ITV UE ·
  Decodificación VIN · Matrículas del Mundo · Localizar OBD · COET Documentación.
- **Lectura de Derechos**: castellano, inglés, alemán, noruego (~4 idiomas).
- **Cuadrante**: calendario básico (Trabajados/Libres/Extras/Noches).

## Dónde estamos (2026-09-09)

**Ya superamos a SPPLB:**
- Lectura de derechos: **14 idiomas + audio** (ellos ~4, sin audio).
- Cuadrante: patrón, nocturnas por franja, festivos, exceso, disponibilidad (el suyo es un contador).
- Texto legal: **articulado completo del BOE** (CP 809, LECrim 1.095, RGC, LSV, RGV, R. Conductores,
  LOTT completa, Escuelas, Seguro, RA, LOEX, LORPM, LOPJM, EVD…). 26 normas en el paquete.
- Buscador con lenguaje de calle + Normas por materia + ficha adaptativa (consecuencia primero).

**Igualado:** Tráfico (normas): tenemos sus mismas leyes.

**Pendiente (el trabajo):**
1. ~~**Navegación por sub-temas ("Explorar por temas")**~~ — **HECHO (2026-09-10, commit ca508a2)**. En las 3
   materias densas (Tráfico 9 sub-temas, Penal 4, Seguridad Ciudadana 3) el detalle de materia muestra un
   submenú de sub-temas (materia → sub-tema → ficha); el resto planas. Taxonomía = mapa interino en el móvil
   (`SUBTEMA_POR_INFRACCION`), con regla anti-vacío (ningún grupo visible <3). Falta densificar sub-temas
   flacos en olas futuras y, cuando "aparcamiento desglosado" exista, escindir "Parada/estacionamiento/VMP".
2. **Volumen del catálogo de infracciones** por área (su fuerte). Hoy ~92 infracciones (41 tráfico).
3. **Áreas flacas de infracciones**: Armas (RA), Extranjería, Animales, Transporte (viajeros/escolar/perecederas), Seguridad Ciudadana y Penal a fondo.
4. **Herramientas de "Control de Vehículos"** (nacionalidad de matrícula, periodos ITV) — extra, algunas necesitan red.

## Plan por olas (prioridad calle: GC Tráfico primero)

- **Ola 1 (HECHA, commit c50b50b):** +15 infracciones de Tráfico (conducta, estado del vehículo,
  estacionamiento, señales, documentación), validadas por revisor.
- **Ola 2 — Transporte:** viajeros (VTC/taxi, plazas), escolar, perecederas (ATP), tarjeta de
  transporte/obligaciones; completar tacógrafo/ADR/MMA. Cierra los sub-temas a 0.
- **Ola 3 — Seguridad Ciudadana y Penal** a densidad plena (orden público, patrimonio, personas…).
- **Ola 4 — Armas (RA), Extranjería, Animales**: catálogo de conductas desde el articulado ya ingerido.
- **Acelerador — derivador LSV→catálogo:** parsear Anexo II (puntos) + Anexo IV (velocidad) +
  arts. 76-80 (gravedad/importes) del texto consolidado de la LSV (ya descargado) para generar el
  esqueleto de cientos de infracciones con máxima fiabilidad; redacción de boletín/sinónimos por olas.
  (El codificado DGT/ARCI solo existe como PDF escaneado o restringido a administraciones → OCR como
  referencia cruzada, no como import directo.)
- **Explorar por temas:** construir cuando los sub-temas tengan densidad (regla anti-vacío: fusionar
  sub-temas flacos, nunca tarjetas de "· 1"; "en ampliación" solo para un allowlist curado).

Métrica de gobierno: ningún sub-tema visible con <3 infracciones una vez "abierto"; hasta entonces
fusionado o "en ampliación". Todo `pendiente_revision` → revisor jurídico antes de cada ContentVersion.

## Regla legal (innegociable)
Fuente primaria pública (BOE/DGT): importes, puntos, gravedad, artículos y códigos son hechos
oficiales, reutilizables. NO copiar la redacción curada de SPPLB ni volcar su base (derecho sui
generis). El "hecho denunciado" del codificado se usa como pista de clasificación; el `textoBoletin`
y los sinónimos se redactan desde cero.
