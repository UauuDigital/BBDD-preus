// Secció "Llindà" del pas de desglossament: Principi/Final són numèrics,
// els dos preus són de moneda (reutilitza buildCurrencyField).
const LLINDA_HEADERS = {
  principi: 'Llindà Principi',
  final: 'Llindà Final',
  negatiu: 'Llindà preu X<0',
  positiu: 'Llindà preu 0<X',
};

function buildNumberField(colIndex, initialValue) {
  const input = document.createElement('input');
  input.type = 'number';
  input.id = 'addRowField' + colIndex;
  input.dataset.colIndex = String(colIndex);
  if (initialValue) input.value = initialValue;
  return input;
}

function buildLlindaSection() {
  const container = document.createElement('div');
  container.className = 'breakdown-section';

  const heading = document.createElement('h3');
  heading.className = 'section-heading';
  heading.textContent = 'Llindà';
  container.appendChild(heading);

  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'modal-fields modal-fields-nested';

  [
    { header: LLINDA_HEADERS.principi, build: buildNumberField },
    { header: LLINDA_HEADERS.final, build: buildNumberField },
    { header: LLINDA_HEADERS.negatiu, build: buildCurrencyField },
    { header: LLINDA_HEADERS.positiu, build: buildCurrencyField },
  ].forEach(function (def) {
    const colIndex = state.headers.indexOf(def.header);
    if (colIndex === -1) return;
    appendField(fieldsGrid, colIndex, def.header, def.build(colIndex, modalValues[colIndex]));
  });

  container.appendChild(fieldsGrid);
  return container;
}
