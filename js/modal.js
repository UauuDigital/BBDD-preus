// Capçaleres de nom de servei que es tradueixen automàticament entre
// elles (ha de coincidir amb SERVICE_NAME_LANGS a Código.js).
const SERVICE_NAME_HEADERS = ['Nom Servei', 'NomCAST', 'NomENG'];

// Pantalles fixes del formulari de nova fila (només mostren les
// columnes de la seva llista que existeixin al full actual).
const FIELD_STEPS = [
  { title: 'Informació general', headers: ['Nom Servei', 'NomCAST', 'NomENG', 'Masia', 'Any', 'Preu'] },
  { title: 'Opcions', headers: ['perConvidat', 'Optional', 'quantityBased', 'Extres'] },
];

// Pas 3 (condicional): cada camp només apareix si la casella de la
// columna "conditionHeader" (pas "Opcions") s'ha marcat.
const DETAIL_STEP_FIELDS = [
  { header: 'Unit', conditionHeader: 'quantityBased', kind: 'select', options: ['Pack', 'Persona'] },
  { header: 'ExtresLlista', conditionHeader: 'Extres', kind: 'multiselect', options: ['Desplegable', 'Llindà', 'Altres Extres'] },
];

// Índexs de pas (fixos: 0 i 1 sempre existeixen; 2, 3 i 4 són condicionals).
const STEP_GENERAL = 0;
const STEP_OPTIONS = 1;
const STEP_DETAILS = 2;
const STEP_BREAKDOWN = 3;
const STEP_EXTRAS = 4;

let modalStepIndex = 0;
let modalValues = {};

function getStepColIndexes(step) {
  return step.headers
    .map(function (header) { return state.headers.indexOf(header); })
    .filter(function (colIndex) { return colIndex !== -1; });
}

// Llegeix l'estat actual (encara que no s'hagi capturat a modalValues)
// d'un camp del pas visible, per decidir en temps real si cal avançar.
function readLiveValue(colIndex) {
  const liveEl = document.querySelector('#addRowFields [data-col-index="' + colIndex + '"]');
  if (!liveEl) return modalValues[colIndex];
  return liveEl.type === 'checkbox' ? (liveEl.checked ? 'TRUE' : 'FALSE') : liveEl.value;
}

function isDetailsStepNeededLive() {
  return DETAIL_STEP_FIELDS.some(function (def) {
    const condColIndex = state.headers.indexOf(def.conditionHeader);
    return condColIndex !== -1 && readLiveValue(condColIndex) === 'TRUE';
  });
}

function getActiveDetailFields() {
  return DETAIL_STEP_FIELDS.filter(function (def) {
    const condColIndex = state.headers.indexOf(def.conditionHeader);
    return condColIndex !== -1
      && modalValues[condColIndex] === 'TRUE'
      && state.headers.indexOf(def.header) !== -1;
  });
}

function getSelectedExtresLlistaLive() {
  const colIndex = state.headers.indexOf('ExtresLlista');
  if (colIndex === -1) return [];
  const raw = readLiveValue(colIndex) || '';
  return String(raw).split(',').map(function (part) { return part.trim(); }).filter(Boolean);
}

function isBreakdownStepNeededLive() {
  return getSelectedExtresLlistaLive().length > 0;
}

function getSelectedAltresExtresLive() {
  const colIndex = state.headers.indexOf('ExtraExtresLlista');
  if (colIndex === -1) return [];
  const raw = readLiveValue(colIndex) || '';
  return String(raw).split(',').map(function (part) { return part.trim(); }).filter(Boolean);
}

function isExtrasStepNeededLive() {
  return getSelectedAltresExtresLive().length > 0;
}

function openAddRowModal() {
  modalStepIndex = STEP_GENERAL;
  modalValues = {};
  renderModalStep();
  document.getElementById('addRowModal').showModal();
}

function closeAddRowModal() {
  document.getElementById('addRowModal').close();
}

function captureStepValues() {
  document.querySelectorAll('#addRowFields [data-col-index]').forEach(function (el) {
    const colIndex = Number(el.dataset.colIndex);
    modalValues[colIndex] = el.type === 'checkbox' ? (el.checked ? 'TRUE' : 'FALSE') : el.value;
  });
}

function buildFieldControl(colIndex, label, isId) {
  const initialValue = modalValues[colIndex];

  if (MULTISELECT_HEADERS.indexOf(label) !== -1) return buildMultiselectField(colIndex, initialValue);
  if (label === YEAR_HEADER) return buildYearField(colIndex, initialValue);
  if (SELECT_HEADERS.indexOf(label) !== -1) return buildSelectField(colIndex, initialValue);
  if (CHECKBOX_HEADERS.indexOf(label) !== -1) return buildCheckboxField(colIndex, initialValue);
  if (CURRENCY_HEADERS.indexOf(label) !== -1) return buildCurrencyField(colIndex, initialValue);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'addRowField' + colIndex;
  input.dataset.colIndex = String(colIndex);
  if (isId) {
    input.value = crypto.randomUUID();
    input.readOnly = true;
  } else {
    if (initialValue) input.value = initialValue;
    if (SERVICE_NAME_HEADERS.indexOf(label) !== -1) {
      input.dataset.langHeader = label;
      input.addEventListener('input', debounce(handleServiceNameInput, 400));
    }
  }
  return input;
}

function appendField(container, colIndex, label, control) {
  const field = document.createElement('div');
  field.className = 'modal-field' + (isIdHeader(label) ? ' modal-field-readonly' : '');

  const fieldLabel = document.createElement('label');
  fieldLabel.textContent = label || 'Columna ' + (colIndex + 1);
  fieldLabel.setAttribute('for', 'addRowField' + colIndex);

  field.appendChild(fieldLabel);
  field.appendChild(control);
  container.appendChild(field);
}

function buildAltresExtresSection() {
  const colIndex = state.headers.indexOf('ExtraExtresLlista');
  if (colIndex === -1) return null;

  const container = document.createElement('div');
  container.className = 'breakdown-section';

  const heading = document.createElement('h3');
  heading.className = 'section-heading';
  heading.textContent = 'Altres Extres';
  container.appendChild(heading);

  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'modal-fields modal-fields-nested';
  const control = buildMultiselectField(colIndex, modalValues[colIndex], ['Input Númeric', 'Switch']);
  appendField(fieldsGrid, colIndex, 'ExtraExtresLlista', control);
  control.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
    checkbox.addEventListener('change', updateModalNavButtons);
  });
  container.appendChild(fieldsGrid);
  return container;
}

function renderModalStep() {
  const fieldsWrap = document.getElementById('addRowFields');
  fieldsWrap.innerHTML = '';

  const titles = ['Informació general', 'Opcions', 'Detalls addicionals', 'Detall dels extres', 'Configuració addicional'];
  document.getElementById('addRowTitle').textContent = 'Nova fila';
  document.getElementById('addRowStep').textContent = 'Pas ' + (modalStepIndex + 1) + ' — ' + titles[modalStepIndex];
  document.getElementById('addRowModal').classList.toggle(
    'modal-wide', modalStepIndex === STEP_BREAKDOWN || modalStepIndex === STEP_EXTRAS
  );

  if (modalStepIndex === STEP_EXTRAS) {
    const selectedExtras = getSelectedAltresExtresLive();
    if (selectedExtras.indexOf('Input Númeric') !== -1) {
      const colIndex = state.headers.indexOf('ExtraUnitat');
      if (colIndex !== -1) fieldsWrap.appendChild(buildInputNumericSection(colIndex));
    }
    if (selectedExtras.indexOf('Switch') !== -1) {
      const colIndex = state.headers.indexOf('ExtraSwitch');
      if (colIndex !== -1) fieldsWrap.appendChild(buildSwitchSection(colIndex));
    }
  } else if (modalStepIndex === STEP_BREAKDOWN) {
    const selected = getSelectedExtresLlistaLive();
    if (selected.indexOf('Desplegable') !== -1) {
      const colIndex = state.headers.indexOf(DESPLEGABLE_HEADER);
      if (colIndex !== -1) fieldsWrap.appendChild(buildDesplegableSection(colIndex));
    }
    if (selected.indexOf('Llindà') !== -1) {
      fieldsWrap.appendChild(buildLlindaSection());
    }
    if (selected.indexOf('Altres Extres') !== -1) {
      const section = buildAltresExtresSection();
      if (section) fieldsWrap.appendChild(section);
    }
  } else if (modalStepIndex === STEP_DETAILS) {
    getActiveDetailFields().forEach(function (def) {
      const colIndex = state.headers.indexOf(def.header);
      const initialValue = modalValues[colIndex];
      const control = def.kind === 'select'
        ? buildSelectField(colIndex, initialValue, def.options)
        : buildMultiselectField(colIndex, initialValue, def.options);
      appendField(fieldsWrap, colIndex, def.header, control);

      if (def.header === 'ExtresLlista') {
        control.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
          checkbox.addEventListener('change', updateModalNavButtons);
        });
      }
    });
  } else {
    getStepColIndexes(FIELD_STEPS[modalStepIndex]).forEach(function (colIndex) {
      const label = state.headers[colIndex];
      appendField(fieldsWrap, colIndex, label, buildFieldControl(colIndex, label, isIdHeader(label)));
    });

    if (modalStepIndex === STEP_OPTIONS) {
      ['quantityBased', 'Extres'].forEach(function (header) {
        const colIndex = state.headers.indexOf(header);
        if (colIndex === -1) return;
        const checkbox = document.querySelector('#addRowFields [data-col-index="' + colIndex + '"]');
        if (checkbox) checkbox.addEventListener('change', updateModalNavButtons);
      });
    }
  }

  updateModalNavButtons();
  const firstInput = fieldsWrap.querySelector('input:not([readonly]):not([type="hidden"]), select');
  if (firstInput) firstInput.focus();
}

function isLastStep() {
  if (modalStepIndex === STEP_GENERAL) return false;
  if (modalStepIndex === STEP_OPTIONS) return !isDetailsStepNeededLive();
  if (modalStepIndex === STEP_DETAILS) return !isBreakdownStepNeededLive();
  if (modalStepIndex === STEP_BREAKDOWN) return !isExtrasStepNeededLive();
  return true;
}

function updateModalNavButtons() {
  const isFirst = modalStepIndex === STEP_GENERAL;
  const isLast = isLastStep();
  document.getElementById('addRowBackBtn').hidden = isFirst;
  document.getElementById('addRowNextBtn').hidden = isLast;
  document.getElementById('addRowSubmitBtn').hidden = !isLast;
}

function handleModalNext() {
  captureStepValues();
  if (isLastStep()) return;
  modalStepIndex++;
  renderModalStep();
}

function handleModalBack() {
  captureStepValues();
  if (modalStepIndex === STEP_GENERAL) return;
  modalStepIndex--;
  renderModalStep();
}

function debounce(fn, delayMs) {
  let timeoutId;
  return function () {
    const args = arguments;
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () { fn.apply(context, args); }, delayMs);
  };
}

function handleServiceNameInput(event) {
  const sourceInput = event.target;
  const sourceHeader = sourceInput.dataset.langHeader;
  const text = sourceInput.value.trim();
  if (!text) return;

  google.script.run
    .withSuccessHandler(function (translations) {
      // Descarta la resposta si l'usuari ha seguit escrivint mentrestant.
      if (sourceInput.value.trim() !== text) return;
      Object.keys(translations).forEach(function (header) {
        const targetInput = document.querySelector('#addRowFields input[data-lang-header="' + header + '"]');
        if (targetInput && document.activeElement !== targetInput) targetInput.value = translations[header];
      });
    })
    .withFailureHandler(onError)
    .translateServiceName(text, sourceHeader);
}

function submitAddRowForm(event) {
  event.preventDefault();
  captureStepValues();

  const values = state.headers.map(function (_, colIndex) {
    return modalValues[colIndex] !== undefined ? modalValues[colIndex] : '';
  });

  closeAddRowModal();
  setStatus('Afegint fila...', 'loading');
  google.script.run
    .withSuccessHandler(loadCurrentSheet)
    .withFailureHandler(onError)
    .appendRow(state.currentName, values);
}
