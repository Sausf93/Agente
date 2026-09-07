import { Plantilla } from '@agente/shared';
import type { CampoPlantilla, PlantillaDoc } from './campos';

/**
 * SEED de plantillas de documentos (v1, §4.8).
 *
 * Decisión (ver README y ADR de esta feature): en v1 las plantillas viajan como SEED ESTÁTICO
 * en la app, no en el paquete de contenido firmado. Motivos: (1) evitar regenerar y re-firmar el
 * paquete para tocar una plantilla durante la beta; (2) mantenerlo 100 % offline y Expo Go-safe.
 * El modelo `Plantilla` de `@agente/shared` sigue siendo la fuente de verdad del tipo; cuando el
 * panel de administración las edite, se moverán al paquete SIN cambiar este contrato.
 *
 * ENCABEZADO NEUTRO (regla innegociable): el cuerpo y la unidad son TEXTO que rellena el agente;
 * la app NO imprime escudos ni denominaciones oficiales por defecto (§4.8, §10). Los campos de
 * vehículo/persona van marcados como DATO DE TERCERO (solo en el dispositivo).
 *
 * LENGUAJE ORIENTATIVO en lo sensible (§4.6): "procede según el precepto citado", nunca imperativo.
 */

/**
 * Campos de IDENTIDAD del agente (encabezado neutro): cuerpo, unidad y nº de TIP. Se `recordar`an
 * entre documentos para no reescribirlos cada vez, y NUNCA son datos de terceros. La app no imprime
 * escudos ni denominaciones oficiales por defecto (§4.8, §10).
 */
function campoCuerpo(): CampoPlantilla {
  return {
    clave: 'cuerpo',
    etiqueta: 'Cuerpo o dependencia',
    tipo: 'texto',
    esDatoTercero: false,
    seccion: 'identidad',
    recordar: true,
    placeholder: 'Ej.: Unidad de Seguridad Ciudadana',
    hint: 'Texto libre. La app no imprime escudos ni denominaciones oficiales.',
  };
}

function campoUnidad(): CampoPlantilla {
  return {
    clave: 'unidad',
    etiqueta: 'Unidad o puesto',
    tipo: 'texto',
    esDatoTercero: false,
    seccion: 'identidad',
    recordar: true,
    placeholder: 'Ej.: Puesto de …',
  };
}

function campoTip(): CampoPlantilla {
  return {
    clave: 'numeroTip',
    etiqueta: 'Nº de TIP o carné profesional',
    tipo: 'texto',
    esDatoTercero: false,
    seccion: 'identidad',
    recordar: true,
    placeholder: 'Ej.: 12345',
    hint: 'Es tu identificación como agente, no un dato de terceros. Se recuerda para la próxima.',
  };
}

/** Campos comunes del SERVICIO (cuándo y dónde) — datos del agente, no de terceros. */
const campoFecha: CampoPlantilla = {
  clave: 'fecha',
  etiqueta: 'Fecha',
  tipo: 'fecha',
  esDatoTercero: false,
  seccion: 'servicio',
  placeholder: 'dd/mm/aaaa',
};
const campoHora: CampoPlantilla = {
  clave: 'hora',
  etiqueta: 'Hora',
  tipo: 'hora',
  esDatoTercero: false,
  seccion: 'servicio',
  placeholder: 'hh:mm',
};
const campoLugar: CampoPlantilla = {
  clave: 'lugar',
  etiqueta: 'Lugar (vía, punto kilométrico, municipio)',
  tipo: 'texto',
  esDatoTercero: false,
  seccion: 'servicio',
  placeholder: 'Ej.: A-7, PK 623, término de …',
  hint: 'El punto kilométrico se autocompletará desde el mapa en una versión posterior.',
};
const campoObservaciones: CampoPlantilla = {
  clave: 'observaciones',
  etiqueta: 'Observaciones',
  tipo: 'multilinea',
  esDatoTercero: false,
  seccion: 'servicio',
  placeholder: 'Detalles del hecho, testigos, diligencias practicadas…',
  hint: 'No incluyas más datos personales de los imprescindibles.',
};

/** Documento de identidad genérico — SIEMPRE dato de tercero. */
function campoDocumento(): CampoPlantilla {
  return {
    clave: 'documento',
    etiqueta: 'Documento de identidad (DNI/NIE/pasaporte)',
    tipo: 'texto',
    esDatoTercero: true,
  };
}

// ---------------------------------------------------------------------------
// 1. Boletín de denuncia administrativa
// ---------------------------------------------------------------------------
const BOLETIN_MD = `# Boletín de denuncia administrativa

**{{cuerpo}}** · {{unidad}} · TIP {{numeroTip}}

Nº de boletín: {{numeroBoletin}}

En **{{lugar}}**, siendo las **{{hora}}** horas del día **{{fecha}}**, por el agente actuante se formula la presente denuncia por los hechos que se describen.

## Vehículo y persona denunciada

- Matrícula: {{matricula}}
- Vehículo (marca y modelo): {{marcaModelo}}
- Persona denunciada: {{denunciado}}
- Documento de identidad: {{documento}}
- Domicilio a efectos de notificación: {{domicilio}}

## Hecho denunciado

{{hecho}}

Precepto infringido: **{{norma}}, {{articulo}}**. Calificación: **{{gravedad}}**.

Importe de la sanción: **{{importe}}**. Puntos a detraer: **{{puntos}}**.

## Observaciones

{{observaciones}}

---

El denunciado queda informado de su derecho a formular alegaciones en el plazo legalmente previsto. La presente denuncia se formula a los efectos de la incoación del procedimiento sancionador que corresponda.

Firma del agente actuante: __________
`;

const boletinDenuncia: PlantillaDoc = {
  id: 'seed-boletin-denuncia',
  tipo: 'boletin_denuncia',
  titulo: 'Boletín de denuncia administrativa',
  descripcion: 'Denuncia de tráfico o seguridad ciudadana con importe y precepto.',
  cuerpoAplicable: [],
  version: 1,
  markdownConVariables: BOLETIN_MD,
  campos: [
    campoCuerpo(),
    campoUnidad(),
    campoTip(),
    { clave: 'numeroBoletin', etiqueta: 'Nº de boletín', tipo: 'texto', esDatoTercero: false, seccion: 'servicio' },
    campoFecha,
    campoHora,
    campoLugar,
    {
      clave: 'matricula',
      etiqueta: 'Matrícula',
      tipo: 'texto',
      esDatoTercero: true,
    },
    {
      clave: 'marcaModelo',
      etiqueta: 'Marca y modelo del vehículo',
      tipo: 'texto',
      esDatoTercero: true,
    },
    {
      clave: 'denunciado',
      etiqueta: 'Persona denunciada (nombre y apellidos)',
      tipo: 'texto',
      esDatoTercero: true,
    },
    campoDocumento(),
    { clave: 'domicilio', etiqueta: 'Domicilio de notificación', tipo: 'texto', esDatoTercero: true },
    {
      clave: 'hecho',
      etiqueta: 'Hecho denunciado',
      tipo: 'multilinea',
      esDatoTercero: false,
      seccion: 'legal',
      placeholder: 'Descripción del hecho (se prerrellena desde la ficha).',
    },
    { clave: 'norma', etiqueta: 'Norma', tipo: 'texto', esDatoTercero: false, seccion: 'legal' },
    { clave: 'articulo', etiqueta: 'Artículo', tipo: 'texto', esDatoTercero: false, seccion: 'legal' },
    { clave: 'gravedad', etiqueta: 'Calificación (gravedad)', tipo: 'texto', esDatoTercero: false, seccion: 'legal' },
    { clave: 'importe', etiqueta: 'Importe de la sanción', tipo: 'texto', esDatoTercero: false, seccion: 'legal' },
    { clave: 'puntos', etiqueta: 'Puntos a detraer', tipo: 'texto', esDatoTercero: false, seccion: 'legal' },
    campoObservaciones,
  ],
};

// ---------------------------------------------------------------------------
// 2. Acta de inmovilización
// ---------------------------------------------------------------------------
const INMOVILIZACION_MD = `# Acta de inmovilización de vehículo

**{{cuerpo}}** · {{unidad}} · TIP {{numeroTip}}

En **{{lugar}}**, a las **{{hora}}** horas del día **{{fecha}}**, se procede a la inmovilización del vehículo que se describe, al concurrir causa legal para ello.

## Vehículo

- Matrícula: {{matricula}}
- Marca y modelo: {{marcaModelo}}
- Conductor: {{conductor}}
- Documento de identidad: {{documento}}

## Causa de la inmovilización

{{causa}}

Precepto aplicable: **{{articulo}}**.

Lugar de depósito o traslado: {{deposito}}

## Observaciones

{{observaciones}}

---

Orientación: la inmovilización procede según el precepto citado; su levantamiento se ajustará a la normativa aplicable y a la valoración del agente. Firma del agente actuante: __________
`;

const actaInmovilizacion: PlantillaDoc = {
  id: 'seed-acta-inmovilizacion',
  tipo: 'acta_inmovilizacion',
  titulo: 'Acta de inmovilización',
  descripcion: 'Inmovilización de vehículo con la causa y el precepto aplicable.',
  cuerpoAplicable: [],
  version: 1,
  markdownConVariables: INMOVILIZACION_MD,
  campos: [
    campoCuerpo(),
    campoUnidad(),
    campoTip(),
    campoFecha,
    campoHora,
    campoLugar,
    { clave: 'matricula', etiqueta: 'Matrícula', tipo: 'texto', esDatoTercero: true },
    { clave: 'marcaModelo', etiqueta: 'Marca y modelo', tipo: 'texto', esDatoTercero: true },
    {
      clave: 'conductor',
      etiqueta: 'Conductor (nombre y apellidos)',
      tipo: 'texto',
      esDatoTercero: true,
    },
    campoDocumento(),
    {
      clave: 'causa',
      etiqueta: 'Causa de la inmovilización',
      tipo: 'multilinea',
      esDatoTercero: false,
      seccion: 'servicio',
    },
    { clave: 'articulo', etiqueta: 'Precepto aplicable', tipo: 'texto', esDatoTercero: false, seccion: 'legal' },
    {
      clave: 'deposito',
      etiqueta: 'Lugar de depósito o traslado',
      tipo: 'texto',
      esDatoTercero: false,
      seccion: 'servicio',
    },
    campoObservaciones,
  ],
};

// ---------------------------------------------------------------------------
// 3. Diligencia de identificación
// ---------------------------------------------------------------------------
const IDENTIFICACION_MD = `# Diligencia de identificación

**{{cuerpo}}** · {{unidad}} · TIP {{numeroTip}}

En **{{lugar}}**, a las **{{hora}}** horas del día **{{fecha}}**, se practica diligencia de identificación de la persona que se reseña, en el ejercicio de las funciones de indagación y prevención.

## Persona identificada

- Nombre y apellidos: {{nombre}}
- Documento de identidad: {{documento}}
- Fecha de nacimiento: {{nacimiento}}
- Nacionalidad: {{nacionalidad}}
- Domicilio: {{domicilio}}

## Motivo de la identificación

{{motivo}}

Amparo legal: **{{amparo}}**.

## Observaciones

{{observaciones}}

---

Orientación: la identificación se practica conforme al precepto citado; su valoración final corresponde al agente y, en su caso, a la autoridad judicial. Firma del agente actuante: __________
`;

const diligenciaIdentificacion: PlantillaDoc = {
  id: 'seed-diligencia-identificacion',
  tipo: 'diligencia_identificacion',
  titulo: 'Diligencia de identificación',
  descripcion: 'Identificación de una persona con el motivo y su amparo legal.',
  cuerpoAplicable: [],
  version: 1,
  markdownConVariables: IDENTIFICACION_MD,
  campos: [
    campoCuerpo(),
    campoUnidad(),
    campoTip(),
    campoFecha,
    campoHora,
    campoLugar,
    {
      clave: 'nombre',
      etiqueta: 'Nombre y apellidos',
      tipo: 'texto',
      esDatoTercero: true,
    },
    campoDocumento(),
    { clave: 'nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'texto', esDatoTercero: true },
    { clave: 'nacionalidad', etiqueta: 'Nacionalidad', tipo: 'texto', esDatoTercero: true },
    { clave: 'domicilio', etiqueta: 'Domicilio', tipo: 'texto', esDatoTercero: true },
    {
      clave: 'motivo',
      etiqueta: 'Motivo de la identificación',
      tipo: 'multilinea',
      esDatoTercero: false,
      seccion: 'servicio',
    },
    {
      clave: 'amparo',
      etiqueta: 'Amparo legal',
      tipo: 'texto',
      esDatoTercero: false,
      seccion: 'servicio',
      placeholder: 'Ej.: art. 16 LO 4/2015',
    },
    campoObservaciones,
  ],
};

// ---------------------------------------------------------------------------
// 4. Acta de intervención de sustancias
// ---------------------------------------------------------------------------
const SUSTANCIAS_MD = `# Acta de intervención de sustancias

**{{cuerpo}}** · {{unidad}} · TIP {{numeroTip}}

En **{{lugar}}**, a las **{{hora}}** horas del día **{{fecha}}**, se procede a la intervención de las sustancias que se describen, a los efectos legales que correspondan.

## Persona a la que se interviene

- Nombre y apellidos: {{persona}}
- Documento de identidad: {{documento}}

## Sustancias intervenidas

- Descripción y presunta naturaleza: {{sustancia}}
- Cantidad o peso aproximado (bruto): {{cantidad}}
- Nº de envoltorios o unidades: {{envoltorios}}

Precepto aplicable: **{{articulo}}**.

Lugar de depósito o remisión: {{deposito}}

## Observaciones

{{observaciones}}

---

Orientación: la naturaleza y el peso son provisionales, a expensas del análisis oficial; la intervención se ajustará a la normativa aplicable y a la valoración del agente y, en su caso, de la autoridad competente. Firma del agente actuante: __________
`;

const actaIntervencionSustancias: PlantillaDoc = {
  id: 'seed-acta-intervencion-sustancias',
  tipo: 'acta_intervencion_sustancias',
  titulo: 'Acta de intervención de sustancias',
  descripcion: 'Intervención de sustancias con su descripción, peso provisional y precepto.',
  cuerpoAplicable: [],
  version: 1,
  markdownConVariables: SUSTANCIAS_MD,
  campos: [
    campoCuerpo(),
    campoUnidad(),
    campoTip(),
    campoFecha,
    campoHora,
    campoLugar,
    {
      clave: 'persona',
      etiqueta: 'Persona a la que se interviene (nombre y apellidos)',
      tipo: 'texto',
      esDatoTercero: true,
    },
    campoDocumento(),
    {
      clave: 'sustancia',
      etiqueta: 'Descripción y presunta naturaleza',
      tipo: 'multilinea',
      esDatoTercero: false,
      seccion: 'servicio',
      placeholder: 'Ej.: sustancia vegetal prensada, presuntamente hachís.',
    },
    {
      clave: 'cantidad',
      etiqueta: 'Cantidad o peso aproximado (bruto)',
      tipo: 'texto',
      esDatoTercero: false,
      seccion: 'servicio',
      placeholder: 'Ej.: 12 g (peso de báscula de campo, provisional)',
    },
    {
      clave: 'envoltorios',
      etiqueta: 'Nº de envoltorios o unidades',
      tipo: 'texto',
      esDatoTercero: false,
      seccion: 'servicio',
    },
    { clave: 'articulo', etiqueta: 'Precepto aplicable', tipo: 'texto', esDatoTercero: false, seccion: 'legal' },
    {
      clave: 'deposito',
      etiqueta: 'Lugar de depósito o remisión',
      tipo: 'texto',
      esDatoTercero: false,
      seccion: 'servicio',
    },
    campoObservaciones,
  ],
};

/** Catálogo de plantillas de la v1 (orden de presentación en la pestaña Documentos). */
export const PLANTILLAS_SEED: PlantillaDoc[] = [
  boletinDenuncia,
  actaInmovilizacion,
  actaIntervencionSustancias,
  diligenciaIdentificacion,
];

/** Busca una plantilla del seed por su id. */
export function plantillaPorId(id: string): PlantillaDoc | null {
  return PLANTILLAS_SEED.find((p) => p.id === id) ?? null;
}

/** Valida (en desarrollo/tests) que el seed cumple el contrato de `Plantilla` de `@agente/shared`. */
export function validarSeed(): void {
  for (const p of PLANTILLAS_SEED) {
    Plantilla.parse({
      id: p.id,
      tipo: p.tipo,
      titulo: p.titulo,
      cuerpoAplicable: p.cuerpoAplicable,
      markdownConVariables: p.markdownConVariables,
      version: p.version,
    });
  }
}
