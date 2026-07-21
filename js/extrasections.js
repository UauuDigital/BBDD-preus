// Pas 5 (condicional): secció "Input Númeric" (Unitat + Preu, desat a
// ExtraUnitat com a JSON) i secció "Switch" (dues opcions CAT/CAST/ENG
// + Preu, desades a ExtraSwitch com a JSON).

function buildInputNumericSection(colIndex) {
  const container = document.createElement('div');
  container.className = 'breakdown-section';

  const heading = document.createElement('h3');
  heading.className = 'section-heading';
  heading.textContent = 'Input Númeric';
  container.appendChild(heading);

  let current = {};
  try { current = JSON.parse(modalValues[colIndex] || '{}'); } catch (e) { current = {}; }

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.dataset.colIndex = String(colIndex);

  function sync() {
    hiddenInput.value = JSON.stringify({
      Unitat: unitatInput.value,
      Preu: preuInput.value === '' ? '' : Number(preuInput.value),
    });
  }

  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'modal-fields modal-fields-nested';

  const unitatInput = document.createElement('input');
  unitatInput.type = 'text';
  unitatInput.value = current.Unitat || '';
  unitatInput.addEventListener('input', sync);
  appendField(fieldsGrid, colIndex, 'Unitat', unitatInput);

  const preuWrap = document.createElement('div');
  preuWrap.className = 'currency-field';
  const preuInput = document.createElement('input');
  preuInput.type = 'number';
  preuInput.step = '0.01';
  preuInput.value = current.Preu === undefined ? '' : current.Preu;
  preuInput.addEventListener('input', sync);
  const preuSuffix = document.createElement('span');
  preuSuffix.className = 'currency-suffix';
  preuSuffix.textContent = '€';
  preuWrap.appendChild(preuInput);
  preuWrap.appendChild(preuSuffix);
  appendField(fieldsGrid, colIndex, 'Preu', preuWrap);

  sync();
  container.appendChild(fieldsGrid);
  container.appendChild(hiddenInput);
  return container;
}

function buildSwitchOptionGroup(label, optionData, onChange) {
  const group = document.createElement('div');
  group.className = 'switch-option-group';

  const heading = document.createElement('h4');
  heading.className = 'switch-option-heading';
  heading.textContent = label;
  group.appendChild(heading);

  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'modal-fields modal-fields-nested';

  [
    { key: 'CAT', label: 'Català', type: 'text' },
    { key: 'CAST', label: 'Castellà', type: 'text' },
    { key: 'ENG', label: 'Anglès', type: 'text' },
    { key: 'PREU', label: 'Preu', type: 'currency' },
  ].forEach(function (def) {
    let control;
    if (def.type === 'currency') {
      const wrap = document.createElement('div');
      wrap.className = 'currency-field';
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.01';
      input.value = optionData[def.key] === undefined ? '' : optionData[def.key];
      input.addEventListener('input', function () {
        optionData[def.key] = input.value === '' ? '' : Number(input.value);
        onChange();
      });
      const suffix = document.createElement('span');
      suffix.className = 'currency-suffix';
      suffix.textContent = '€';
      wrap.appendChild(input);
      wrap.appendChild(suffix);
      control = wrap;
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = optionData[def.key] || '';
      input.addEventListener('input', function () {
        optionData[def.key] = input.value;
        onChange();
      });
      control = input;
    }

    const field = document.createElement('div');
    field.className = 'modal-field';
    const fieldLabel = document.createElement('label');
    fieldLabel.textContent = def.label;
    field.appendChild(fieldLabel);
    field.appendChild(control);
    fieldsGrid.appendChild(field);
  });

  group.appendChild(fieldsGrid);
  return group;
}

function buildSwitchSection(colIndex) {
  const container = document.createElement('div');
  container.className = 'breakdown-section';

  const heading = document.createElement('h3');
  heading.className = 'section-heading';
  heading.textContent = 'Switch';
  container.appendChild(heading);

  let current = {};
  try { current = JSON.parse(modalValues[colIndex] || '{}'); } catch (e) { current = {}; }
  current.Opcio1 = current.Opcio1 || {};
  current.Opcio2 = current.Opcio2 || {};

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.dataset.colIndex = String(colIndex);

  function sync() { hiddenInput.value = JSON.stringify(current); }

  container.appendChild(buildSwitchOptionGroup('Opció 1', current.Opcio1, sync));
  container.appendChild(buildSwitchOptionGroup('Opció 2', current.Opcio2, sync));
  container.appendChild(hiddenInput);

  sync();
  return container;
}
