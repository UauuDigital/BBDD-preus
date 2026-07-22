// Capçalera de la columna d'any: es mostra com a desplegable d'un sol
// any dins un rang relatiu a l'any actual (es recalcula cada vegada,
// mai és una llista fixa d'anys). Mateix component visual que la resta
// de desplegables (vegeu buildDropdownField a multiselect.js).
const YEAR_HEADER = 'Any';
const YEAR_RANGE_BEFORE = 1;
const YEAR_RANGE_AFTER = 2;

function getYearOptions(extraYear) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - YEAR_RANGE_BEFORE; year <= currentYear + YEAR_RANGE_AFTER; year++) {
    years.push(String(year));
  }
  // En editar una fila existent, el seu any pot quedar fora del rang
  // relatiu habitual (p.ex. una fila antiga): cal poder-lo mostrar igualment.
  if (extraYear && years.indexOf(String(extraYear)) === -1) {
    years.push(String(extraYear));
    years.sort();
  }
  return years;
}

// Colors per l'"Any" com les marques de les abelles reines apicultores:
// un color per any que es repeteix cada 5 anys (estàndard internacional
// "Will You Raise Good Bees" — blanc/groc/vermell/verd/blau).
// any acabat en 1 o 6 → blanc; 2 o 7 → groc; 3 o 8 → vermell;
// 4 o 9 → verd; 5 o 0 → blau.
const YEAR_QUEEN_BEE_COLORS = [
  'var(--year-blue)',   // resta 0: acabat en 5 o 0
  'var(--year-white)',  // resta 1: acabat en 1 o 6
  'var(--year-yellow)', // resta 2: acabat en 2 o 7
  'var(--year-red)',    // resta 3: acabat en 3 o 8
  'var(--year-green)',  // resta 4: acabat en 4 o 9
];

function getYearRelativeColor(yearValue) {
  const year = Number(yearValue);
  if (!year) return 'var(--year-neutral)';
  return YEAR_QUEEN_BEE_COLORS[((year % 5) + 5) % 5];
}

function buildYearField(colIndex, initialValue, idPrefix, getOptionColor) {
  const currentYear = String(new Date().getFullYear());
  const value = initialValue || currentYear;
  return buildDropdownField(colIndex, value, getYearOptions(value), false, idPrefix, undefined, getOptionColor);
}
