// Capçaleres de moneda: es mostren com a camp numèric amb sufix "€".
const CURRENCY_HEADERS = ['Preu', 'Llindà Principi', 'Llindà Final', 'Llindà preu X<0', 'Llindà preu 0<X'];

function buildCurrencyField(colIndex) {
  const wrap = document.createElement('div');
  wrap.className = 'currency-field';

  const input = document.createElement('input');
  input.type = 'number';
  input.step = '0.01';
  input.id = 'addRowField' + colIndex;
  input.dataset.colIndex = String(colIndex);

  const suffix = document.createElement('span');
  suffix.className = 'currency-suffix';
  suffix.textContent = '€';

  wrap.appendChild(input);
  wrap.appendChild(suffix);
  return wrap;
}
