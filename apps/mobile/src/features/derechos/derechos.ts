/**
 * LECTURA DE DERECHOS DEL DETENIDO — art. 520.2 LECrim, multilingüe (§4.11).
 *
 * DECISIÓN DE ARQUITECTURA (ADR-019): los textos del art. 520 son legales, estables y
 * multilingües; se EMBEBEN como recurso bundlado (esta constante tipada), NO en el paquete
 * SQLite de contenido ni en `@agente/shared`. Motivos:
 *   - Deben estar SIEMPRE disponibles offline, sin depender de que haya un paquete instalado
 *     (el agente puede necesitar leer derechos el primer día, antes de la primera descarga).
 *   - `@agente/shared` ya exporta un `TextoDerechos` (fila de base de datos: id, idioma, texto,
 *     audioUrl) para el modelo servidor→dispositivo. El tipo de AQUÍ es un recurso bundlado con
 *     otra forma (apartados + estado de revisión de la traducción); duplicar el nombre en shared
 *     sería una colisión. Por eso vive en la feature de la app.
 *
 * FILOSOFÍA DE REVISIÓN (igual que `pendiente_revision` del contenido): el español es literal
 * de la redacción vigente del art. 520.2 LECrim y va `revisado: true`. El resto de idiomas son
 * TRADUCCIONES FIELES pero NO cotejadas con la versión oficial del Ministerio del Interior:
 * van `revisado: false` con una `nota` que obliga a cotejarlas antes de publicar.
 *
 * Contenido español en el dominio; identificadores en inglés. Sin dependencias de React Native:
 * módulo PURO y testeable con Vitest.
 */

/**
 * Idiomas de esta entrega (§4.11). Códigos ISO 639-1. Orden PENSADO para intervención:
 *  1) `es` (castellano, literal del BOE); 2) las LENGUAS COOFICIALES del Estado (`ca`, `eu`,
 *     `gl`), de uso diario para los cuerpos autonómicos (Mossos, Ertzaintza, Foral, Canaria);
 *  3) los europeos más frecuentes en intervención (`en`, `fr`, `de`, `it`, `pt`, `ro`);
 *  4) el eslavo cirílico frecuente (`ru`, `uk`), el chino (`zh`) y, al final, el árabe (RTL).
 */
export const IDIOMAS_DERECHOS = [
  'es',
  'ca',
  'eu',
  'gl',
  'en',
  'fr',
  'de',
  'it',
  'pt',
  'ro',
  'ru',
  'uk',
  'zh',
  'ar',
] as const;
export type IdiomaDerechos = (typeof IDIOMAS_DERECHOS)[number];

/** Metadatos de presentación de cada idioma (endónimo = como se llama en su propia lengua). */
export interface IdiomaMeta {
  readonly codigo: IdiomaDerechos;
  /** Nombre del idioma en español (para el agente). */
  readonly nombre: string;
  /** Endónimo (para que el detenido reconozca su idioma en el selector). */
  readonly endonimo: string;
  /** Escritura de derecha a izquierda (árabe): la pantalla ajusta la alineación. */
  readonly rtl: boolean;
}

export const IDIOMAS_META: Readonly<Record<IdiomaDerechos, IdiomaMeta>> = {
  es: { codigo: 'es', nombre: 'Español', endonimo: 'Español', rtl: false },
  // Lenguas cooficiales del Estado (uso diario de los cuerpos autonómicos).
  ca: { codigo: 'ca', nombre: 'Catalán', endonimo: 'Català', rtl: false },
  eu: { codigo: 'eu', nombre: 'Euskera', endonimo: 'Euskara', rtl: false },
  gl: { codigo: 'gl', nombre: 'Gallego', endonimo: 'Galego', rtl: false },
  en: { codigo: 'en', nombre: 'Inglés', endonimo: 'English', rtl: false },
  fr: { codigo: 'fr', nombre: 'Francés', endonimo: 'Français', rtl: false },
  de: { codigo: 'de', nombre: 'Alemán', endonimo: 'Deutsch', rtl: false },
  it: { codigo: 'it', nombre: 'Italiano', endonimo: 'Italiano', rtl: false },
  pt: { codigo: 'pt', nombre: 'Portugués', endonimo: 'Português', rtl: false },
  ro: { codigo: 'ro', nombre: 'Rumano', endonimo: 'Română', rtl: false },
  // Eslavo cirílico frecuente en intervención.
  ru: { codigo: 'ru', nombre: 'Ruso', endonimo: 'Русский', rtl: false },
  uk: { codigo: 'uk', nombre: 'Ucraniano', endonimo: 'Українська', rtl: false },
  zh: { codigo: 'zh', nombre: 'Chino', endonimo: '中文', rtl: false },
  // Árabe: único idioma de escritura de derecha a izquierda; se coloca al final del selector.
  ar: { codigo: 'ar', nombre: 'Árabe', endonimo: 'العربية', rtl: true },
};

/**
 * Apartados del art. 520.2 LECrim, en el ORDEN en que se leen. La clave es estable (identificador
 * en inglés); la etiqueta en español la muestra la UI y sirve de ancla para la traducción.
 */
export const APARTADOS_520 = [
  'informacion',
  'silencio',
  'noDeclararContraSi',
  'abogado',
  'accesoActuaciones',
  'comunicacionDetencion',
  'comunicacionTercero',
  'asistenciaConsular',
  'interprete',
  'reconocimientoMedico',
  'habeasCorpus',
  'plazoDetencion',
] as const;
export type ApartadoDerechos520 = (typeof APARTADOS_520)[number];

/** Etiqueta corta en español de cada apartado (encabezado en la UI). */
export const ETIQUETAS_APARTADOS: Readonly<Record<ApartadoDerechos520, string>> = {
  informacion: 'Información de la detención',
  silencio: 'Derecho a guardar silencio',
  noDeclararContraSi: 'No declarar contra sí mismo',
  abogado: 'Derecho a abogado',
  accesoActuaciones: 'Acceso a las actuaciones',
  comunicacionDetencion: 'Comunicación de la detención',
  comunicacionTercero: 'Comunicación con un tercero',
  asistenciaConsular: 'Asistencia consular',
  interprete: 'Derecho a intérprete',
  reconocimientoMedico: 'Reconocimiento médico',
  habeasCorpus: 'Habeas Corpus',
  plazoDetencion: 'Plazo de la detención',
};

/** Texto de un idioma: cada apartado del art. 520.2 con su párrafo. */
export type TextoApartados = Readonly<Record<ApartadoDerechos520, string>>;

/**
 * Texto de la lectura de derechos en un idioma. `textoNativo` es lo que se lee en voz alta al
 * detenido; `textoEs` es la referencia en español del MISMO contenido (para que el agente
 * verifique qué está leyendo). Único origen de verdad del español: `APARTADOS_ES`.
 */
export interface TextoDerechos {
  readonly articulo: '520';
  readonly idioma: IdiomaDerechos;
  /** `true` solo si es literal/fiel a la fuente oficial. El español, sí; el resto, no (aún). */
  readonly revisado: boolean;
  /** Aviso de qué falta cotejar cuando `revisado` es `false`; `null` si está revisado. */
  readonly nota: string | null;
  /** Los apartados del art. 520.2 en el idioma nativo. */
  readonly textoNativo: TextoApartados;
  /** Los mismos apartados en español (referencia BOE). */
  readonly textoEs: TextoApartados;
}

// ---------------------------------------------------------------------------
// Español — redacción vigente del art. 520.2 LECrim, en lenguaje sencillo y accesible
// (el propio artículo exige "lenguaje sencillo y accesible"). Fuente única del español.
// ---------------------------------------------------------------------------
const APARTADOS_ES: TextoApartados = {
  informacion:
    'Queda usted detenido. Tiene derecho a ser informado, de forma inmediata y comprensible, de los hechos que se le atribuyen y de las razones de su detención.',
  silencio:
    'Tiene derecho a guardar silencio, a no declarar si no quiere, a no contestar a alguna de las preguntas, o a declarar únicamente ante el juez.',
  noDeclararContraSi: 'Tiene derecho a no declarar contra sí mismo y a no confesarse culpable.',
  abogado:
    'Tiene derecho a designar abogado y a ser asistido por él sin demora injustificada. Si no lo designa, se le nombrará uno de oficio.',
  accesoActuaciones:
    'Tiene derecho a acceder a los elementos de las actuaciones que sean esenciales para impugnar la legalidad de su detención.',
  comunicacionDetencion:
    'Tiene derecho a que se comunique a un familiar o a la persona que usted desee el hecho de su detención y el lugar en que se encuentra en cada momento.',
  comunicacionTercero:
    'Tiene derecho a comunicarse telefónicamente, sin demora injustificada, con un tercero de su elección.',
  asistenciaConsular:
    'Si es usted extranjero, tiene derecho a que se comunique su detención a la oficina consular de su país y a comunicarse con ella.',
  interprete:
    'Tiene derecho a ser asistido gratuitamente por un intérprete si no comprende o no habla el castellano, o si es una persona sorda o con discapacidad auditiva.',
  reconocimientoMedico:
    'Tiene derecho a ser reconocido por el médico forense o su sustituto legal y, en su defecto, por el de la institución en que se encuentre.',
  habeasCorpus:
    'Tiene derecho a solicitar el procedimiento de Habeas Corpus si considera que su detención no es legal.',
  plazoDetencion:
    'Su detención durará el tiempo estrictamente necesario y no podrá superar 72 horas sin ser puesto a disposición de la autoridad judicial.',
};

// ---------------------------------------------------------------------------
// Traducciones (revisado: false). Fieles, PERO pendientes de cotejo con la versión oficial
// del Ministerio del Interior antes de publicar.
// ---------------------------------------------------------------------------

// Lenguas cooficiales del Estado (§4.11). Uso diario de los cuerpos autonómicos.
const APARTADOS_CA: TextoApartados = {
  informacion:
    'Queda vostè detingut. Té dret a ser informat, de manera immediata i comprensible, dels fets que se li atribueixen i de les raons de la seva detenció.',
  silencio:
    'Té dret a guardar silenci, a no declarar si no ho vol, a no contestar alguna de les preguntes, o a declarar únicament davant el jutge.',
  noDeclararContraSi: 'Té dret a no declarar contra si mateix i a no confessar-se culpable.',
  abogado:
    'Té dret a designar un advocat i a ser assistit per ell sense demora injustificada. Si no en designa cap, se n’hi nomenarà un d’ofici.',
  accesoActuaciones:
    'Té dret a accedir als elements de les actuacions que siguin essencials per impugnar la legalitat de la seva detenció.',
  comunicacionDetencion:
    'Té dret que es comuniqui a un familiar o a la persona que vostè desitgi el fet de la seva detenció i el lloc on es troba en cada moment.',
  comunicacionTercero:
    'Té dret a comunicar-se telefònicament, sense demora injustificada, amb un tercer de la seva elecció.',
  asistenciaConsular:
    'Si vostè és estranger, té dret que es comuniqui la seva detenció a l’oficina consular del seu país i a comunicar-s’hi.',
  interprete:
    'Té dret a ser assistit gratuïtament per un intèrpret si no comprèn o no parla el castellà, o si és una persona sorda o amb discapacitat auditiva.',
  reconocimientoMedico:
    'Té dret a ser reconegut pel metge forense o el seu substitut legal i, si no n’hi ha, pel de la institució on es trobi.',
  habeasCorpus:
    'Té dret a sol·licitar el procediment d’Habeas Corpus si considera que la seva detenció no és legal.',
  plazoDetencion:
    'La seva detenció durarà el temps estrictament necessari i no podrà superar les 72 hores sense ser posat a disposició de l’autoritat judicial.',
};

const APARTADOS_EU: TextoApartados = {
  informacion:
    'Atxilotuta zaude. Eskubidea duzu berehala eta modu ulergarrian jakinarazteko egozten zaizkizun egitateak eta zure atxiloketaren arrazoiak.',
  silencio:
    'Isilik egoteko eskubidea duzu, nahi ez baduzu ez deklaratzeko, galdera batzuei ez erantzuteko, edo epailearen aurrean bakarrik deklaratzeko.',
  noDeclararContraSi: 'Zure aurka ez deklaratzeko eta errudun ez aitortzeko eskubidea duzu.',
  abogado:
    'Abokatu bat izendatzeko eta hark bidegabeko atzerapenik gabe lagundu diezazun eskubidea duzu. Izendatzen ez baduzu, ofiziozko bat izendatuko zaizu.',
  accesoActuaciones:
    'Zure atxiloketaren legezkotasuna aurkaratzeko funtsezkoak diren jardun-elementuetara sartzeko eskubidea duzu.',
  comunicacionDetencion:
    'Eskubidea duzu senide bati edo nahi duzun pertsonari zure atxiloketaren berri eta une oro zauden lekuaren berri eman diezaieten.',
  comunicacionTercero:
    'Telefonoz, bidegabeko atzerapenik gabe, zuk aukeratutako hirugarren batekin komunikatzeko eskubidea duzu.',
  asistenciaConsular:
    'Atzerritarra bazara, eskubidea duzu zure atxiloketaren berri zure herrialdeko kontsulatuari eman diezaioten eta harekin komunikatzeko.',
  interprete:
    'Gaztelania ulertzen edo hitz egiten ez baduzu, edo gorra edo entzumen-desgaitasuna baduzu, doako interprete baten laguntza izateko eskubidea duzu.',
  reconocimientoMedico:
    'Auzitegiko medikuak edo haren legezko ordezkoak, eta halakorik ezean zauden erakundeko medikuak, azter zaitzan eskubidea duzu.',
  habeasCorpus:
    'Habeas Corpus prozedura eskatzeko eskubidea duzu, zure atxiloketa legezkoa ez dela uste baduzu.',
  plazoDetencion:
    'Zure atxiloketak behar-beharrezko denbora iraungo du, eta ezin izango ditu 72 ordu gainditu agintaritza judizialaren esku jarri gabe.',
};

const APARTADOS_GL: TextoApartados = {
  informacion:
    'Queda vostede detido. Ten dereito a ser informado, de forma inmediata e comprensible, dos feitos que se lle atribúen e das razóns da súa detención.',
  silencio:
    'Ten dereito a gardar silencio, a non declarar se non quere, a non contestar algunha das preguntas, ou a declarar unicamente ante o xuíz.',
  noDeclararContraSi: 'Ten dereito a non declarar contra si mesmo e a non confesarse culpable.',
  abogado:
    'Ten dereito a designar avogado e a ser asistido por el sen demora inxustificada. Se non o designa, nomearáselle un de oficio.',
  accesoActuaciones:
    'Ten dereito a acceder aos elementos das actuacións que sexan esenciais para impugnar a legalidade da súa detención.',
  comunicacionDetencion:
    'Ten dereito a que se comunique a un familiar ou á persoa que vostede desexe o feito da súa detención e o lugar no que se atopa en cada momento.',
  comunicacionTercero:
    'Ten dereito a comunicarse telefonicamente, sen demora inxustificada, cun terceiro da súa elección.',
  asistenciaConsular:
    'Se vostede é estranxeiro, ten dereito a que se comunique a súa detención á oficina consular do seu país e a comunicarse con ela.',
  interprete:
    'Ten dereito a ser asistido gratuitamente por un intérprete se non comprende ou non fala o castelán, ou se é unha persoa xorda ou con discapacidade auditiva.',
  reconocimientoMedico:
    'Ten dereito a ser recoñecido polo médico forense ou o seu substituto legal e, na súa falta, polo da institución na que se atope.',
  habeasCorpus:
    'Ten dereito a solicitar o procedemento de Habeas Corpus se considera que a súa detención non é legal.',
  plazoDetencion:
    'A súa detención durará o tempo estritamente necesario e non poderá superar as 72 horas sen ser posto a disposición da autoridade xudicial.',
};

const APARTADOS_EN: TextoApartados = {
  informacion:
    'You are under arrest. You have the right to be informed, immediately and in a way you understand, of the acts you are accused of and the reasons for your arrest.',
  silencio:
    'You have the right to remain silent, not to make any statement if you do not wish to, not to answer some of the questions, or to make a statement only before the judge.',
  noDeclararContraSi:
    'You have the right not to testify against yourself and not to confess guilt.',
  abogado:
    'You have the right to appoint a lawyer and to be assisted by them without undue delay. If you do not appoint one, a court-appointed lawyer will be provided.',
  accesoActuaciones:
    'You have the right to access the elements of the case file that are essential to challenge the lawfulness of your arrest.',
  comunicacionDetencion:
    'You have the right to have a family member or a person of your choice informed of your arrest and of the place where you are held at all times.',
  comunicacionTercero:
    'You have the right to communicate by telephone, without undue delay, with a third party of your choice.',
  asistenciaConsular:
    'If you are a foreign national, you have the right to have your arrest notified to your country’s consular office and to communicate with it.',
  interprete:
    'You have the right to be assisted free of charge by an interpreter if you do not understand or speak Spanish, or if you are deaf or hearing-impaired.',
  reconocimientoMedico:
    'You have the right to be examined by the forensic doctor or their legal substitute and, failing that, by the doctor of the institution where you are held.',
  habeasCorpus:
    'You have the right to request the Habeas Corpus procedure if you believe your detention is unlawful.',
  plazoDetencion:
    'Your detention will last only as long as strictly necessary and may not exceed 72 hours without being brought before the judicial authority.',
};

const APARTADOS_FR: TextoApartados = {
  informacion:
    'Vous êtes en état d’arrestation. Vous avez le droit d’être informé, immédiatement et de manière compréhensible, des faits qui vous sont reprochés et des motifs de votre arrestation.',
  silencio:
    'Vous avez le droit de garder le silence, de ne pas déclarer si vous ne le souhaitez pas, de ne pas répondre à certaines questions, ou de ne déclarer que devant le juge.',
  noDeclararContraSi:
    'Vous avez le droit de ne pas témoigner contre vous-même et de ne pas vous avouer coupable.',
  abogado:
    'Vous avez le droit de désigner un avocat et d’être assisté par lui sans délai injustifié. À défaut, un avocat commis d’office vous sera désigné.',
  accesoActuaciones:
    'Vous avez le droit d’accéder aux éléments du dossier essentiels pour contester la légalité de votre arrestation.',
  comunicacionDetencion:
    'Vous avez le droit de faire informer un membre de votre famille ou la personne de votre choix de votre arrestation et du lieu où vous vous trouvez à tout moment.',
  comunicacionTercero:
    'Vous avez le droit de communiquer par téléphone, sans délai injustifié, avec un tiers de votre choix.',
  asistenciaConsular:
    'Si vous êtes étranger, vous avez le droit de faire notifier votre arrestation au bureau consulaire de votre pays et de communiquer avec lui.',
  interprete:
    'Vous avez le droit d’être assisté gratuitement par un interprète si vous ne comprenez pas ou ne parlez pas l’espagnol, ou si vous êtes sourd ou malentendant.',
  reconocimientoMedico:
    'Vous avez le droit d’être examiné par le médecin légiste ou son remplaçant et, à défaut, par le médecin de l’établissement où vous vous trouvez.',
  habeasCorpus:
    'Vous avez le droit de demander la procédure d’Habeas Corpus si vous estimez que votre détention n’est pas légale.',
  plazoDetencion:
    'Votre détention durera le temps strictement nécessaire et ne pourra excéder 72 heures sans que vous soyez présenté à l’autorité judiciaire.',
};

const APARTADOS_DE: TextoApartados = {
  informacion:
    'Sie sind festgenommen. Sie haben das Recht, unverzüglich und in verständlicher Weise über die Ihnen zur Last gelegten Taten und die Gründe Ihrer Festnahme informiert zu werden.',
  silencio:
    'Sie haben das Recht zu schweigen, keine Aussage zu machen, wenn Sie dies nicht wünschen, einzelne Fragen nicht zu beantworten oder nur vor dem Richter auszusagen.',
  noDeclararContraSi:
    'Sie haben das Recht, nicht gegen sich selbst auszusagen und sich nicht schuldig zu bekennen.',
  abogado:
    'Sie haben das Recht, einen Anwalt zu benennen und ohne ungerechtfertigte Verzögerung von ihm unterstützt zu werden. Andernfalls wird Ihnen ein Pflichtverteidiger bestellt.',
  accesoActuaciones:
    'Sie haben das Recht, Einsicht in die für die Anfechtung der Rechtmäßigkeit Ihrer Festnahme wesentlichen Bestandteile der Akte zu nehmen.',
  comunicacionDetencion:
    'Sie haben das Recht, dass ein Familienangehöriger oder eine Person Ihrer Wahl jederzeit über Ihre Festnahme und den Ort Ihres Verbleibs benachrichtigt wird.',
  comunicacionTercero:
    'Sie haben das Recht, ohne ungerechtfertigte Verzögerung telefonisch mit einer Person Ihrer Wahl zu kommunizieren.',
  asistenciaConsular:
    'Wenn Sie Ausländer sind, haben Sie das Recht, dass Ihre Festnahme der konsularischen Vertretung Ihres Landes mitgeteilt wird, und mit ihr zu kommunizieren.',
  interprete:
    'Sie haben das Recht auf unentgeltliche Unterstützung durch einen Dolmetscher, wenn Sie Spanisch nicht verstehen oder sprechen oder wenn Sie gehörlos oder hörgeschädigt sind.',
  reconocimientoMedico:
    'Sie haben das Recht, von einem Gerichtsmediziner oder dessen Vertreter und andernfalls von dem Arzt der Einrichtung, in der Sie sich befinden, untersucht zu werden.',
  habeasCorpus:
    'Sie haben das Recht, das Habeas-Corpus-Verfahren zu beantragen, wenn Sie Ihre Festnahme für rechtswidrig halten.',
  plazoDetencion:
    'Ihre Festnahme dauert nur so lange wie unbedingt erforderlich und darf 72 Stunden nicht überschreiten, ohne dass Sie der Justizbehörde vorgeführt werden.',
};

const APARTADOS_AR: TextoApartados = {
  informacion:
    'أنت الآن قيد الاحتجاز. لك الحق في أن تُبلَّغ فوراً وبطريقة مفهومة بالوقائع المنسوبة إليك وبأسباب احتجازك.',
  silencio:
    'لك الحق في التزام الصمت وعدم الإدلاء بأي تصريح إن لم ترغب، وعدم الإجابة عن بعض الأسئلة، أو الإدلاء بأقوالك أمام القاضي فقط.',
  noDeclararContraSi: 'لك الحق في عدم الشهادة ضد نفسك وعدم الاعتراف بالذنب.',
  abogado:
    'لك الحق في تعيين محامٍ وفي أن يساعدك دون تأخير غير مبرر. وإن لم تُعيّن محامياً، يُنتدب لك محامٍ تلقائياً.',
  accesoActuaciones: 'لك الحق في الاطلاع على عناصر الملف الأساسية للطعن في مشروعية احتجازك.',
  comunicacionDetencion:
    'لك الحق في إبلاغ أحد أفراد أسرتك أو أي شخص تختاره باحتجازك وبمكان وجودك في كل لحظة.',
  comunicacionTercero: 'لك الحق في الاتصال هاتفياً، دون تأخير غير مبرر، بشخص من اختيارك.',
  asistenciaConsular:
    'إذا كنت أجنبياً، فلك الحق في إبلاغ القنصلية التابعة لبلدك باحتجازك والتواصل معها.',
  interprete:
    'لك الحق في الاستعانة مجاناً بمترجم فوري إذا كنت لا تفهم أو لا تتحدث الإسبانية، أو إذا كنت أصمّ أو تعاني من ضعف في السمع.',
  reconocimientoMedico:
    'لك الحق في أن يفحصك الطبيب الشرعي أو من ينوب عنه قانوناً، وإلا فطبيب المؤسسة التي تُوجد فيها.',
  habeasCorpus:
    'لك الحق في طلب إجراء المثول أمام القضاء (Habeas Corpus) إذا رأيت أن احتجازك غير قانوني.',
  plazoDetencion:
    'لن يستمر احتجازك إلا للمدة الضرورية القصوى، ولا يجوز أن يتجاوز 72 ساعة دون عرضك على السلطة القضائية.',
};

const APARTADOS_RO: TextoApartados = {
  informacion:
    'Sunteți reținut. Aveți dreptul de a fi informat, imediat și într-un mod pe care îl înțelegeți, despre faptele care vi se impută și despre motivele reținerii dumneavoastră.',
  silencio:
    'Aveți dreptul de a păstra tăcerea, de a nu da nicio declarație dacă nu doriți, de a nu răspunde la unele întrebări sau de a declara doar în fața judecătorului.',
  noDeclararContraSi:
    'Aveți dreptul de a nu depune mărturie împotriva dumneavoastră și de a nu vă recunoaște vinovat.',
  abogado:
    'Aveți dreptul de a desemna un avocat și de a fi asistat de acesta fără întârziere nejustificată. Dacă nu desemnați unul, vi se va numi un avocat din oficiu.',
  accesoActuaciones:
    'Aveți dreptul de a avea acces la elementele esențiale ale dosarului pentru a contesta legalitatea reținerii dumneavoastră.',
  comunicacionDetencion:
    'Aveți dreptul ca un membru al familiei sau o persoană aleasă de dumneavoastră să fie informat despre reținerea dumneavoastră și despre locul în care vă aflați în fiecare moment.',
  comunicacionTercero:
    'Aveți dreptul de a comunica telefonic, fără întârziere nejustificată, cu o terță persoană aleasă de dumneavoastră.',
  asistenciaConsular:
    'Dacă sunteți străin, aveți dreptul ca reținerea dumneavoastră să fie comunicată oficiului consular al țării dumneavoastră și de a comunica cu acesta.',
  interprete:
    'Aveți dreptul de a fi asistat gratuit de un interpret dacă nu înțelegeți sau nu vorbiți limba spaniolă, sau dacă sunteți surd ori cu deficiențe de auz.',
  reconocimientoMedico:
    'Aveți dreptul de a fi examinat de medicul legist sau de înlocuitorul acestuia și, în lipsa acestuia, de medicul instituției în care vă aflați.',
  habeasCorpus:
    'Aveți dreptul de a solicita procedura Habeas Corpus dacă considerați că reținerea dumneavoastră nu este legală.',
  plazoDetencion:
    'Reținerea dumneavoastră va dura doar timpul strict necesar și nu poate depăși 72 de ore fără a fi prezentat autorității judiciare.',
};

const APARTADOS_IT: TextoApartados = {
  informacion:
    'Lei è in stato di arresto. Ha il diritto di essere informato, in modo immediato e comprensibile, dei fatti che le vengono attribuiti e dei motivi del suo arresto.',
  silencio:
    'Ha il diritto di rimanere in silenzio, di non rendere dichiarazioni se non lo desidera, di non rispondere ad alcune domande, o di dichiarare soltanto dinanzi al giudice.',
  noDeclararContraSi:
    'Ha il diritto di non testimoniare contro sé stesso e di non dichiararsi colpevole.',
  abogado:
    'Ha il diritto di nominare un avvocato e di essere assistito da lui senza ingiustificato ritardo. Se non lo nomina, gliene sarà nominato uno d’ufficio.',
  accesoActuaciones:
    'Ha il diritto di accedere agli elementi degli atti che siano essenziali per impugnare la legittimità del suo arresto.',
  comunicacionDetencion:
    'Ha il diritto di far comunicare a un familiare o alla persona che desidera il fatto del suo arresto e il luogo in cui si trova in ogni momento.',
  comunicacionTercero:
    'Ha il diritto di comunicare telefonicamente, senza ingiustificato ritardo, con un terzo di sua scelta.',
  asistenciaConsular:
    'Se è straniero, ha il diritto di far comunicare il suo arresto all’ufficio consolare del suo paese e di comunicare con esso.',
  interprete:
    'Ha il diritto di essere assistito gratuitamente da un interprete se non comprende o non parla lo spagnolo, o se è una persona sorda o con disabilità uditiva.',
  reconocimientoMedico:
    'Ha il diritto di essere esaminato dal medico legale o dal suo sostituto legale e, in mancanza, da quello dell’istituzione in cui si trova.',
  habeasCorpus:
    'Ha il diritto di richiedere la procedura di Habeas Corpus se ritiene che il suo arresto non sia legittimo.',
  plazoDetencion:
    'Il suo arresto durerà il tempo strettamente necessario e non potrà superare le 72 ore senza essere messo a disposizione dell’autorità giudiziaria.',
};

const APARTADOS_PT: TextoApartados = {
  informacion:
    'Fica o senhor detido. Tem direito a ser informado, de forma imediata e compreensível, dos factos que lhe são imputados e das razões da sua detenção.',
  silencio:
    'Tem direito a guardar silêncio, a não declarar se não quiser, a não responder a algumas das perguntas, ou a declarar unicamente perante o juiz.',
  noDeclararContraSi: 'Tem direito a não declarar contra si próprio e a não se confessar culpado.',
  abogado:
    'Tem direito a designar advogado e a ser assistido por ele sem demora injustificada. Se não o designar, ser-lhe-á nomeado um oficiosamente.',
  accesoActuaciones:
    'Tem direito a aceder aos elementos das atuações que sejam essenciais para impugnar a legalidade da sua detenção.',
  comunicacionDetencion:
    'Tem direito a que se comunique a um familiar ou à pessoa que desejar o facto da sua detenção e o lugar em que se encontra a cada momento.',
  comunicacionTercero:
    'Tem direito a comunicar-se telefonicamente, sem demora injustificada, com um terceiro à sua escolha.',
  asistenciaConsular:
    'Se for estrangeiro, tem direito a que se comunique a sua detenção à repartição consular do seu país e a comunicar-se com ela.',
  interprete:
    'Tem direito a ser assistido gratuitamente por um intérprete se não compreender ou não falar o castelhano, ou se for uma pessoa surda ou com deficiência auditiva.',
  reconocimientoMedico:
    'Tem direito a ser examinado pelo médico legista ou pelo seu substituto legal e, na sua falta, pelo da instituição em que se encontre.',
  habeasCorpus:
    'Tem direito a solicitar o procedimento de Habeas Corpus se considerar que a sua detenção não é legal.',
  plazoDetencion:
    'A sua detenção durará o tempo estritamente necessário e não poderá exceder 72 horas sem ser posto à disposição da autoridade judicial.',
};

const APARTADOS_RU: TextoApartados = {
  informacion:
    'Вы задержаны. Вы имеете право быть незамедлительно и в понятной форме проинформированным о деяниях, которые вам вменяются, и о причинах вашего задержания.',
  silencio:
    'Вы имеете право хранить молчание, не давать показаний, если не желаете, не отвечать на некоторые вопросы или давать показания только перед судьёй.',
  noDeclararContraSi:
    'Вы имеете право не свидетельствовать против самого себя и не признавать себя виновным.',
  abogado:
    'Вы имеете право назначить адвоката и получать его помощь без необоснованной задержки. Если вы его не назначите, вам будет назначен адвокат по назначению.',
  accesoActuaciones:
    'Вы имеете право на доступ к материалам дела, которые являются существенными для оспаривания законности вашего задержания.',
  comunicacionDetencion:
    'Вы имеете право на то, чтобы о факте вашего задержания и о месте вашего нахождения в каждый момент был уведомлён член семьи или лицо по вашему выбору.',
  comunicacionTercero:
    'Вы имеете право без необоснованной задержки связаться по телефону с третьим лицом по вашему выбору.',
  asistenciaConsular:
    'Если вы иностранец, вы имеете право на то, чтобы о вашем задержании было сообщено в консульское учреждение вашей страны, и на общение с ним.',
  interprete:
    'Вы имеете право на бесплатную помощь переводчика, если вы не понимаете или не говорите по-испански, либо если вы глухой или страдаете нарушением слуха.',
  reconocimientoMedico:
    'Вы имеете право на осмотр судебно-медицинским экспертом или его законным заместителем, а при его отсутствии — врачом учреждения, в котором вы находитесь.',
  habeasCorpus:
    'Вы имеете право потребовать применения процедуры Habeas Corpus, если считаете, что ваше задержание незаконно.',
  plazoDetencion:
    'Ваше задержание продлится строго необходимое время и не может превышать 72 часов без передачи в распоряжение судебного органа.',
};

const APARTADOS_UK: TextoApartados = {
  informacion:
    'Вас затримано. Ви маєте право бути негайно та у зрозумілій формі поінформованим про діяння, які вам інкримінуються, і про причини вашого затримання.',
  silencio:
    'Ви маєте право зберігати мовчання, не давати показань, якщо не бажаєте, не відповідати на деякі запитання або давати показання лише перед суддею.',
  noDeclararContraSi:
    'Ви маєте право не свідчити проти самого себе і не визнавати себе винним.',
  abogado:
    'Ви маєте право призначити адвоката і отримувати його допомогу без невиправданої затримки. Якщо ви його не призначите, вам буде призначено адвоката за призначенням.',
  accesoActuaciones:
    'Ви маєте право на доступ до матеріалів справи, які є суттєвими для оскарження законності вашого затримання.',
  comunicacionDetencion:
    'Ви маєте право на те, щоб про факт вашого затримання та про місце вашого перебування в кожний момент було повідомлено члена сім’ї або особу за вашим вибором.',
  comunicacionTercero:
    'Ви маєте право без невиправданої затримки зв’язатися по телефону з третьою особою за вашим вибором.',
  asistenciaConsular:
    'Якщо ви іноземець, ви маєте право на те, щоб про ваше затримання було повідомлено консульську установу вашої країни, і на спілкування з нею.',
  interprete:
    'Ви маєте право на безоплатну допомогу перекладача, якщо ви не розумієте або не розмовляєте іспанською, або якщо ви глухий чи маєте порушення слуху.',
  reconocimientoMedico:
    'Ви маєте право на огляд судово-медичним експертом або його законним заступником, а за його відсутності — лікарем установи, в якій ви перебуваєте.',
  habeasCorpus:
    'Ви маєте право вимагати застосування процедури Habeas Corpus, якщо вважаєте, що ваше затримання незаконне.',
  plazoDetencion:
    'Ваше затримання триватиме строго необхідний час і не може перевищувати 72 години без передання в розпорядження судового органу.',
};

const APARTADOS_ZH: TextoApartados = {
  informacion:
    '您已被拘留。您有权立即以您能理解的方式获知对您指控的事实以及拘留您的理由。',
  silencio:
    '您有权保持沉默，如不愿意可不作陈述，可不回答某些问题，或仅在法官面前作陈述。',
  noDeclararContraSi: '您有权不作出对自己不利的陈述，也有权不承认有罪。',
  abogado:
    '您有权指定一名律师，并在没有不当延误的情况下获得其协助。如您不指定，将为您指派一名公设律师。',
  accesoActuaciones: '您有权查阅案卷中对质疑拘留合法性至关重要的材料。',
  comunicacionDetencion:
    '您有权要求将您被拘留的事实以及您随时所在的地点通知一名家属或您所指定的人。',
  comunicacionTercero: '您有权在没有不当延误的情况下，以电话与您所选择的第三人联系。',
  asistenciaConsular: '如果您是外国人，您有权要求将您被拘留一事通知贵国领事馆，并与其联系。',
  interprete:
    '如果您不懂或不会说西班牙语，或您是聋人或有听力障碍，您有权获得免费口译员的协助。',
  reconocimientoMedico:
    '您有权接受法医或其合法替代人的检查；如无上述人员，则由您所在机构的医生检查。',
  habeasCorpus: '如果您认为拘留不合法，您有权申请人身保护令（Habeas Corpus）程序。',
  plazoDetencion: '您的拘留将仅持续严格必要的时间，未将您移交司法机关的情况下不得超过72小时。',
};

/** Nota común para las traducciones pendientes de cotejo (misma filosofía `pendiente_revision`). */
const NOTA_PENDIENTE =
  'Traducción fiel pendiente de cotejo con la versión oficial del Ministerio del Interior antes de publicar.';

/** Construye una entrada adjuntando SIEMPRE el español como referencia (fuente única). */
function crearTexto(
  idioma: IdiomaDerechos,
  revisado: boolean,
  textoNativo: TextoApartados,
): TextoDerechos {
  return {
    articulo: '520',
    idioma,
    revisado,
    nota: revisado ? null : NOTA_PENDIENTE,
    textoNativo,
    textoEs: APARTADOS_ES,
  };
}

/**
 * Textos de la lectura de derechos del art. 520.2 LECrim, por idioma. El español es literal de
 * la redacción vigente (`revisado: true`); el resto son traducciones fieles pendientes de cotejo.
 */
export const DERECHOS_520: Readonly<Record<IdiomaDerechos, TextoDerechos>> = {
  es: crearTexto('es', true, APARTADOS_ES),
  ca: crearTexto('ca', false, APARTADOS_CA),
  eu: crearTexto('eu', false, APARTADOS_EU),
  gl: crearTexto('gl', false, APARTADOS_GL),
  en: crearTexto('en', false, APARTADOS_EN),
  fr: crearTexto('fr', false, APARTADOS_FR),
  de: crearTexto('de', false, APARTADOS_DE),
  it: crearTexto('it', false, APARTADOS_IT),
  pt: crearTexto('pt', false, APARTADOS_PT),
  ro: crearTexto('ro', false, APARTADOS_RO),
  ru: crearTexto('ru', false, APARTADOS_RU),
  uk: crearTexto('uk', false, APARTADOS_UK),
  zh: crearTexto('zh', false, APARTADOS_ZH),
  ar: crearTexto('ar', false, APARTADOS_AR),
};

/** Devuelve los textos de un idioma (o los españoles si el código no existe). */
export function derechosPorIdioma(idioma: IdiomaDerechos): TextoDerechos {
  return DERECHOS_520[idioma] ?? DERECHOS_520.es;
}

/**
 * Compone el texto COMPLETO de un idioma para leer en voz alta o copiar: cada apartado en una
 * línea, en el orden del art. 520.2. No incluye encabezados: es el texto corrido para el detenido.
 */
export function textoCompleto(texto: TextoDerechos): string {
  return APARTADOS_520.map((clave) => texto.textoNativo[clave]).join('\n\n');
}
