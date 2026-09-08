// Obertura/tancament del modal, captura de valors en canviar de pas, i
// el render principal (renderModalStep) que decideix què mostrar a
// cada pas i quins botons de navegació han de sortir.
function openAddRowModal() {
  editingRowIndex = null;
  modalStepIndex = STEP_GENERAL;
  modalValues = {};
  // "Optional" marcat per defecte en crear una fila nova (la immensa
  // majoria de serveis nous ho són): només afecta el formulari de nova
  // fila, no les files ja existents (en editar, es parteix sempre del
  // valor real ja desat, vegeu openEditRowModal).
  const optionalColIndex = state.headers.indexOf('Optional');
  if (optionalColIndex !== -1) modalValues[optionalColIndex] = 'TRUE';
  renderModalStep();
  document.getElementById('addRowModal').showModal();
}

// Obre el mateix formulari per passos que "+ Fila", precarregat amb els
// valors ja desats d'una fila existent (clic a la fila a la taula):
// modalValues ja és indexable per colIndex igual que state.rows[rowIndex],
// així que la resta de la infraestructura del modal (buildFieldControl,
// captureStepValues...) funciona sense cap canvi.
function openEditRowModal(rowIndex) {
  editingRowIndex = rowIndex;
  modalStepIndex = STEP_GENERAL;
  modalValues = {};
  state.rows[rowIndex].forEach(function (value, colIndex) { modalValues[colIndex] = value; });
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

// Títol d'un pas, tant si és un dels dos fixos (que el porten dins
// getFieldSteps()) com un dels condicionals (2/3/4, que no en tenen cap
// a la config i sempre fan servir el mateix nom genèric).
const CONDITIONAL_STEP_TITLES = ['', '', 'Detalls addicionals', 'Detall dels extres', 'Configuració addicional'];
function getStepTitle(index) {
  const steps = getFieldSteps();
  return (steps[index] && steps[index].title) || CONDITIONAL_STEP_TITLES[index] || '';
}

// Índexs de tots els passos que existirien amb l'estat actual del
// formulari (incloent-hi els condicionals ja actius): a diferència de
// getPlannedStepCount (modal-state.js, que només compta quants en
// falten per venir), aquí cal la llista completa per dibuixar-los.
function getVisibleStepIndexes() {
  const indexes = [STEP_GENERAL, STEP_OPTIONS];
  if (isDetailsStepNeededLive()) {
    indexes.push(STEP_DETAILS);
    if (isBreakdownStepNeededLive()) {
      indexes.push(STEP_BREAKDOWN);
      if (isExtrasStepNeededLive()) indexes.push(STEP_EXTRAS);
    }
  }
  return indexes;
}

// Navegació lliure entre passos (només en editar una fila existent,
// vegeu renderModalStep): a diferència de "+ Fila", on cada pas nou
// depèn de validar l'anterior perquè encara s'estan omplint els
// camps, aquí tots ja tenen un valor real desat, així que no cal
// forçar l'ordre ni la validació per poder saltar-hi.
function renderStepsNav() {
  const nav = document.getElementById('addRowStepsNav');
  nav.hidden = editingRowIndex === null;
  if (editingRowIndex === null) return;

  nav.innerHTML = '';
  const visibleSteps = getVisibleStepIndexes();
  const currentPos = visibleSteps.indexOf(modalStepIndex);
  visibleSteps.forEach(function (stepIndex, i) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'modal-steps-nav-item';
    btn.classList.toggle('is-active', stepIndex === modalStepIndex);
    btn.classList.toggle('is-done', i < currentPos);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(stepIndex === modalStepIndex));
    // wireHoverTooltip (no el [data-tooltip]::before habitual, layout.css):
    // aquest botó viu a la capçalera del modal, molt a prop de la vora
    // esquerra (pas 1) o dreta (últim pas) — una vinyeta centrada amb
    // CSS pur hi quedaria tallada per la vora del modal en lloc de
    // sobresortir-ne, com sí que fa aquest mecanisme (posicionat en JS,
    // acotat només pels límits de la finestra).
    const tooltipText = 'Pas ' + (i + 1) + ' — ' + getStepTitle(stepIndex);
    btn.setAttribute('aria-label', tooltipText);
    wireHoverTooltip(btn, tooltipText);

    const bar = document.createElement('span');
    bar.className = 'modal-steps-nav-bar';
    btn.appendChild(bar);

    const num = document.createElement('span');
    num.className = 'modal-steps-nav-num';
    num.textContent = String(i + 1);
    btn.appendChild(num);

    btn.addEventListener('click', function () {
      if (stepIndex === modalStepIndex) return;
      captureStepValues();
      modalStepIndex = stepIndex;
      renderModalStep();
    });
    nav.appendChild(btn);
  });
}

function renderModalStep() {
  const fieldsWrap = document.getElementById('addRowFields');
  fieldsWrap.innerHTML = '';

  const stepTitle = getStepTitle(modalStepIndex);
  document.getElementById('addRowTitle').textContent = editingRowIndex !== null ? 'Editar fila' : 'Nova fila';
  document.getElementById('addRowStep').textContent = 'Pas ' + (modalStepIndex + 1) + ' — ' + stepTitle;
  document.getElementById('addRowModal').classList.toggle(
    'modal-wide', modalStepIndex === STEP_BREAKDOWN || modalStepIndex === STEP_EXTRAS
  );

  if (modalStepIndex === STEP_EXTRAS) {
    const selectedExtras = getSelectedAltresExtresLive();
    if (selectedExtras.indexOf('extraunit') !== -1) {
      const colIndex = state.headers.indexOf('ExtraUnitat');
      if (colIndex !== -1) fieldsWrap.appendChild(buildInputNumericSection(colIndex));
    }
    if (selectedExtras.indexOf('switch') !== -1) {
      const colIndex = state.headers.indexOf('ExtraSwitch');
      if (colIndex !== -1) fieldsWrap.appendChild(buildSwitchSection(colIndex));
    }
  } else if (modalStepIndex === STEP_BREAKDOWN) {
    const selected = getSelectedExtresLlistaLive();
    if (selected.indexOf('desplegable') !== -1) {
      const colIndex = state.headers.indexOf(DESPLEGABLE_HEADER);
      if (colIndex !== -1) fieldsWrap.appendChild(buildDesplegableSection(colIndex));
    }
    if (selected.indexOf('llinda') !== -1) {
      fieldsWrap.appendChild(buildLlindaSection());
    }
    if (selected.indexOf('altresExtres') !== -1) {
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
      // "Unit" és obligatori un cop apareix (quantityBased marcat);
      // "ExtresLlista" no ho és mai: deixar-lo buit és una tria vàlida
      // (vol dir "sense desglossament"), no un oblit.
      appendField(fieldsWrap, colIndex, def.header, control, { required: def.header === 'Unit' });

      if (def.header === 'ExtresLlista') {
        control.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
          checkbox.addEventListener('change', updateModalNavButtons);
        });
      }
    });
  } else if (modalStepIndex === STEP_OPTIONS && !isCalendarSheet() && !isBarraSheet() && !isCoctelSheet() && !isCoctelExtresSheet()) {
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
  document.getElementById('addRowProgressFill').style.transform =
    'scaleX(' + ((modalStepIndex + 1) / plannedSteps) + ')';
}

// En editar, la navegació per passos (renderStepsNav) ja permet saltar
// a qualsevol pas: no té sentit forçar-hi també Enrere/Següent en aquest
// ordre ni amagar "Desa els canvis" fins al darrer pas — es pot desar
// des de qualsevol punt, com un formulari normal.
function updateModalNavButtons() {
  const isEditing = editingRowIndex !== null;
  const isFirst = modalStepIndex === STEP_GENERAL;
  const isLast = isLastStep();
  document.getElementById('addRowBackBtn').hidden = isEditing || isFirst;
  document.getElementById('addRowNextBtn').hidden = isEditing || isLast;
  const submitBtn = document.getElementById('addRowSubmitBtn');
  submitBtn.hidden = !isEditing && !isLast;
  submitBtn.textContent = isEditing ? 'Desa els canvis' : 'Crea la fila';
  document.querySelector('.modal-progress').hidden = isEditing;
  if (!isEditing) updateProgressBar();
  renderStepsNav();
}

function handleModalNext() {
  captureStepValues();
  if (!validateActiveStep()) return;
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
