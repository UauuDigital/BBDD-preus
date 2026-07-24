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

// Text explicatiu per a les capçaleres que en necessiten (surt com a
// vinyeta, mateix estil que la resta de tooltips de l'app, en clicar/
// passar per sobre la icona ⓘ al costat del nom del camp). Les que no
// hi són no en mostren cap — el nom de la columna ja n'hi ha prou.
const FIELD_HELP_TEXT = {
  'Nom Servei': 'Nom en català. Si l\'escrius aquí, es tradueix sol a NomCAST i NomENG.',
  'NomCAST': 'Traducció al castellà (es genera sola en escriure "Nom Servei", però es pot editar a mà).',
  'NomENG': 'Traducció a l\'anglès (es genera sola en escriure "Nom Servei", però es pot editar a mà).',
  'Masia': 'A quina finca s\'aplica. Es pot marcar més d\'una.',
  'Masies': 'A quina finca s\'aplica. Es pot marcar més d\'una.',
  'Any': 'Temporada a la qual s\'aplica el preu.',
  'Preu': 'Preu sense IVA.',
  'perConvidat': 'Marca-ho si el preu es multiplica pel nombre de convidats (en lloc de ser un preu fix).',
  'Optional': 'Marca-ho si és un extra opcional, no inclòs per defecte al pressupost.',
  'quantityBased': 'Marca-ho si el preu depèn d\'una quantitat (packs, persones...) en lloc de ser un preu únic.',
  'Extres': 'Marca-ho si aquest servei té extres o variants configurables (desglossament al pas següent).',
  'Dia': 'Dia(es) de la setmana als quals s\'aplica. Buit = tots els dies.',
  'Mes': 'Mes(os) als quals s\'aplica. Buit = tots els mesos.',
  'Excepte': 'Data concreta que queda exclosa d\'aquesta regla (p.ex. un festiu).',
  'PREU/P': 'Preu per persona d\'aquesta franja.',
  'MÍN': 'Mínim de convidats per aplicar aquest preu.',
  'PreuComp': 'Preu "compensat" alternatiu, mostrat al calendari quan no s\'arriba al mínim.',
  'SiMin€': 'Preu per persona quan SÍ s\'arriba al mínim de convidats.',
  'NoMin€': 'Preu per persona quan NO s\'arriba al mínim de convidats.',
  'MinConvidats': 'Mínim de convidats per aplicar aquesta franja de preu.',
  'PreuPersona': 'Preu per persona d\'aquesta franja.',
  'PenalitzacioPerPersona': 'Recàrrec per persona que falta per arribar al mínim de convidats.',
  'MinimEuros': 'Import mínim en euros d\'aquest extra, independentment del nombre de persones.',
};

function buildFieldHelpIcon(label) {
  const helpText = FIELD_HELP_TEXT[label];
  if (!helpText) return null;
  const icon = document.createElement('span');
  icon.className = 'field-help-icon';
  icon.dataset.tooltip = helpText;
  icon.setAttribute('tabindex', '0');
  icon.setAttribute('role', 'note');
  icon.setAttribute('aria-label', helpText);
  icon.innerHTML = ICONS.info;
  return icon;
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
  const helpIcon = buildFieldHelpIcon(label);
  if (helpIcon) fieldLabel.appendChild(helpIcon);

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
