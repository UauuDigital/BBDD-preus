// Capçalera de la columna d'any: es mostra com a desplegable d'un sol
// any dins un rang relatiu a l'any actual (es recalcula cada vegada,
// mai és una llista fixa d'anys).
const YEAR_HEADER = 'Any';
const YEAR_RANGE_BEFORE = 1;
const YEAR_RANGE_AFTER = 2;

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - YEAR_RANGE_BEFORE; year <= currentYear + YEAR_RANGE_AFTER; year++) {
    years.push(year);
  }
  return years;
}

function buildYearField(colIndex) {
  const select = document.createElement('select');
  select.id = 'addRowField' + colIndex;
  select.dataset.colIndex = String(colIndex);

  const currentYear = new Date().getFullYear();
  getYearOptions().forEach(function (year) {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    if (year === currentYear) option.selected = true;
    select.appendChild(option);
  });

  return select;
}
