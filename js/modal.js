// Capçaleres de nom de servei que es tradueixen automàticament entre
// elles (ha de coincidir amb SERVICE_NAME_LANGS a Código.js).
const SERVICE_NAME_HEADERS = ['Nom Servei', 'NomCAST', 'NomENG'];

function openAddRowModal() {
  const modal = document.getElementById('addRowModal');
  const fieldsWrap = document.getElementById('addRowFields');
  fieldsWrap.innerHTML = '';

  state.headers.forEach(function (label, colIndex) {
    const isId = isIdHeader(label);

    const field = document.createElement('div');
    field.className = 'modal-field' + (isId ? ' modal-field-readonly' : '');

    const fieldLabel = document.createElement('label');
    fieldLabel.textContent = label || 'Columna ' + (colIndex + 1);
    fieldLabel.setAttribute('for', 'addRowField' + colIndex);

    let control;
    if (MULTISELECT_HEADERS.indexOf(label) !== -1) {
      control = buildMultiselectField(colIndex);
    } else if (label === YEAR_HEADER) {
      control = buildYearField(colIndex);
    } else if (SELECT_HEADERS.indexOf(label) !== -1) {
      control = buildSelectField(colIndex);
    } else if (CHECKBOX_HEADERS.indexOf(label) !== -1) {
      control = buildCheckboxField(colIndex);
    } else if (CURRENCY_HEADERS.indexOf(label) !== -1) {
      control = buildCurrencyField(colIndex);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'addRowField' + colIndex;
      input.dataset.colIndex = String(colIndex);
      if (isId) {
        input.value = crypto.randomUUID();
        input.readOnly = true;
      } else if (SERVICE_NAME_HEADERS.indexOf(label) !== -1) {
        input.dataset.langHeader = label;
        input.addEventListener('input', debounce(handleServiceNameInput, 400));
      }
      control = input;
    }

    field.appendChild(fieldLabel);
    field.appendChild(control);
    fieldsWrap.appendChild(field);
  });

  modal.showModal();
  const firstInput = fieldsWrap.querySelector('input:not([readonly]):not([type="hidden"])');
  if (firstInput) firstInput.focus();
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

function closeAddRowModal() {
  document.getElementById('addRowModal').close();
}

function submitAddRowForm(event) {
  event.preventDefault();
  const values = state.headers.map(function () { return ''; });
  document.querySelectorAll('#addRowFields [data-col-index]').forEach(function (input) {
    values[Number(input.dataset.colIndex)] = input.type === 'checkbox'
      ? (input.checked ? 'TRUE' : 'FALSE')
      : input.value;
  });

  closeAddRowModal();
  setStatus('Afegint fila...', 'loading');
  google.script.run
    .withSuccessHandler(loadCurrentSheet)
    .withFailureHandler(onError)
    .appendRow(state.currentName, values);
}
