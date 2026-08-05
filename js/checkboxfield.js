// Capçaleres booleanes: es mostren com a casella de verificació. El
// valor desat a la cel·la és "TRUE"/"FALSE" (el mateix format que fa
// servir Google Sheets per a les seves pròpies caselles de verificació).
// "Desplegable" no hi és: aquella columna no guarda TRUE/FALSE, sinó el
// JSON de la llista d'opcions (vegeu DESPLEGABLE_HEADER a
// desplegabletable.js) — tractar-la com a casella hi sobreescriuria el
// contingut real en editar-la des de la taula.
const CHECKBOX_HEADERS = ['perConvidat', 'Optional', 'quantityBased', 'Extres'];

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
