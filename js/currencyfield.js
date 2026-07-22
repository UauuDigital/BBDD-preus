// Capçaleres de moneda: es mostren com a camp numèric amb sufix "€".
const CURRENCY_HEADERS = ['Preu', 'Llindà preu X<0', 'Llindà preu 0<X'];

// Un <input type="number"> rebutja en silenci qualsevol valor que no
// sigui un número pur: una cel·la ja existent ve formatada pel Sheet
// (p.ex. "790,00 €"), cal netejar-la abans d'assignar-la o el camp es
// veuria buit. La coma es tracta com a separador decimal (format ca/es).
function parseCurrencyInputValue(raw) {
  if (raw === undefined || raw === null || raw === '') return '';
  const cleaned = String(raw).replace(/[^\d,.-]/g, '').trim();
  if (!cleaned) return '';
  const normalized = cleaned.indexOf(',') !== -1
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const num = Number(normalized);
  return isNaN(num) ? '' : String(num);
}

function buildCurrencyField(colIndex, initialValue, idPrefix) {
  const wrap = document.createElement('div');
  wrap.className = 'currency-field';

  const input = document.createElement('input');
  input.type = 'number';
  input.step = '0.01';
  input.id = (idPrefix || 'addRowField') + colIndex;
  input.dataset.colIndex = String(colIndex);
  const parsedValue = parseCurrencyInputValue(initialValue);
  if (parsedValue) input.value = parsedValue;

  const suffix = document.createElement('span');
  suffix.className = 'currency-suffix';
  suffix.textContent = '€';

  wrap.appendChild(input);
  wrap.appendChild(suffix);
  return wrap;
}
