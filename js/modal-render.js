// Obertura/tancament del modal, captura de valors en canviar de pas, i
// el render principal (renderModalStep) que decideix què mostrar a
// cada pas i quins botons de navegació han de sortir.
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

function renderModalStep() {
  const fieldsWrap = document.getElementById('addRowFields');
  fieldsWrap.innerHTML = '';

  const fallbackTitles = ['', '', 'Detalls addicionals', 'Detall dels extres', 'Configuració addicional'];
  const steps = getFieldSteps();
  const stepTitle = (steps[modalStepIndex] && steps[modalStepIndex].title) || fallbackTitles[modalStepIndex] || '';
  document.getElementById('addRowTitle').textContent = 'Nova fila';
  document.getElementById('addRowStep').textContent = 'Pas ' + (modalStepIndex + 1) + ' — ' + stepTitle;
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
  } else if (modalStepIndex === STEP_OPTIONS && !isCalendarSheet()) {
    const grid = document.createElement('div');
    grid.className = 'option-card-grid';
    getStepColIndexes(getFieldSteps()[STEP_OPTIONS]).forEach(function (colIndex) {
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
    const step = getFieldSteps()[modalStepIndex];
    const requiredHeaders = modalStepIndex === STEP_GENERAL ? (step.requiredHeaders || step.headers) : [];
    getStepColIndexes(step).forEach(function (colIndex) {
      const label = state.headers[colIndex];
      appendField(
        fieldsWrap, colIndex, label, buildFieldControl(colIndex, label, isIdHeader(label)),
        { required: requiredHeaders.indexOf(label) !== -1 }
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
