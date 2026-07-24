// Nom de la columna d'identificador autogenerat (mateixa lògica que
// isIdHeader_ a Código.js: es compara ignorant majúscules/minúscules).
// No s'ofereix mai com a editable.
const ID_HEADER = 'id';
function isIdHeader(header) {
  return String(header == null ? '' : header).trim().toLowerCase() === ID_HEADER;
}

// "DATA" (full "Preus per dia") es genera sola a partir de Dia/Mes/
// Excepte (vegeu computeDataDescription_ a Código.js) — mai s'edita a
// mà, ni des de la taula ni des del formulari.
const DATA_HEADER = 'DATA';
function isDataHeader(header) {
  return String(header == null ? '' : header).trim() === DATA_HEADER;
}

/* Etiquetes i explicacions llegibles per a cada pestanya del Sheet.
   Els noms de full (claus) no es toquen — només com es mostren aquí.
   Si un full no hi surt (o li canvies el nom a Google Sheets), es mostra
   el seu nom tal qual, sense hint. */
const SHEET_INFO = {
  'Hoja 1': { label: 'Serveis', hint: 'Serveis addicionals (DJ, menús, fotografia...): preu i a quines finques i anys s\'apliquen.' },
  'PreusMenu': { label: 'Preus menu', hint: 'Preu per persona segons finca, any, dia de la setmana i mes.' },
  'BarraLliure': { label: 'Barra lliure', hint: 'Tarifes de barra lliure per finca i any.' },
  'Coctel': { label: 'Còctel', hint: 'Preu per persona i mínim de convidats segons masia, any, dia de la setmana i mes. Mas Vivencs comparteix taula amb Can Macià.' },
  'CoctelExtres': { label: 'Extres Còctel', hint: 'Extres propis del format Còctel (menú infantil, aperitiu al jardí...): preu i masia/any als quals s\'apliquen.' },
};

// Fulls on s'ofereixen filtres (vegeu renderFilters a render.js): els
// noms tècnics de "Serveis", "Preus per dia" i "Còctel".
const SERVICES_SHEET_NAME = 'Hoja 1';
const CALENDAR_SHEET_NAME = 'PreusMenu';
const BARRA_SHEET_NAME = 'BarraLliure';
const COCTEL_SHEET_NAME = 'Coctel';
const COCTEL_EXTRES_SHEET_NAME = 'CoctelExtres';

// Fulls amb vista de calendari (commutador Taula/Calendari): mateixa
// lògica per a tots (any → mes → dia), però cadascun amb les seves
// pròpies columnes de "mínim"/"preu" (vegeu CALENDAR_COLUMNS_BY_SHEET).
const CALENDAR_VIEW_SHEETS = [CALENDAR_SHEET_NAME, COCTEL_SHEET_NAME];
function isCalendarViewSheet(sheetName) {
  return CALENDAR_VIEW_SHEETS.indexOf(sheetName) !== -1;
}

// Noms de columna que la vista de calendari fa servir per mostrar el
// mínim de convidats i el preu, diferents a cada full de calendari.
// preuComp (preu compensat) només existeix a "Preus menu".
const CALENDAR_COLUMNS_BY_SHEET = {
  'PreusMenu': { min: 'MÍN', preuP: 'PREU/P', preuComp: 'PreuComp' },
  'Coctel': { min: 'MinConvidats', preuP: 'PreuPersona', preuComp: null },
};

// Columnes que es veuen a la taula de cada full quan la casella
// "Simplifica" està activada (per defecte ho està). Els fulls que no
// hi surten no tenen aquesta casella.
const SIMPLIFY_TABLE_COLUMNS_BY_SHEET = {
  'PreusMenu': ['DATA', 'MÍN', 'PREU/P', 'Masia', 'Any'],
  'Hoja 1': ['Nom Servei', 'Masia', 'Any', 'Preu'],
  'Coctel': ['Masia', 'Any', 'Dia', 'Mes', 'MinConvidats', 'PreuPersona', 'PenalitzacioPerPersona'],
  'CoctelExtres': ['Nom Servei', 'Masia', 'Any', 'PreuPersona'],
};
function isSimplifiableSheet(sheetName) {
  return Object.prototype.hasOwnProperty.call(SIMPLIFY_TABLE_COLUMNS_BY_SHEET, sheetName);
}
function getSimplifyColumns(sheetName) {
  return SIMPLIFY_TABLE_COLUMNS_BY_SHEET[sheetName] || [];
}

// Classe CSS per amplada de columna (vegeu css/table.css): DATA
// necessita més espai (és una descripció, no un valor curt), MÍN/PREU/P/
// Any en necessiten menys.
const COLUMN_WIDTH_CLASSES = {
  'DATA': 'col-wide',
  'MÍN': 'col-narrow',
  'PREU/P': 'col-narrow',
  'Any': 'col-narrow',
  'MinConvidats': 'col-narrow',
  'PreuPersona': 'col-narrow',
  'PenalitzacioPerPersona': 'col-narrow',
  'MinimEuros': 'col-narrow',
};
function columnClassFor(header) {
  return COLUMN_WIDTH_CLASSES[header] || null;
}

const state = {
  sheets: [],
  currentName: null,
  headers: [],
  rows: [],
  loaded: false,
  filterMasia: [],
  filterAny: [],
  filterDia: [],
  filterMes: [],
  simplifyTable: true,
  sortColIndex: -1,
  sortDirection: 'asc',
  view: 'table',
  // 'years' (3 targetes d'any) → 'months' (12 targetes d'aquell any) →
  // 'month' (el calendari d'un mes concret, la vista de sempre).
  calendarLevel: 'years',
  calendarYear: null,
  calendarRefDate: new Date(),
  // Cau de dades ja carregades per full (nom -> {headers, rows}), perquè
  // canviar de pestanya no obligui a tornar a demanar-les al servidor.
  sheetCache: {},
};

// Cert si la fila conté algun dels valors seleccionats a la columna
// colIndex (la cel·la es divideix per comes, ja que una mateixa fila
// pot aplicar a diverses masies/anys/dies/mesos alhora). Sense
// selecció, o sense columna, no filtra res.
// options.emptyMeansAll: una cel·la buida es considera "aplica a tot"
// (cas de Dia/Mes al full "Preus per dia": buit = tots els dies/mesos).
// options.normalize: compara els valors normalitzats en lloc del text
// literal (calen per a Dia, on "Dissabte"/"Dissabtes" han de coincidir).
function rowMatchesValueFilter(row, colIndex, selectedValues, options) {
  options = options || {};
  if (!selectedValues.length || colIndex === -1) return true;
  const raw = String(row[colIndex] || '').trim();
  if (!raw) return Boolean(options.emptyMeansAll);
  const cellParts = raw.split(',').map(function (part) { return part.trim(); });
  if (options.normalize) {
    const normalizedSelected = selectedValues.map(options.normalize);
    return cellParts.some(function (part) { return normalizedSelected.indexOf(options.normalize(part)) !== -1; });
  }
  return selectedValues.some(function (value) { return cellParts.indexOf(value) !== -1; });
}

var DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g');
function normalizeText(value) {
  return String(value == null ? '' : value)
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase();
}

// Ordenació "com a l'Excel": si tots dos valors semblen un número
// (fins i tot formatats com "790,00 €"), es comparen numèricament;
// si no, com a text (ignorant accents/majúscules).
function parseSortableNumber(raw) {
  const str = String(raw == null ? '' : raw).trim();
  if (!str) return null;
  const cleaned = str.replace(/[^\d,.\-]/g, '');
  if (!cleaned) return null;
  const normalized = cleaned.indexOf(',') !== -1 ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const num = Number(normalized);
  return isNaN(num) ? null : num;
}

function compareForSort(a, b) {
  const numA = parseSortableNumber(a);
  const numB = parseSortableNumber(b);
  if (numA !== null && numB !== null) return numA - numB;
  return normalizeText(a).localeCompare(normalizeText(b), 'ca');
}

function padRow(row, width) {
  const copy = row.slice(0, width);
  while (copy.length < width) copy.push('');
  return copy;
}

function setStatus(message, type) {
  const el = document.getElementById('statusMsg');
  el.className = 'status' + (type ? ' is-' + type : '');
  el.innerHTML = (type === 'loading' || type === 'success' || type === 'error')
    ? '<span class="status-dot"></span><span>' + message + '</span>'
    : '<span>' + message + '</span>';
}

function onError(err) {
  setStatus(err && err.message ? err.message : String(err), 'error');
}
