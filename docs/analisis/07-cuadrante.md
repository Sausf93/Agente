# 07 · El Cuadrante de "Agente" — diseño para no perder datos NUNCA

> **Alcance.** Diseño de producto e ingeniería del módulo Cuadrante (spec §4.9), afinando el
> modelo de `packages/shared/src/user.ts` (`PatronTurno`, `DiaCuadrante`, `Cuadrante`) y las
> particularidades de las perspectivas 04 (Local), 05 (Guardia Civil) y 06 (Nacional).
>
> **Tesis.** El fallo más odiado de SPPLB es "el cuadrante no guarda / pierde la configuración"
> (documentado en las tres perspectivas). No es un bug puntual: es una **arquitectura de datos
> equivocada**. Aquí se corrige de raíz separando *patrón* (regenerable) de *excepciones*
> (sagradas), con guardado atómico, migraciones versionadas y respaldo cifrado opt-in.
>
> **Aviso.** Todo dato legal concreto (franja nocturna 22:00–06:00, jornada de referencia por
> cuerpo, complementos) va marcado **(a verificar)**. Son órdenes de magnitud y valores por
> defecto **configurables**, nunca constantes cableadas. La app no calcula nómina: **orienta**
> para cotejar.

---

## 1. Modelo de datos afinado: patrón vs. excepciones

### 1.1 El principio que lo cambia todo: patrón regenerable + excepciones sagradas

El cuadrante NO se almacena como "365 días materializados". Se almacena como **una función pura
que se puede recalcular en cualquier momento** más una **capa de ediciones manuales que se
respeta por encima de todo**:

```
cuadranteDelDia(fecha) =
    excepcionManual(fecha)                    ← si existe, GANA SIEMPRE (sagrada)
    ?? proyeccionDesdePatron(fecha, patron)   ← si no, se calcula del patrón
```

- **Patrón** = secuencia cíclica + fecha de inicio de ciclo + horas por tipo. Es **derivable y
  desechable**: puedo cambiarlo, regenerarlo, corregir un error de definición, y las fechas
  futuras se recalculan solas. No hay nada que "perder" en la proyección porque es una función.
- **Excepción manual** = todo lo que el agente ha tocado a mano para un día concreto (cambió el
  servicio, puso una nota, una alarma, un cambio con un compañero, un servicio extraordinario).
  Esto es **irreemplazable**: representa la realidad vivida, no una regla. **Regenerar el patrón
  jamás pisa una excepción.**

> Por qué SPPLB pierde datos (hipótesis de las 3 perspectivas): mezcla ambas cosas en un mismo
> blob mutable y, al "regenerar" o migrar de versión, sobrescribe lo que el agente había tocado,
> o pierde el blob entero por un guardado no atómico. Separar las dos capas elimina esa clase de
> bug por completo.

### 1.2 Estructura afinada (evolución de los tipos actuales)

El modelo actual (`Cuadrante` con `patron`, `inicioCiclo`, `jornadaRefHorasSemana`, `dias[]`) es
correcto en espíritu. Lo afinamos así (conceptual, a portar a Zod en `packages/shared`):

```ts
// Definición de cada tipo de servicio DENTRO de un patrón (no una constante global):
//  - horas y franja horaria por defecto, y si computa como presencia efectiva.
DefinicionServicio = {
  tipo: TipoServicio,                 // 'manana' | 'noche' | 'saliente' | 'libre' | ...
  horaInicioDefecto: "HH:MM" | null,  // p. ej. noche "22:00"
  horaFinDefecto:    "HH:MM" | null,  //          noche "06:00" (cruza medianoche)
  cruzaMedianoche:   boolean,         // derivable de fin<=inicio, se guarda explícito por claridad
  computaPresencia:  boolean,         // 'disponibilidad'/'reten' → false (cuenta aparte)
  clase: 'trabajo' | 'descanso' | 'ausencia' | 'disponibilidad',
}

PatronTurno = {
  nombre: string,
  cuerpo: Cuerpo,                     // para catálogo y valores por defecto por cuerpo
  secuencia: TipoServicio[],          // ciclo que se repite (min 1)
  definiciones: DefinicionServicio[], // horas/franja por cada tipo usado en la secuencia
  editable: boolean,                  // los presets se pueden clonar y editar (no mutar el preset)
}

DiaCuadrante = {                      // SOLO se guarda si es EXCEPCIÓN (no todos los días)
  fecha: "YYYY-MM-DD",               // clave civil, sin zona horaria (ver §4)
  servicio: TipoServicio,
  horaInicio: "HH:MM" | null,
  horaFin:    "HH:MM" | null,
  nota:  string | null,
  alarmaMinutosAntes: number | null,
  origen: 'manual',                  // marca de excepción sagrada
  editadoEl: FechaISO,               // para resolver conflictos de respaldo (last-write-wins por campo)
}

Cuadrante = {
  schemaVersion: number,             // ← NUEVO: versión de migración (ver §4.2)
  patron: PatronTurno,
  inicioCiclo: "YYYY-MM-DD",
  jornadaRefHorasSemana: number,     // CONFIGURABLE por cuerpo (no 37,5 fijo) — ver §3
  franjaNocturna: { inicio: "22:00", fin: "06:00" },  // (a verificar) configurable
  computoAnualRefHoras: number | null,                // p. ej. 1.400–1.700 h/año, configurable
  dias: DiaCuadrante[],              // SOLO excepciones. Los no listados se proyectan.
  festivosExtra: FechaCivil[],       // festivos locales añadidos por el agente
}
```

**Claves de diseño:**

1. `dias[]` guarda **solo excepciones**, indexadas por `fecha` (una por fecha). Un mes "normal"
   puede tener `dias: []`. Esto hace el estado minúsculo y las escrituras baratas.
2. Las **horas por tipo** dejan de ser un `record` suelto y pasan a `DefinicionServicio` con
   franja horaria, para poder computar nocturnidad y medianoche (un `noche` no son "8 h" a secas,
   son 22:00→06:00 con X horas en franja nocturna).
3. `schemaVersion` habilita migraciones seguras (§4.2).
4. Nada de esto contiene datos de terceros → respaldo cifrado sin problema RGPD (spec §4.9).

### 1.3 Regeneración segura (el algoritmo que no pierde datos)

```
regenerarProyeccion(cuadrante, rangoFechas):
  para cada fecha en rango:
    if cuadrante.dias tiene excepcion(fecha):   → usar excepción  (NO tocar, NO sobrescribir)
    else:                                       → proyectar del patrón (efímero, no se persiste)
```

La proyección **no se persiste**: se calcula al vuelo para pintar el calendario. Solo se
persisten patrón + excepciones. Consecuencia directa: **cambiar el patrón nunca puede borrar una
edición manual**, porque viven en tablas/capas distintas y la excepción siempre tiene prioridad
de lectura. Es imposible, por construcción, reproducir el bug de SPPLB.

---

## 2. Patrones por cuerpo (predefinidos y editables)

Los presets se entregan en el paquete de contenido, son **clonables** (al elegir uno se copia al
cuadrante del usuario; nunca se muta el preset) y **editables** en el editor de ciclo. El agente
elige *cuerpo → patrón → fecha de inicio de ciclo* y la app proyecta el año (spec §4.9,
perspectivas 05 §4 y 04 §4).

### 2.1 Guardia Civil — servicio, no "turno de fábrica" (perspectiva 05 §4)

- **`gc_6_saliente_3`** "6 + saliente + 3":
  `secuencia: [manana, manana, manana, tarde, tarde, noche, saliente, libre, libre, libre]`
  (variantes por unidad; el "saliente" tras noche **se computa**, ni doble ni a cero).
- **`gc_semanas_MTN`** rotación semanal mañanas/tardes/noches.
- **Servicios de 8 y de 12 h** según unidad (ATGC, Seguridad Ciudadana, USECIC): se modelan como
  `DefinicionServicio` con distintas horas.
- **Noche a caballo de medianoche**: `noche 22:00→06:00`, `cruzaMedianoche: true`. El saliente es
  el día siguiente por la mañana.
- **Disponibilidad / retén / imaginaria / localizada**: nuevo tipo de servicio con
  `clase: 'disponibilidad'`, `computaPresencia: false` → cuenta en un acumulador aparte "horas de
  disponibilidad", nunca sumadas a presencia efectiva.
- **Servicios extraordinarios / refuerzos** (dispositivos, ferias, controles): se añaden como
  **excepciones sueltas** sobre el patrón base sin romper el ciclo.
- **Jornada de referencia propia** (naturaleza militar, no ET ni convenio local): `jornadaRef`
  configurable (a verificar).

> Nota: `TipoServicio` actual no tiene `disponibilidad`/`reten`. **Acción para `shared`:** añadir
> `'disponibilidad'` y `'servicio_extra'` al enum `TipoServicio` (con migración, ver §4.2), o
> modelarlos como subtipo en `DefinicionServicio.clase`. Recomendado: añadir al enum para que el
> contador los separe de forma nativa.

### 2.2 Policía Nacional — 7×7 y rotaciones (perspectiva 06 §7)

- **`pn_7x7`**: 7 días de trabajo / 7 de libranza.
  `secuencia: [T,T,T,T,T,T,T, L,L,L,L,L,L,L]` (con T resuelto a mañana/tarde/noche según sub-rueda).
- **Rotaciones M/T/N** y "quintos turnos" por unidad (Seguridad Ciudadana, UPR, Extranjería/CIE,
  frontera).
- Turnos tipo: mañana 06–14/07–15, tarde 14–22/15–23, **noche 22–06** (cuenta nocturnidad).
- **Correturnos / retenes / extraordinarios**: insertar días sueltos como excepciones sin romper
  el patrón (perspectiva 06 §7 lo pide explícitamente).
- **Cambios de servicio entre compañeros**: excepción con nota "cubre X" para no perder el cómputo.

### 2.3 Policía Local — "cada plantilla su ciclo" (perspectiva 04 §4)

No hay patrón único; el editor debe ser **flexible, no solo presets**:

- **`pl_MTN_rotativo`**, **`pl_quintos`** (ruedas de 5/6/7 grupos), **`pl_7x7`**, **`pl_6_3`**,
  **turno partido** (mañana+tarde el mismo día en pueblo pequeño).
- **Editor de ciclo libre**: el agente teclea su secuencia rara una vez y la app la proyecta.
- **Festivos LOCALES**: los 2 propios del municipio + refuerzos de fiestas patronales
  (`festivosExtra` + precarga por municipio cuando exista contenido).
- **Complementos reales** (nocturnidad, festividad, domingos/festivos, exceso sobre jornada de
  **convenio local**, configurable): son dinero, hay que contarlos bien.

### 2.4 Policía autonómica

Reutiliza el editor libre + presets clonables por comunidad (Ertzaintza, Mossos, Foral, Canaria).
No hay lógica especial de cómputo distinta: mismo motor, distinta `jornadaRef` y festivos
autonómicos.

---

## 3. Cómputo de horas (fórmulas y lógica)

El motor de cálculo es una **función pura** `resumen(diasMaterializados, config) → Totales`. Es
pura para ser 100% testeable (§4.5). Trabaja sobre los días ya materializados (excepción ∪
proyección) de un rango (mes/año).

### 3.1 Materialización de un servicio en intervalos reales

Cada día con servicio de trabajo produce **uno o varios intervalos [inicio, fin)** en tiempo
absoluto local. Un `noche 22:00→06:00` del día D produce el intervalo `[D 22:00, D+1 06:00)`.

```
intervalosDelDia(dia):
  if dia.horaFin > dia.horaInicio:  → [ (fecha+horaInicio, fecha+horaFin) ]
  else (cruza medianoche):          → [ (fecha+horaInicio, (fecha+1)+horaFin) ]
```

**Regla de imputación de fecha (decisión de producto):** las horas de un servicio se imputan al
**día de INICIO del servicio** para totales mensuales (así "la noche del 31" cuenta en su mes de
inicio), pero la **nocturnidad y la festividad se computan por el instante real de cada hora**
(una hora trabajada a las 02:00 del día 1 es nocturna y, si el día 1 es festivo, festiva). Esto
resuelve el cambio de mes y el festivo a caballo de medianoche de forma coherente.

### 3.2 Horas totales

```
horasTotales(rango) = Σ duración(intervalo) para todo servicio con clase='trabajo'
```

`saliente` computa según su `DefinicionServicio` (habitualmente 0 h de presencia si el cómputo ya
está en la noche previa; configurable para unidades que lo pagan). `disponibilidad` NO suma aquí:
va a `horasDisponibilidad` aparte (perspectiva 05 §4).

### 3.3 Horas nocturnas (franja configurable)

Franja nocturna por defecto **22:00–06:00 (a verificar)**, configurable por cuerpo. Se calcula la
**intersección** de cada intervalo de trabajo con la franja nocturna, día a día (la franja también
cruza medianoche):

```
horasNocturnas = Σ solape(intervaloTrabajo, franjaNocturna_de_cada_dia_natural_que_toca)
```

Ejemplo: `22:00→06:00` con franja 22:00–06:00 → 8 h nocturnas. `14:00→22:00` → 0 h. `20:00→24:00`
→ 2 h (22:00–24:00). Se computa por intersección de intervalos, nunca por "tipo de turno", para
que un turno recortado a mano dé el número real.

### 3.4 Horas festivas (nacional + autonómico + LOCAL)

Conjunto de festivos = `festivosNacionales ∪ festivosCCAA(perfil) ∪ festivosMunicipio(perfil) ∪
cuadrante.festivosExtra`. Una hora es festiva si su **instante real** cae en un día del conjunto:

```
horasFestivas = Σ duración( intervaloTrabajo ∩ díasFestivos )
```

Casos que las perspectivas exigen resolver:
- **Festivo que cae en día libre** → 0 h festivas trabajadas (no genera complemento), pero se
  marca en el calendario. (Perspectiva 05 §4: "festivo en servicio vs. en libranza".)
- **Festivo local** del municipio del Puesto/plantilla → incluido (perspectivas 04 §4 y 05 §4);
  casi ninguna app lo mete y es justo lo que más se trabaja.
- **Noche que empieza en laborable y termina en festivo** (o al revés) → cada hora se clasifica
  por su instante: las horas ya del día festivo son festivas; las anteriores no.

### 3.5 Fines de semana

```
horasFinDeSemana = Σ duración(intervaloTrabajo ∩ (sábados ∪ domingos))
```

Se reporta por separado de "festivas" porque el complemento de "domingos y festivos" a veces los
agrupa y a veces no (configurable por cuerpo/convenio). Se evita el doble cómputo mostrando ambos
desglosados.

### 3.6 Exceso sobre jornada de referencia (configurable, NO 37,5 genérico)

`jornadaRefHorasSemana` es **por cuerpo/convenio** (perspectivas 04, 05 y 06 lo exigen: la GC no
usa 37,5 h; el Local usa su convenio). Dos modos:

```
excesoSemanal(semana)   = max(0, horasTrabajadas(semana) - jornadaRefHorasSemana)
excesoAnual(año)        = max(0, horasTrabajadas(año)   - computoAnualRefHoras)   // si se configura
```

Se muestran ambos porque muchos cuerpos liquidan por cómputo anual, no semanal. El "exceso" es
**orientativo para reclamar/cotejar**, con aviso de que la app no es la nómina oficial.

### 3.7 Salida del resumen (mensual y anual)

```
Totales = {
  horasTotales, horasNocturnas, horasFestivas, horasFinDeSemana,
  horasDisponibilidad, diasTrabajados, diasLibres, saliente,
  excesoSemanal[], excesoAnual, desgloseporTipoServicio
}
```

---

## 4. Fiabilidad: por qué NO perderá datos

Cuatro capas defensivas. El objetivo explícito: **reproducir el bug de SPPLB debe ser imposible
por construcción, no solo improbable.**

### 4.1 Guardado atómico local (write-ahead + rename atómico)

- Persistencia en **SQLite (expo-sqlite) en modo WAL** (write-ahead logging) → cada escritura es
  transaccional y atómica; un cierre de app a media escritura no corrompe la base.
- El cuadrante se guarda en **una transacción** que escribe patrón + excepciones juntos; si algo
  falla, `ROLLBACK` y el estado anterior queda intacto (nunca un estado a medias).
- Para el respaldo/export a fichero: patrón **write-temp + fsync + rename atómico** (se escribe a
  `cuadrante.tmp`, se sincroniza y se renombra sobre `cuadrante.json`; el rename es atómico en el
  FS). Nunca se trunca el fichero bueno antes de tener el nuevo completo.
- **Autosave por campo**, no "guardar" manual: cada edición de un día es una fila UPSERT por
  `fecha`. No hay un botón "Guardar" que el usuario pueda olvidar (una de las causas de pérdida en
  apps tipo SPPLB).

### 4.2 Esquema de migraciones versionadas

- `Cuadrante.schemaVersion` (entero monotónico). Al abrir, si `schemaVersion < versiónActual`, se
  ejecuta una **cadena de migraciones puras** `v(n) → v(n+1)`, cada una testeada.
- **Regla de oro de migración:** una migración **nunca borra** un campo desconocido ni una
  excepción; en la duda, **conserva** (los datos del usuario se preservan aunque el esquema
  evolucione). Migración hacia adelante siempre; los campos que ya no se usan se archivan, no se
  eliminan.
- Antes de migrar: **snapshot** del estado previo (`cuadrante.bak.vN`) para poder revertir si la
  migración fallara. Esto ataca directamente el patrón de SPPLB "una actualización borró mi
  cuadrante".

### 4.3 Respaldo opcional cifrado (opt-in, servidor no puede leer)

- Modelo ya previsto: `CuadranteBackup { deviceId, blobCifrado, actualizadoEl }` (user.ts).
- **Cifrado en el dispositivo** con clave en Keychain/Keystore (spec §7.1). El servidor guarda un
  blob opaco: no puede leer el cuadrante de nadie (requisito de confianza de agente receloso,
  perspectiva 05 §7).
- **Sincronización last-write-wins por campo** usando `editadoEl` de cada `DiaCuadrante` (no por
  blob entero), para que restaurar en un móvil nuevo no pise ediciones más recientes.
- Restaurar es **aditivo y no destructivo**: ante conflicto, gana el `editadoEl` más reciente y se
  conserva copia del descartado en un log local. Cambiar de móvil = "restaurar compras" para el
  cuadrante (perspectivas 04/05/06 lo piden: "no lo vuelvo a usar si pierde datos una vez").

### 4.4 Cómo esto mata el bug de "no guarda" de SPPLB (resumen causal)

| Causa raíz probable en SPPLB | Defensa en "Agente" |
|---|---|
| Blob mutable único; regenerar pisa ediciones | Patrón y excepciones separados; excepción siempre gana (§1) |
| Guardado no atómico; cierre a media escritura corrompe | SQLite WAL + transacciones + temp/rename atómico (§4.1) |
| Migración de versión borra datos | Migraciones puras que conservan + snapshot previo (§4.2) |
| Cambio de móvil = todo perdido | Respaldo cifrado opt-in, restauración no destructiva (§4.3) |
| Botón "guardar" olvidado | Autosave por campo, sin acción manual (§4.1) |

### 4.5 Estrategia de tests (casos límite)

El motor de horas y la proyección son **funciones puras** → tests unitarios deterministas, sin
mocks. Se congela "ahora" y la zona horaria (Europe/Madrid) en el test. Casos límite obligatorios:

- **Cambio de mes**: noche del 31→1 imputada a su mes de inicio; totales de ambos meses cuadran.
- **Medianoche**: `22:00→06:00` = 8 h totales y 8 h nocturnas exactas; sin duplicar ni perder hora.
- **Festivo que cae en libre**: 0 h festivas trabajadas, marca visible, no genera complemento.
- **DST (cambio de hora)**: noche del cambio de octubre (25 h reales) y de marzo (23 h) → el motor
  cuenta horas de reloj reales, no asume 8 h fijas. Es el test que más apps fallan.
- **Regeneración**: cambiar el patrón NO altera ninguna excepción (property test: para todo día
  editado, su valor es idéntico antes y después de regenerar).
- **Redondeo**: minutos → horas con la regla acordada (2 decimales), sin acumular error mensual.

---

## 5. Interacción

- **Vista mensual** (calendario): cada día muestra tipo de servicio (color + **texto**, nunca solo
  color — accesibilidad, spec §5), badge de nota/alarma/cambio, y marca de festivo (nacional /
  autonómico / **local** con badge distinto). Cabecera con acumulado del mes (totales, nocturnas,
  festivas, exceso).
- **Editar un día → bottom sheet** (spec §4.9, perspectivas 04 §6 "toque grande, una mano"):
  cambiar tipo de servicio, ajustar horas inicio/fin, **cambio de servicio** con compañero (nota
  "cubre X"), añadir **servicio extraordinario** suelto, nota libre (solo dispositivo), y
  **alarma** (minutos antes → notificación local `expo-notifications`).
- **Cambios de servicio**: registro que no rompe el patrón (es una excepción). Se puede "deshacer"
  para volver a la proyección del patrón (borra la excepción de esa fecha).
- **Notas y alarmas**: locales; la alarma dispara notificación local antes del turno.
- **Exportar mes a PDF/CSV** para **cotejar con la nómina** (necesidad sentida en las tres
  perspectivas): CSV con una fila por día (fecha, tipo, inicio, fin, horas, nocturnas, festiva
  sí/no, findesemana sí/no, nota) y un pie de totales; PDF legible para enseñar al jefe.
- Todo **offline**; sin login para usar el cuadrante (spec §9: el cuadrante sigue disponible sin
  suscripción para no perder datos y fomentar retorno).

---

## 6. Extensión futura: estimación orientativa de complementos (spec §3.2.9, §11 Fase 6)

A partir de los totales (§3), estimación **orientativa** (con aviso "no es tu nómina") por cuerpo:

```
estimaComplementos(totales, tarifas_por_cuerpo) = {
  nocturnidad = horasNocturnas × tarifaHoraNocturna,
  festividad  = (horasFestivas + horasDomingo) × tarifaHoraFestiva,   // según convenio agrupe o no
  exceso      = excesoAnual × tarifaHoraExtra,
  disponibilidad = horasDisponibilidad × tarifaDisponibilidad,
}
```

- `tarifas_por_cuerpo` es **contenido configurable** (paquete + editable por el usuario), NO
  cableado. Empezar por Guardia Civil (Fase 6, spec §11).
- Valor de negocio (perspectiva 04 §9): "me dice qué nocturnas/festivas me deberían pagar este
  mes" → engancha y da razón de pago. Siempre con la coletilla de que la liquidación oficial manda.

---

## 7. Los 12 tests imprescindibles del cálculo de horas

Cada uno es un test unitario del motor puro, con `ahora` y zona horaria congelados.

1. **Turno de día simple.** `manana 07:00→15:00` → 8 h totales, 0 nocturnas, 0 festivas. Base.
2. **Noche a caballo de medianoche.** `noche 22:00→06:00` → 8 h totales, **8 h nocturnas**, sin
   duplicar la hora del solape ni perderla.
3. **Solape parcial con franja nocturna.** `tarde 20:00→24:00`, franja 22:00–06:00 → 4 h totales,
   **2 h nocturnas** (22:00–24:00). Verifica intersección, no clasificación por tipo.
4. **Cambio de mes (noche del 31).** `noche 31/01 22:00→06:00` → horas imputadas al mes de inicio;
   la hora 00:00–06:00 del día 1 sigue siendo nocturna; totales de enero y febrero cuadran.
5. **Festivo trabajado.** Servicio en 25/12 (festivo nacional) → todas sus horas cuentan como
   festivas.
6. **Festivo que cae en libre.** 25/12 con servicio `libre` → **0 h festivas trabajadas**, marca
   visible, sin complemento. (Perspectivas 04/05 lo exigen.)
7. **Festivo LOCAL del municipio.** Fiesta patronal en `festivosExtra`/municipio del perfil →
   cuenta como festiva aunque no sea nacional ni autonómica.
8. **Noche que cruza a festivo.** `noche 24/12 22:00→06:00`: 22:00–24:00 laborable, 00:00–06:00 del
   25/12 festivo → **2 h no festivas + 6 h festivas** (clasificación por instante real).
9. **DST octubre (día de 25 h).** Noche del cambio de hora de otoño → cuenta la hora repetida:
   totales reflejan horas de reloj reales, no 8 h asumidas.
10. **DST marzo (día de 23 h).** Noche del cambio de primavera → cuenta la hora saltada: totales
    reflejan horas reales.
11. **Exceso sobre jornada configurable.** Semana con 42 h y `jornadaRef=37,5` → exceso 4,5 h; con
    `jornadaRef=40` (otro cuerpo) → exceso 2 h. Verifica que NO está cableado a 37,5.
12. **Regeneración no destructiva (property test).** Con un cuadrante que tiene N excepciones,
    cambiar el patrón y regenerar → **las N excepciones son idénticas** antes y después; solo
    cambian los días proyectados. Es el test que garantiza "no pierde datos".

*(Casos límite adicionales recomendados: saliente con 0 h vs. saliente pagado; disponibilidad que
no suma a presencia; redondeo de minutos sin deriva mensual; solape de dos servicios el mismo día
tras un cambio con compañero.)*

---

## Apéndice · Acciones concretas para `packages/shared`

1. Añadir a `TipoServicio`: `'disponibilidad'` y `'servicio_extra'` (con migración de esquema).
2. Sustituir `PatronTurno.horasPorTipo: record` por `definiciones: DefinicionServicio[]` con franja
   horaria y `computaPresencia`/`clase`.
3. Añadir a `Cuadrante`: `schemaVersion`, `franjaNocturna`, `computoAnualRefHoras`, `festivosExtra`.
4. Añadir a `DiaCuadrante`: `origen: 'manual'` y `editadoEl` (para respaldo last-write-wins por campo).
5. Mantener `jornadaRefHorasSemana` pero **quitar el default 37,5 como "verdad"**: pasa a valor por
   defecto por cuerpo, editable.

*Documento de diseño. Toda referencia legal (franja nocturna, jornadas, complementos) va "a
verificar" contra BOE/convenio antes de publicarse.*
