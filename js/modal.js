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

// Nombre de passos previstos amb la informació que es coneix fins ara
// (les tries encara no fetes es donen per "no calen"): la barra de
// progrés es recalcula cada pas i pot créixer a mesura que l'usuari
// marca opcions que n'afegeixen més endavant.
function getPlannedStepCount() {
  let count = 2;
  if (isDetailsStepNeededLive()) {
    count++;
    if (isBreakdownStepNeededLive()) {
      count++;
      if (isExtrasStepNeededLive()) count++;
    }
  }
  return count;
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

function getFieldControlValue(colIndex) {
  const el = document.querySelector('#addRowFields [data-col-index="' + colIndex + '"]');
  return el ? String(el.value || '') : '';
}

function appendField(container, colIndex, label, control, options) {
  options = options || {};
  const field = document.createElement('div');
  field.className = 'modal-field' + (isIdHeader(label) ? ' modal-field-readonly' : '');
  // Atribut propi (diferent de "data-col-index"): si reutilitzéssim
  // data-col-index aquí, les cerques puntuals com getFieldControlValue
  // trobarien primer aquest <div> embolcall (buit) en lloc de l'input
  // real, ja que apareix abans en l'ordre del document.
  field.dataset.fieldIndex = String(colIndex);

  const fieldLabel = document.createElement('label');
  fieldLabel.textContent = label || 'Columna ' + (colIndex + 1);
  fieldLabel.setAttribute('for', 'addRowField' + colIndex);
  if (options.required) {
    const asterisk = document.createElement('span');
    asterisk.className = 'modal-field-required';
    asterisk.textContent = ' *';
    asterisk.setAttribute('aria-hidden', 'true');
    fieldLabel.appendChild(asterisk);
  }

  field.appendChild(fieldLabel);
  field.appendChild(control);

  if (options.required) {
    const error = document.createElement('p');
    error.className = 'modal-field-error';
    error.textContent = 'Aquest camp és obligatori.';
    field.appendChild(error);

    field.addEventListener('input', function () {
      if (getFieldControlValue(colIndex).trim() !== '') field.classList.remove('is-invalid');
    });
    field.addEventListener('change', function () {
      if (getFieldControlValue(colIndex).trim() !== '') field.classList.remove('is-invalid');
    });
  }

  container.appendChild(field);
}

// Valida el pas "Informació general": tots els camps hi són obligatoris
// (excepte un desplegable/multiselecció desactivat perquè encara no hi
// ha cap valor entre els quals triar). Marca visualment els buits i
// retorna si es pot avançar.
function validateStepGeneral() {
  const fieldsWrap = document.getElementById('addRowFields');
  let allValid = true;
  let firstInvalidField = null;

  getStepColIndexes(FIELD_STEPS[STEP_GENERAL]).forEach(function (colIndex) {
    const fieldEl = fieldsWrap.querySelector('.modal-field[data-field-index="' + colIndex + '"]');
    if (!fieldEl) return;
    const disabledControl = fieldEl.querySelector('.multiselect-trigger:disabled');
    const isEmpty = !disabledControl && getFieldControlValue(colIndex).trim() === '';
    fieldEl.classList.toggle('is-invalid', isEmpty);
    if (isEmpty) {
      allValid = false;
      if (!firstInvalidField) firstInvalidField = fieldEl;
    }
  });

  if (firstInvalidField) {
    const focusable = firstInvalidField.querySelector('input:not([type="hidden"]), .multiselect-trigger');
    if (focusable) focusable.focus();
  }
  return allValid;
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
  } else if (modalStepIndex === STEP_OPTIONS) {
    const grid = document.createElement('div');
    grid.className = 'option-card-grid';
    getStepColIndexes(FIELD_STEPS[STEP_OPTIONS]).forEach(function (colIndex) {
      const label = state.headers[colIndex];
      const card = buildCardToggleField(colIndex, label, modalValues[colIndex]);
      grid.appendChild(card);
    });
    fieldsWrap.appendChild(grid);

    ['quantityBased', 'Extres'].forEach(function (header) {
      const colIndex = state.headers.indexOf(header);
      if (colIndex === -1) return;
      const checkbox = document.querySelector('#addRowFields [data-col-index="' + colIndex + '"]');
      if (checkbox) checkbox.addEventListener('change', updateModalNavButtons);
    });
  } else {
    getStepColIndexes(FIELD_STEPS[modalStepIndex]).forEach(function (colIndex) {
      const label = state.headers[colIndex];
      appendField(
        fieldsWrap, colIndex, label, buildFieldControl(colIndex, label, isIdHeader(label)),
        { required: modalStepIndex === STEP_GENERAL }
      );
    });
  }

  updateModalNavButtons();
  fieldsWrap.classList.remove('is-entering');
  void fieldsWrap.offsetWidth; // força el reflow perquè l'animació es reiniciï cada pas
  fieldsWrap.classList.add('is-entering');

  const firstInput = fieldsWrap.querySelector('input:not([readonly]):not([type="hidden"]), .multiselect-trigger:not(:disabled)');
  if (firstInput) firstInput.focus();
}

function isLastStep() {
  if (modalStepIndex === STEP_GENERAL) return false;
  if (modalStepIndex === STEP_OPTIONS) return !isDetailsStepNeededLive();
  if (modalStepIndex === STEP_DETAILS) return !isBreakdownStepNeededLive();
  if (modalStepIndex === STEP_BREAKDOWN) return !isExtrasStepNeededLive();
  return true;
}

function updateProgressBar() {
  const plannedSteps = Math.max(getPlannedStepCount(), modalStepIndex + 1);
  document.getElementById('addRowProgressFill').style.width =
    Math.round(((modalStepIndex + 1) / plannedSteps) * 100) + '%';
}

function updateModalNavButtons() {
  const isFirst = modalStepIndex === STEP_GENERAL;
  const isLast = isLastStep();
  document.getElementById('addRowBackBtn').hidden = isFirst;
  document.getElementById('addRowNextBtn').hidden = isLast;
  document.getElementById('addRowSubmitBtn').hidden = !isLast;
  updateProgressBar();
}

function handleModalNext() {
  captureStepValues();
  if (modalStepIndex === STEP_GENERAL && !validateStepGeneral()) return;
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
