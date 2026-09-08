// Visualització (no editable) d'una cel·la de la taula. Tota l'edició
// es fa des del modal que s'obre en clicar la fila (obrirEditRowModal,
// modal-render.js), que ja fa servir aquests mateixos tipus de camp
// (desplegable/casella/moneda...) per a la creació — així la manera
// d'editar una fila i de crear-ne una és sempre la mateixa.
const CELL_OPTION_COLORS = { 'Masia': getMasiaColor, 'Masies': getMasiaColor, 'Any': getYearRelativeColor };

// Text pla per a una cel·la, segons el tipus de columna: la mateixa
// lògica de lectura que feia servir cada camp editable, però només per
// mostrar-lo.
function buildTableCellDisplay(header, colIndex, rowIndex, value) {
  const span = document.createElement('span');
  span.className = 'cell-display';

  if (header === DESPLEGABLE_HEADER) {
    const items = parseDesplegableItems(value);
    span.textContent = items.length
      ? items.length + (items.length === 1 ? ' opció' : ' opcions')
      : '';
    return span;
  }

  if (CHECKBOX_HEADERS.indexOf(header) !== -1) {
    span.className += ' cell-display-check';
    if (String(value).toUpperCase() === 'TRUE') span.innerHTML = ICONS.check;
    return span;
  }

  if (MULTISELECT_HEADERS.indexOf(header) !== -1) {
    const cellValue = header === 'ExtresLlista' ? withDesplegableAutoSelected(value, rowIndex) : value;
    const parts = String(cellValue || '').split(',').map(function (part) { return part.trim(); }).filter(Boolean);
    const getColor = CELL_OPTION_COLORS[header];
    if (getColor && parts.length) {
      span.className += ' cell-display-chips';
      parts.forEach(function (part) {
        const chip = document.createElement('span');
        chip.className = 'cell-display-chip';
        const dot = document.createElement('span');
        dot.className = 'cell-display-chip-dot';
        dot.style.background = getColor(part);
        chip.appendChild(dot);
        chip.appendChild(document.createTextNode(part));
        span.appendChild(chip);
      });
    } else {
      span.textContent = parts.join(', ');
    }
    return span;
  }

  span.textContent = value;
  return span;
}

function getLabelableElement(control) {
  return control;
}
