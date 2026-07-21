// Capçaleres que s'editen amb un desplegable de multiselecció en lloc
// d'un camp de text lliure (els valors seleccionats es desen a la
// cel·la separats per ", ").
const MULTISELECT_HEADERS = ['Masia', 'ExtraExtresLlista'];

// splitCombined: true si una mateixa cel·la pot contenir diversos valors
// separats per comes (cas de Masia/ExtraExtresLlista); false si cada
// cel·la conté un únic valor sencer (cas d'Unit, vegeu selectfield.js).
function getDistinctColumnValues(colIndex, splitCombined) {
  const seen = {};
  state.rows.forEach(function (row) {
    const raw = String(row[colIndex] || '');
    const parts = splitCombined === false ? [raw] : raw.split(',');
    parts.forEach(function (part) {
      const trimmed = part.trim();
      if (trimmed) seen[trimmed] = true;
    });
  });
  return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b, 'ca'); });
}

function buildMultiselectField(colIndex) {
  const options = getDistinctColumnValues(colIndex, true);

  const wrap = document.createElement('div');
  wrap.className = 'multiselect';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'multiselect-trigger';
  trigger.textContent = options.length ? 'Selecciona...' : 'Encara no hi ha valors per triar';
  trigger.disabled = !options.length;

  const panel = document.createElement('div');
  panel.className = 'multiselect-panel';
  panel.hidden = true;

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.dataset.colIndex = String(colIndex);
  hiddenInput.value = '';

  function updateSelection() {
    const checked = Array.prototype.filter
      .call(panel.querySelectorAll('input[type="checkbox"]'), function (cb) { return cb.checked; })
      .map(function (cb) { return cb.value; });
    hiddenInput.value = checked.join(', ');
    trigger.textContent = checked.length ? checked.join(', ') : 'Selecciona...';
  }

  options.forEach(function (option) {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'multiselect-option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = option;
    checkbox.addEventListener('change', updateSelection);

    optionLabel.appendChild(checkbox);
    optionLabel.appendChild(document.createTextNode(option));
    panel.appendChild(optionLabel);
  });

  trigger.addEventListener('click', function (event) {
    event.stopPropagation();
    document.querySelectorAll('.multiselect-panel').forEach(function (openPanel) {
      if (openPanel !== panel) openPanel.hidden = true;
    });
    panel.hidden = !panel.hidden;
  });

  wrap.appendChild(trigger);
  wrap.appendChild(panel);
  wrap.appendChild(hiddenInput);
  return wrap;
}

document.addEventListener('click', function () {
  document.querySelectorAll('.multiselect-panel').forEach(function (panel) { panel.hidden = true; });
});
