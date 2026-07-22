// Capçaleres que guarden dos números separats per una coma en una
// mateixa cel·la (p.ex. "SiMin€" / "NoMin€" a "Barra lliure"): es
// mostren com dos <input type="number"> independents que es combinen
// en un únic valor "a,b" a l'input ocult amb data-col-index.
const DUAL_NUMBER_HEADERS = ['SiMin€', 'NoMin€'];

function parseDualNumberValue(raw) {
  const parts = String(raw || '').split(',').map(function (part) { return part.trim(); });
  return { a: parts[0] || '', b: parts[1] || '' };
}

function buildDualNumberField(colIndex, initialValue, idPrefix) {
  const wrap = document.createElement('div');
  wrap.className = 'dual-number-field';

  const parsed = parseDualNumberValue(initialValue);

  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.id = (idPrefix || 'addRowField') + colIndex;
  hidden.dataset.colIndex = String(colIndex);
  hidden.value = initialValue || '';

  function makeNumberInput(value, placeholder) {
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.placeholder = placeholder;
    input.className = 'dual-number-input';
    if (value) input.value = value;
    return input;
  }

  const inputA = makeNumberInput(parsed.a, 'Núm. 1');
  const inputB = makeNumberInput(parsed.b, 'Núm. 2');

  function syncHidden() {
    hidden.value = (inputA.value || '') + ',' + (inputB.value || '');
    hidden.dispatchEvent(new Event('change', { bubbles: true }));
  }
  inputA.addEventListener('change', syncHidden);
  inputB.addEventListener('change', syncHidden);

  const sep = document.createElement('span');
  sep.className = 'dual-number-sep';
  sep.textContent = ',';

  wrap.appendChild(inputA);
  wrap.appendChild(sep);
  wrap.appendChild(inputB);
  wrap.appendChild(hidden);
  return wrap;
}
