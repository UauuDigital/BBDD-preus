// Capçalera de la columna d'any: es mostra com a desplegable d'un sol
// any dins un rang relatiu a l'any actual (es recalcula cada vegada,
// mai és una llista fixa d'anys). Mateix component visual que la resta
// de desplegables (vegeu buildDropdownField a multiselect.js).
const YEAR_HEADER = 'Any';
const YEAR_RANGE_BEFORE = 1;
const YEAR_RANGE_AFTER = 2;

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - YEAR_RANGE_BEFORE; year <= currentYear + YEAR_RANGE_AFTER; year++) {
    years.push(String(year));
  }
  return years;
}

function buildYearField(colIndex, initialValue) {
  const currentYear = String(new Date().getFullYear());
  return buildDropdownField(colIndex, initialValue || currentYear, getYearOptions(), false);
}
