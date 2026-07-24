// Regles i dades del full "Preus per dia" (PreusMenu). Cada fila NO és
// un dia concret: és una regla recurrent ("Dissabtes de Juny, Juliol,
// Setembre i Octubre", Masia, Any) que s'aplica a tots els dies del mes
// indicat que cauen en aquell dia de la setmana, per aquell any concret,
// excepte el dia (o dies) que indiqui "Excepte". La construcció de la
// interfície (dies, targetes d'any/mes...) viu a calendar-nav.js,
// calendar-day.js, calendar-legend.js i calendar-views.js.
const MONTH_NAMES_CA = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre',
];
const WEEKDAY_HEADER_NAMES_CA = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];

// Llista fixa dels 7 dies (com MASIA_OPTIONS per a Masia): opcions dels
// desplegables de la columna "Dia" a tots els fulls, en lloc de derivar-
// les només dels valors que ja existeixen en aquell full concret.
const WEEKDAY_OPTIONS_CA = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];

// Alguns dies de la setmana en català varien en singular/plural (les
// columnes fan servir totes dues formes indistintament: "Dissabte" i
// "Dissabtes"). 0 = diumenge, igual que Date#getDay().
const WEEKDAY_ALIASES_CA = {
  diumenge: 0, diumenges: 0,
  dilluns: 1,
  dimarts: 2,
  dimecres: 3,
  dijous: 4,
  divendres: 5,
  dissabte: 6, dissabtes: 6,
};

function normalizeWeekdayName(raw) {
  const key = normalizeText(raw).trim();
  return Object.prototype.hasOwnProperty.call(WEEKDAY_ALIASES_CA, key) ? WEEKDAY_ALIASES_CA[key] : null;
}

// Per filtrar la taula per "Dia": "Dissabte" i "Dissabtes" han de
// comptar com el mateix valor (a diferència d'una comparació de text
// literal). Es fa servir tant aquí com a render.js.
function normalizeDiaForFilter(raw) {
  const weekdayIndex = normalizeWeekdayName(raw);
  return weekdayIndex === null ? normalizeText(raw) : String(weekdayIndex);
}

// Busca, entre els valors reals que ja existeixen a una columna, el
// primer que normalitzat coincideixi amb el valor buscat — perquè el
// filtre que s'aplica en clicar un dia del calendari faci servir
// exactament el mateix text que ja hi ha al full (i el desplegable el
// mostri marcat), no un nom "canònic" inventat.
function findMatchingLiteralOption(colIndex, splitCombined, normalizeFn, targetNormalized) {
  if (colIndex === -1) return null;
  const options = getDistinctColumnValues(colIndex, splitCombined);
  for (let i = 0; i < options.length; i++) {
    if (normalizeFn(options[i]) === targetNormalized) return options[i];
  }
  return null;
}

// Dates conegudes que la columna "Excepte" sol fer servir com a nom en
// lloc d'una data. És una llista tancada: un text d'excepció no
// reconegut simplement no exclou cap dia (es podria ampliar aquí si
// n'apareixen més al full).
const KNOWN_EXCEPTION_DATES_CA = {
  "cap d'any": { month: 11, day: 31 },
  'any nou': { month: 0, day: 1 },
  'reis': { month: 0, day: 6 },
  'nadal': { month: 11, day: 25 },
  'sant esteve': { month: 11, day: 26 },
};

// Treu ",00" o ".00" d'un preu ja formatat pel Sheet (p.ex. "154,00 €"
// → "154 €"): només al calendari, no toca el valor real de la cel·la.
function formatPriceNoDecimals(raw) {
  return String(raw == null ? '' : raw).replace(/[.,]00(?=\s|€|$)/g, '');
}

function isExceptedDate(exceptionText, cellDate) {
  if (!exceptionText) return false;
  return String(exceptionText).split(',').some(function (part) {
    const known = KNOWN_EXCEPTION_DATES_CA[normalizeText(part).trim()];
    return known && cellDate.getMonth() === known.month && cellDate.getDate() === known.day;
  });
}

function getCalendarColIndexes() {
  const priceCols = CALENDAR_COLUMNS_BY_SHEET[state.currentName] || {};
  return {
    dia: state.headers.indexOf('Dia'),
    mes: state.headers.indexOf('Mes'),
    excepte: state.headers.indexOf('Excepte'),
    masia: state.headers.indexOf('Masia'),
    any: state.headers.indexOf('Any'),
    min: state.headers.indexOf(priceCols.min || 'MÍN'),
    preuP: state.headers.indexOf(priceCols.preuP || 'PREU/P'),
    preuComp: priceCols.preuComp ? state.headers.indexOf(priceCols.preuComp) : -1,
  };
}

// Files del full actual que compleixen els filtres de Masia/Any ja
// existents a la barra d'eines (es reutilitzen tal qual).
function getCalendarRows() {
  const masiaColIndex = state.headers.indexOf('Masia');
  const anyColIndex = state.headers.indexOf('Any');
  return state.rows.filter(function (row) {
    return rowMatchesValueFilter(row, masiaColIndex, state.filterMasia)
      && rowMatchesValueFilter(row, anyColIndex, state.filterAny);
  });
}

function ruleAppliesToDate(row, cols, cellDate) {
  if (String(row[cols.any] || '').trim() !== String(cellDate.getFullYear())) return false;

  // Cel·la buida = s'aplica a tots els dies de la setmana / mesos.
  // "Dia" pot llistar-ne diversos separats per comes (igual que "Mes").
  const diaRaw = String(row[cols.dia] || '').trim();
  if (diaRaw) {
    const weekdays = diaRaw.split(',').map(function (part) { return normalizeWeekdayName(part); });
    if (weekdays.indexOf(cellDate.getDay()) === -1) return false;
  }

  const mesRaw = String(row[cols.mes] || '').trim();
  if (mesRaw) {
    const months = mesRaw.split(',').map(function (part) { return normalizeText(part).trim(); }).filter(Boolean);
    if (months.indexOf(normalizeText(MONTH_NAMES_CA[cellDate.getMonth()])) === -1) return false;
  }

  if (isExceptedDate(row[cols.excepte], cellDate)) return false;

  return true;
}
