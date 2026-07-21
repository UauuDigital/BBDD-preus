/* Etiquetes i explicacions llegibles per a cada pestanya del Sheet.
   Els noms de full (claus) no es toquen — només com es mostren aquí.
   Si un full no hi surt (o li canvies el nom a Google Sheets), es mostra
   el seu nom tal qual, sense hint. */
const SHEET_INFO = {
  'Hoja 1': { label: 'Serveis', hint: 'Serveis addicionals (DJ, menús, fotografia...): preu i a quines finques i anys s\'apliquen.' },
  'PreusMenu': { label: 'Preus per dia', hint: 'Preu per persona segons finca, any, dia de la setmana i mes.' },
  'BarraLliure': { label: 'Barra lliure', hint: 'Tarifes de barra lliure per finca i any.' },
};

const state = {
  sheets: [],
  currentName: null,
  headers: [],
  rows: [],
  loaded: false,
  filterQuery: '',
};

var DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g');
function normalizeText(value) {
  return String(value == null ? '' : value)
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase();
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
