// Capçaleres booleanes: es mostren com a casella de verificació. El
// valor desat a la cel·la és "TRUE"/"FALSE" (el mateix format que fa
// servir Google Sheets per a les seves pròpies caselles de verificació).
const CHECKBOX_HEADERS = ['perConvidat', 'Optional', 'Extres', 'Desplegable'];

function buildCheckboxField(colIndex) {
  const wrap = document.createElement('div');
  wrap.className = 'checkbox-field';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'addRowField' + colIndex;
  checkbox.dataset.colIndex = String(colIndex);

  wrap.appendChild(checkbox);
  return wrap;
}
