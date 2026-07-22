// Construcció del camp d'edició d'una cel·la de la taula (mateix
// component que el formulari "+ Fila" per a les columnes que ja hi són
// desplegable/casella/moneda) i el desat immediat en canviar-lo.
const CELL_OPTION_COLORS = { 'Masia': getMasiaColor, 'Masies': getMasiaColor, 'Any': getYearRelativeColor };

// Construeix el mateix tipus de camp que el formulari de "+ Fila" per
// editar una cel·la ja existent (desplegable, casella, moneda...) en
// lloc d'un text lliure, per a les columnes que ja són d'aquest tipus
// al modal. idPrefix inclou la fila perquè cada control tingui un id
// únic (una mateixa columna es repeteix a totes les files).
function buildTableCellControl(header, colIndex, rowIndex, value) {
  const idPrefix = 'tableCellR' + rowIndex + '_';

  if (isIdHeader(header) || isDataHeader(header)) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cell-input cell-input-readonly';
    input.value = value;
    input.readOnly = true;
    return input;
  }

  let control;
  if (MULTISELECT_HEADERS.indexOf(header) !== -1) {
    control = buildMultiselectField(colIndex, value, undefined, idPrefix, CELL_OPTION_COLORS[header]);
  } else if (header === YEAR_HEADER) {
    control = buildYearField(colIndex, value, idPrefix, CELL_OPTION_COLORS[header]);
  } else if (SELECT_HEADERS.indexOf(header) !== -1) {
    control = buildSelectField(colIndex, value, undefined, idPrefix);
  } else if (CHECKBOX_HEADERS.indexOf(header) !== -1) {
    control = buildCheckboxField(colIndex, value, idPrefix);
  } else {
    // Els camps de moneda (Preu, Llindà preu X<0, Llindà preu 0<X) es
    // mantenen com a text pla a la taula (com PREU/P a "Preus per dia"):
    // el camp numèric amb "€" només és útil en crear una fila nova
    // (formulari "+ Fila"), no per veure un valor ja formatat pel Sheet.
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cell-input';
    input.value = value;
    input.dataset.original = value;
    input.dataset.colIndex = String(colIndex);
    input.addEventListener('input', function () { input.classList.add('dirty'); });
    control = input;
  }

  control.addEventListener('change', function () {
    const newValue = getCellControlValue(control);
    saveTableCell(rowIndex, colIndex, newValue, function () { renderTable(); }, function () {
      if (control.dataset) { control.dataset.original = newValue; }
      control.classList.remove('dirty');
    });
  });
  return control;
}

// L'element que ha de rebre l'aria-label: el botó visible (desplegable)
// o l'input real (text/moneda/casella), mai el <input type="hidden">
// intern d'un desplegable.
function getLabelableElement(control) {
  const trigger = control.querySelector && control.querySelector('.multiselect-trigger');
  if (trigger) return trigger;
  if (control.matches && control.matches('[data-col-index]')) return control;
  const inner = control.querySelector && control.querySelector('[data-col-index]');
  return inner || control;
}

// Llegeix el valor actual d'un control, sigui un <input> directe o un
// embolcall (moneda/casella/desplegable) amb l'input real a dins.
function getCellControlValue(control) {
  const el = (control.matches && control.matches('[data-col-index]')) ? control : control.querySelector('[data-col-index]');
  if (!el) return '';
  return el.type === 'checkbox' ? (el.checked ? 'TRUE' : 'FALSE') : el.value;
}

function saveTableCell(rowIndex, colIndex, newValue, onRevert, onSuccess) {
  const original = state.rows[rowIndex][colIndex];
  if (newValue === original) return;
  setStatus('Desant...', 'loading');
  google.script.run
    .withSuccessHandler(function (result) {
      state.rows[rowIndex][colIndex] = newValue;
      // En editar Dia/Mes/Excepte, el backend recalcula "DATA" per a
      // aquesta fila i en retorna el nou text: cal reflectir-ho aquí
      // (i tornar a pintar la taula, ja que "DATA" pot estar visible).
      const dataChanged = result && typeof result.dataColIndex === 'number';
      if (dataChanged) state.rows[rowIndex][result.dataColIndex] = result.dataText;
      setStatus('Desat.', 'success');
      if (onSuccess) onSuccess();
      if (dataChanged) renderTable();
    })
    .withFailureHandler(function (err) {
      if (onRevert) onRevert();
      onError(err);
    })
    .updateCell(state.currentName, rowIndex, colIndex, newValue);
}
