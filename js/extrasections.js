// Pas 5 (condicional): secció "Input Númeric" (Unitat + Preu, desat a
// ExtraUnitat com "Unitat,Preu") i secció "Switch" (dues opcions
// CAT/CAST/ENG + Preu, desades a ExtraSwitch com
// "CAT1,CAST1,ENG1,PREU1,CAT2,CAST2,ENG2,PREU2").

function buildInputNumericSection(colIndex) {
  const container = document.createElement('div');
  container.className = 'breakdown-section';

  const heading = document.createElement('h3');
  heading.className = 'section-heading';
  heading.textContent = 'Input Númeric';
  container.appendChild(heading);

  const parts = String(modalValues[colIndex] || '').split(',');
  const current = { Unitat: parts[0] || '', Preu: parts[1] || '' };

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.dataset.colIndex = String(colIndex);

  function sync() {
    hiddenInput.value = unitatInput.value + ',' + preuInput.value;
  }

  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'modal-fields modal-fields-nested';

  const unitatInput = document.createElement('input');
  unitatInput.type = 'text';
  unitatInput.value = current.Unitat;
  unitatInput.addEventListener('input', sync);
  appendField(fieldsGrid, colIndex, 'Unitat', unitatInput);

  const preuWrap = document.createElement('div');
  preuWrap.className = 'currency-field';
  const preuInput = document.createElement('input');
  preuInput.type = 'number';
  preuInput.step = '0.01';
  preuInput.value = current.Preu;
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
  fieldsGrid.className = 'modal-fields modal-fields-nested switch-fields-grid';
  const langInputs = [];

  [
    { key: 'CAT', label: 'Català', type: 'text', lang: 'ca' },
    { key: 'CAST', label: 'Castellà', type: 'text', lang: 'es' },
    { key: 'ENG', label: 'Anglès', type: 'text', lang: 'en' },
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
      langInputs.push({ input: input, lang: def.lang });
    }

    const field = document.createElement('div');
    field.className = 'modal-field';
    const fieldLabel = document.createElement('label');
    fieldLabel.textContent = def.label;
    field.appendChild(fieldLabel);
    field.appendChild(control);
    fieldsGrid.appendChild(field);
  });

  wireLangAutoTranslate(langInputs);

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

  const parts = String(modalValues[colIndex] || '').split(',');
  const current = {
    Opcio1: { CAT: parts[0] || '', CAST: parts[1] || '', ENG: parts[2] || '', PREU: parts[3] || '' },
    Opcio2: { CAT: parts[4] || '', CAST: parts[5] || '', ENG: parts[6] || '', PREU: parts[7] || '' },
  };

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.dataset.colIndex = String(colIndex);

  function sync() {
    hiddenInput.value = [
      current.Opcio1.CAT, current.Opcio1.CAST, current.Opcio1.ENG, current.Opcio1.PREU,
      current.Opcio2.CAT, current.Opcio2.CAST, current.Opcio2.ENG, current.Opcio2.PREU,
    ].join(',');
  }

  const optionsGrid = document.createElement('div');
  optionsGrid.className = 'switch-options-grid';
  optionsGrid.appendChild(buildSwitchOptionGroup('Opció 1', current.Opcio1, sync));
  optionsGrid.appendChild(buildSwitchOptionGroup('Opció 2', current.Opcio2, sync));
  container.appendChild(optionsGrid);
  container.appendChild(hiddenInput);

  sync();
  return container;
}
