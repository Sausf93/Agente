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

/** Campos comunes del ENCABEZADO neutro (cuerpo/unidad como texto que el agente rellena). */
function campoCuerpo(): CampoPlantilla {
  return {
    clave: 'cuerpo',
    etiqueta: 'Cuerpo o dependencia',
    tipo: 'texto',
    esDatoTercero: false,
    recordar: true,
    placeholder: 'Ej.: Unidad de Seguridad Ciudadana',
    hint: 'Texto libre. La app no imprime escudos ni denominaciones oficiales.',
  };
}

function campoUnidad(): CampoPlantilla {
  return {
    clave: 'unidad',
    etiqueta: 'Unidad, puesto o número de agente',
    tipo: 'texto',
    esDatoTercero: false,
    recordar: true,
    placeholder: 'Ej.: Puesto de …',
  };
}

/** Campos comunes del SERVICIO (cuándo y dónde) — datos del agente, no de terceros. */
const campoFecha: CampoPlantilla = {
  clave: 'fecha',
  etiqueta: 'Fecha',
  tipo: 'fecha',
  esDatoTercero: false,
  placeholder: 'dd/mm/aaaa',
};
const campoHora: CampoPlantilla = {
  clave: 'hora',
  etiqueta: 'Hora',
  tipo: 'hora',
  esDatoTercero: false,
  placeholder: 'hh:mm',
};
const campoLugar: CampoPlantilla = {
  clave: 'lugar',
  etiqueta: 'Lugar (vía, punto kilométrico, municipio)',
  tipo: 'texto',
  esDatoTercero: false,
  placeholder: 'Ej.: A-7, PK 623, término de …',
  hint: 'El punto kilométrico se autocompletará desde el mapa en una versión posterior.',
};
const campoObservaciones: CampoPlantilla = {
  clave: 'observaciones',
  etiqueta: 'Observaciones',
  tipo: 'multilinea',
  esDatoTercero: false,
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

**{{cuerpo}}** · {{unidad}}

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
    { clave: 'numeroBoletin', etiqueta: 'Nº de boletín', tipo: 'texto', esDatoTercero: false },
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
      placeholder: 'Descripción del hecho (se prerrellena desde la ficha).',
    },
    { clave: 'norma', etiqueta: 'Norma', tipo: 'texto', esDatoTercero: false },
    { clave: 'articulo', etiqueta: 'Artículo', tipo: 'texto', esDatoTercero: false },
    { clave: 'gravedad', etiqueta: 'Calificación (gravedad)', tipo: 'texto', esDatoTercero: false },
    { clave: 'importe', etiqueta: 'Importe de la sanción', tipo: 'texto', esDatoTercero: false },
    { clave: 'puntos', etiqueta: 'Puntos a detraer', tipo: 'texto', esDatoTercero: false },
    campoObservaciones,
  ],
};

// ---------------------------------------------------------------------------
// 2. Acta de inmovilización
// ---------------------------------------------------------------------------
const INMOVILIZACION_MD = `# Acta de inmovilización de vehículo

**{{cuerpo}}** · {{unidad}}

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
    },
    { clave: 'articulo', etiqueta: 'Precepto aplicable', tipo: 'texto', esDatoTercero: false },
    {
      clave: 'deposito',
      etiqueta: 'Lugar de depósito o traslado',
      tipo: 'texto',
      esDatoTercero: false,
    },
    campoObservaciones,
  ],
};

// ---------------------------------------------------------------------------
// 3. Diligencia de identificación
// ---------------------------------------------------------------------------
const IDENTIFICACION_MD = `# Diligencia de identificación

**{{cuerpo}}** · {{unidad}}

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
    },
    {
      clave: 'amparo',
      etiqueta: 'Amparo legal',
      tipo: 'texto',
      esDatoTercero: false,
      placeholder: 'Ej.: art. 16 LO 4/2015',
    },
    campoObservaciones,
  ],
};

/** Catálogo de plantillas de la v1 (orden de presentación en la pestaña Documentos). */
export const PLANTILLAS_SEED: PlantillaDoc[] = [
  boletinDenuncia,
  actaInmovilizacion,
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
