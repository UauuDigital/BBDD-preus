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
  'Desplegable': 'Marca-ho si aquest servei ofereix un desplegable d\'opcions amb preus diferents (es configura al pas de desglossament).',
  'Unit': 'Si el preu és per persona o per pack sencer (packs fixos, independentment del nombre de persones).',
  'ExtresLlista': 'Quins tipus d\'extra vols configurar per a aquest servei: desplegable d\'opcions, llindars per trams, o altres extres addicionals.',
  'ExtraExtresLlista': 'Quin tipus d\'extra addicional vols configurar: un camp numèric amb preu (Input Numèric) o dues opcions alternatives amb preu cada una (Switch).',
  'Unitat': 'Nom de la unitat que es multiplica pel preu (p.ex. "hora", "m2", "persona addicional").',
  'Llindà preu X<0': 'Preu per convidat quan el nombre de convidats és per sota del "Principi" d\'aquest tram.',
  'Llindà preu 0<X': 'Preu per convidat quan el nombre de convidats és per sobre del "Final" d\'aquest tram.',
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
  return field;
}

// Camps obligatoris condicionals fora del pas "Informació general"
// (p.ex. "Unit" si "quantityBased" és cert, els preus del Llindà si
// s'ha triat, els camps del Switch...): quan el control té un colIndex
// real i propi, appendField(..., {required:true}) ja n'hi ha prou. Però
// alguns camps són compostos (el Switch desa 8 valors en un únic
// colIndex; el Llindà i l'Input Numèric barregen diversos inputs sota
// un mateix colIndex combinat): aquí getFieldControlValue (basat en
// colIndex) no pot distingir-los, així que es marquen amb
// wireRequiredField, que guarda la seva pròpia manera de llegir el
// valor en lloc de dependre de data-col-index.
function wireRequiredField(field, getValue, errorMessage) {
  field.classList.add('is-required-check');
  field.dataset.requiredCheck = 'true';
  field._getRequiredValue = getValue;

  const error = document.createElement('p');
  error.className = 'modal-field-error';
  error.textContent = errorMessage || 'Aquest camp és obligatori.';
  field.appendChild(error);

  function clearInvalid() {
    if (getValue().trim() === '') return;
    field.classList.remove('is-invalid');
  }
  field.addEventListener('input', clearInvalid);
  field.addEventListener('change', clearInvalid);
}

// Comprova tots els camps obligatoris (dels dos mecanismes anteriors)
// dins el contenidor donat, marca visualment els buits i retorna si es
// pot avançar de pas.
function validateRequiredFieldsIn(container) {
  let allValid = true;
  let firstInvalidField = null;

  function markInvalid(fieldEl, isEmpty, ariaTarget) {
    fieldEl.classList.toggle('is-invalid', isEmpty);
    if (ariaTarget) ariaTarget.setAttribute('aria-invalid', isEmpty ? 'true' : 'false');
    if (isEmpty) {
      allValid = false;
      if (!firstInvalidField) firstInvalidField = fieldEl;
    }
  }

  container.querySelectorAll('.modal-field[data-field-index]').forEach(function (fieldEl) {
    const ariaTarget = getFieldAriaTarget(fieldEl);
    if (!ariaTarget || ariaTarget.getAttribute('aria-required') !== 'true') return;
    const colIndex = Number(fieldEl.dataset.fieldIndex);
    const disabledControl = fieldEl.querySelector('.multiselect-trigger:disabled');
    const isEmpty = !disabledControl && getFieldControlValue(colIndex).trim() === '';
    markInvalid(fieldEl, isEmpty, ariaTarget);
  });

  container.querySelectorAll('[data-required-check="true"]').forEach(function (fieldEl) {
    markInvalid(fieldEl, fieldEl._getRequiredValue().trim() === '', null);
  });

  if (firstInvalidField) {
    const focusable = firstInvalidField.querySelector('input:not([type="hidden"]), .multiselect-trigger');
    (focusable || firstInvalidField).focus();
  }
  return allValid;
}

// Punt d'entrada únic cridat abans d'avançar de pas o de desar: el pas
// "Informació general" té la seva pròpia validació (requiredHeaders
// per columna real); qualsevol altre pas fa servir el mecanisme
// genèric anterior.
function validateActiveStep() {
  if (modalStepIndex === STEP_GENERAL && !validateStepGeneral()) return false;
  return validateRequiredFieldsIn(document.getElementById('addRowFields'));
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
  const control = buildMultiselectField(colIndex, modalValues[colIndex], ['extraunit', 'switch']);
  appendField(fieldsGrid, colIndex, 'ExtraExtresLlista', control);
  control.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
    checkbox.addEventListener('change', updateModalNavButtons);
  });
  container.appendChild(fieldsGrid);
  return container;
}
