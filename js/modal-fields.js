// Construcció dels camps del formulari (dispatcher segons tipus de
// columna), la seva validació al pas "Informació general", i la secció
// condicional "Altres Extres" (pas de desglossament).
// Capçaleres numèriques senzilles (sense format de moneda): un
// <input type="number"> pla.
const NUMBER_HEADERS = ['MÍN', 'MinConvidats'];

function buildFieldControl(colIndex, label, isId) {
  const initialValue = modalValues[colIndex];

  if (MULTISELECT_HEADERS.indexOf(label) !== -1) {
    const isMasiaHeader = label === 'Masia' || label === 'Masies';
    return buildMultiselectField(colIndex, initialValue, getFixedOptionsForHeader(label) || undefined, undefined, isMasiaHeader ? getMasiaColor : undefined);
  }
  if (label === YEAR_HEADER) return buildYearField(colIndex, initialValue, undefined, getYearRelativeColor);
  if (SELECT_HEADERS.indexOf(label) !== -1) return buildSelectField(colIndex, initialValue);
  if (CHECKBOX_HEADERS.indexOf(label) !== -1) return buildCheckboxField(colIndex, initialValue);
  if (CURRENCY_HEADERS.indexOf(label) !== -1) return buildCurrencyField(colIndex, initialValue);
  if (DUAL_NUMBER_HEADERS.indexOf(label) !== -1) return buildDualNumberField(colIndex, initialValue);

  if (NUMBER_HEADERS.indexOf(label) !== -1) {
    const numberInput = document.createElement('input');
    numberInput.type = 'number';
    numberInput.id = 'addRowField' + colIndex;
    numberInput.dataset.colIndex = String(colIndex);
    if (initialValue) numberInput.value = initialValue;
    return numberInput;
  }

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

// L'element que ha de rebre aria-required/aria-invalid/aria-describedby:
// el trigger visible d'un desplegable (un <div> embolcall no és
// focusable) o, si no n'hi ha, l'input real amb data-col-index.
function getFieldAriaTarget(fieldEl) {
  const trigger = fieldEl.querySelector('.multiselect-trigger');
  if (trigger) return trigger;
  return fieldEl.querySelector('[data-col-index]');
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
    const ariaTarget = getFieldAriaTarget(field);
    const errorId = 'addRowFieldError' + colIndex;

    const error = document.createElement('p');
    error.className = 'modal-field-error';
    error.id = errorId;
    error.textContent = 'Aquest camp és obligatori.';
    field.appendChild(error);

    if (ariaTarget) {
      ariaTarget.setAttribute('aria-required', 'true');
      ariaTarget.setAttribute('aria-describedby', errorId);
      if (ariaTarget.tagName === 'INPUT') ariaTarget.required = true;
    }

    const clearInvalid = function () {
      if (getFieldControlValue(colIndex).trim() === '') return;
      field.classList.remove('is-invalid');
      if (ariaTarget) ariaTarget.setAttribute('aria-invalid', 'false');
    };
    field.addEventListener('input', clearInvalid);
    field.addEventListener('change', clearInvalid);
  }

  container.appendChild(field);
}

// Valida el pas "Informació general": tots els camps hi són obligatoris
// (excepte un desplegable/multiselecció desactivat perquè encara no hi
// ha cap valor entre els quals triar). Marca visualment els buits i
// retorna si es pot avançar.
function validateStepGeneral() {
  const fieldsWrap = document.getElementById('addRowFields');
  const step = getFieldSteps()[STEP_GENERAL];
  const requiredHeaders = step.requiredHeaders || step.headers;
  let allValid = true;
  let firstInvalidField = null;

  getStepColIndexes(step).forEach(function (colIndex) {
    if (requiredHeaders.indexOf(state.headers[colIndex]) === -1) return;
    const fieldEl = fieldsWrap.querySelector('.modal-field[data-field-index="' + colIndex + '"]');
    if (!fieldEl) return;
    const disabledControl = fieldEl.querySelector('.multiselect-trigger:disabled');
    const isEmpty = !disabledControl && getFieldControlValue(colIndex).trim() === '';
    fieldEl.classList.toggle('is-invalid', isEmpty);
    const ariaTarget = getFieldAriaTarget(fieldEl);
    if (ariaTarget) ariaTarget.setAttribute('aria-invalid', isEmpty ? 'true' : 'false');
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
