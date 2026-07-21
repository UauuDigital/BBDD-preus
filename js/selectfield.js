// Capçaleres d'un sol valor que s'editen amb un desplegable uniselecció,
// amb les opcions calculades a partir dels valors ja existents a la
// columna (una per cel·la, no combinats amb comes).
const SELECT_HEADERS = ['Unit'];

function buildSelectField(colIndex) {
  const options = getDistinctColumnValues(colIndex, false);

  const select = document.createElement('select');
  select.id = 'addRowField' + colIndex;
  select.dataset.colIndex = String(colIndex);

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = options.length ? 'Selecciona...' : 'Encara no hi ha valors per triar';
  select.appendChild(placeholder);

  options.forEach(function (option) {
    const optionEl = document.createElement('option');
    optionEl.value = option;
    optionEl.textContent = option;
    select.appendChild(optionEl);
  });

  return select;
}
