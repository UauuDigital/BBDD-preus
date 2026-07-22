// Capçaleres booleanes: es mostren com a casella de verificació. El
// valor desat a la cel·la és "TRUE"/"FALSE" (el mateix format que fa
// servir Google Sheets per a les seves pròpies caselles de verificació).
const CHECKBOX_HEADERS = ['perConvidat', 'Optional', 'quantityBased', 'Extres', 'Desplegable'];

function buildCheckboxField(colIndex, initialValue, idPrefix) {
  const wrap = document.createElement('div');
  wrap.className = 'checkbox-field';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = (idPrefix || 'addRowField') + colIndex;
  checkbox.dataset.colIndex = String(colIndex);
  checkbox.checked = initialValue === 'TRUE';

  wrap.appendChild(checkbox);
  return wrap;
}
