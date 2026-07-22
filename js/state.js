// Nom de la columna d'identificador autogenerat (mateixa lògica que
// isIdHeader_ a Código.js: es compara ignorant majúscules/minúscules).
// No s'ofereix mai com a editable.
const ID_HEADER = 'id';
function isIdHeader(header) {
  return String(header == null ? '' : header).trim().toLowerCase() === ID_HEADER;
}

/* Etiquetes i explicacions llegibles per a cada pestanya del Sheet.
   Els noms de full (claus) no es toquen — només com es mostren aquí.
   Si un full no hi surt (o li canvies el nom a Google Sheets), es mostra
   el seu nom tal qual, sense hint. */
const SHEET_INFO = {
  'Hoja 1': { label: 'Serveis', hint: 'Serveis addicionals (DJ, menús, fotografia...): preu i a quines finques i anys s\'apliquen.' },
  'PreusMenu': { label: 'Preus per dia', hint: 'Preu per persona segons finca, any, dia de la setmana i mes.' },
  'BarraLliure': { label: 'Barra lliure', hint: 'Tarifes de barra lliure per finca i any.' },
};

// Fulls on s'ofereixen filtres (vegeu renderFilters a render.js): els
// noms tècnics de "Serveis" i "Preus per dia".
const SERVICES_SHEET_NAME = 'Hoja 1';
const CALENDAR_SHEET_NAME = 'PreusMenu';

// Columnes que es veuen a la taula de "Preus per dia" quan la casella
// "Simplifica" està activada (per defecte ho està).
const SIMPLIFY_TABLE_COLUMNS = ['DATA', 'MÍN', 'PREU/P', 'Masia', 'Any'];

// Classe CSS per amplada de columna (vegeu css/table.css): DATA
// necessita més espai (és una descripció, no un valor curt), MÍN/PREU/P/
// Any en necessiten menys.
const COLUMN_WIDTH_CLASSES = {
  'DATA': 'col-wide',
  'MÍN': 'col-narrow',
  'PREU/P': 'col-narrow',
  'Any': 'col-narrow',
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
