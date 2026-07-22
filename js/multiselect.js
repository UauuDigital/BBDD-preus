// Capçaleres que s'editen amb un desplegable de multiselecció en lloc
// d'un camp de text lliure (els valors seleccionats es desen a la
// cel·la separats per ", ").
const MULTISELECT_HEADERS = ['Masia', 'Masies', 'ExtraExtresLlista', 'ExtresLlista', 'Dia', 'Mes'];

// splitCombined: true si una mateixa cel·la pot contenir diversos valors
// separats per comes (cas de Masia/ExtraExtresLlista); false si cada
// cel·la conté un únic valor sencer (cas d'Unit, vegeu selectfield.js).
function getDistinctColumnValues(colIndex, splitCombined) {
  const seen = {};
  state.rows.forEach(function (row) {
    const raw = String(row[colIndex] || '');
    const parts = splitCombined === false ? [raw] : raw.split(',');
    parts.forEach(function (part) {
      const trimmed = part.trim();
      if (trimmed) seen[trimmed] = true;
    });
  });
  return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b, 'ca'); });
}

// Component compartit per als desplegables d'uniselecció (buildSelectField,
// buildYearField) i multiselecció (buildMultiselectField): mateix estil
// visual, es clica el nom de l'opció (no una casella al costat). En
// uniselecció, triar una opció desa el valor i tanca el panell; en
// multiselecció es poden marcar diverses sense que es tanqui.
// getOptionColor(optionValue): opcional, retorna un color CSS per
// pintar un punt al costat de l'opció (p.ex. getMasiaColor). S'aplica
// només a les files del panell, no al text del botó.
function buildDropdownField(colIndex, initialValue, options, multi, idPrefix, placeholderText, getOptionColor) {
  const initialSelection = multi
    ? String(initialValue || '').split(',').map(function (part) { return part.trim(); }).filter(Boolean)
    : (initialValue ? [String(initialValue)] : []);

  const wrap = document.createElement('div');
  wrap.className = 'multiselect';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = (idPrefix || 'addRowField') + colIndex;
  trigger.className = 'multiselect-trigger';
  trigger.disabled = !options.length;
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');

  // Punts de color del valor seleccionat, visibles amb el desplegable
  // tancat (no només en obrir-lo): per poder veure d'un cop d'ull els
  // colors de masia/any directament a la taula, sense haver de clicar.
  const triggerDots = document.createElement('span');
  triggerDots.className = 'multiselect-trigger-dots';
  const triggerLabel = document.createElement('span');
  triggerLabel.className = 'multiselect-trigger-label';
  const triggerChevron = document.createElement('span');
  triggerChevron.className = 'multiselect-trigger-chevron';
  triggerChevron.innerHTML = ICONS.chevron;
  trigger.appendChild(triggerDots);
  trigger.appendChild(triggerLabel);
  trigger.appendChild(triggerChevron);

  // En multiselecció, amb 3+ seleccions es mostra un recompte
  // ("3 seleccionades") en lloc de la llista sencera; el títol
  // (tooltip) sempre té la llista completa.
  const emptyLabel = placeholderText || 'Selecciona...';
  function setTriggerLabel(list) {
    triggerLabel.textContent = !list.length
      ? (options.length ? emptyLabel : 'Encara no hi ha valors per triar')
      : (!multi || list.length <= 2 ? list.join(', ') : list.length + ' seleccionades');
    trigger.title = list.join(', ');

    triggerDots.innerHTML = '';
    if (getOptionColor) {
      list.slice(0, 5).forEach(function (value) {
        const dot = document.createElement('span');
        dot.className = 'multiselect-trigger-dot';
        dot.style.background = getOptionColor(value);
        triggerDots.appendChild(dot);
      });
    }
  }
  setTriggerLabel(initialSelection);

  // El panel fa servir position:fixed (calculat en JS a openPanel) en
  // lloc de "absolute": si no, quedaria tallat pel scroll intern del
  // modal (.modal-fields té overflow-y: auto). Es manté com a fill
  // de "wrap" (dins el <dialog>) perquè "position: fixed" ja n'evita
  // el clipping sense necessitat de treure'l del top layer del modal.
  const panel = document.createElement('div');
  panel.className = 'multiselect-panel';
  panel.hidden = true;

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.dataset.colIndex = String(colIndex);
  hiddenInput.value = multi ? initialSelection.join(', ') : (initialSelection[0] || '');

  const radioGroupName = 'dropdown-' + colIndex + '-' + Math.random().toString(36).slice(2);

  function updateSelection() {
    const checkedInputs = Array.prototype.filter
      .call(panel.querySelectorAll('input'), function (input) { return input.checked; });
    const values = checkedInputs.map(function (input) { return input.value; });
    hiddenInput.value = multi ? values.join(', ') : (values[0] || '');
    setTriggerLabel(values);
  }

  options.forEach(function (option) {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'multiselect-option';

    // L'input real es manté per a l'estat/accessibilitat però es veu
    // ocult: es clica el nom (tota la fila), no una casella al costat.
    const optionInput = document.createElement('input');
    optionInput.type = multi ? 'checkbox' : 'radio';
    if (!multi) optionInput.name = radioGroupName;
    optionInput.className = 'multiselect-option-input';
    optionInput.value = option;
    optionInput.checked = initialSelection.indexOf(option) !== -1;

    const text = document.createElement('span');
    text.className = 'multiselect-option-text';
    text.textContent = option;

    const check = document.createElement('span');
    check.className = 'multiselect-option-check';
    check.innerHTML = ICONS.check;

    optionLabel.classList.toggle('is-selected', optionInput.checked);
    optionInput.addEventListener('change', function () {
      if (!multi) {
        panel.querySelectorAll('.multiselect-option').forEach(function (el) { el.classList.remove('is-selected'); });
      }
      optionLabel.classList.toggle('is-selected', optionInput.checked);
      updateSelection();
      if (!multi) closePanel();
    });

    optionLabel.appendChild(optionInput);
    if (getOptionColor) {
      const dot = document.createElement('span');
      dot.className = 'multiselect-option-dot';
      dot.style.background = getOptionColor(option);
      optionLabel.appendChild(dot);
    }
    optionLabel.appendChild(text);
    optionLabel.appendChild(check);
    panel.appendChild(optionLabel);
  });

  function repositionPanel() {
    const rect = trigger.getBoundingClientRect();
    panel.style.top = (rect.bottom + 4) + 'px';
    panel.style.left = rect.left + 'px';
    panel.style.width = rect.width + 'px';
  }

  function openPanel() {
    repositionPanel();
    panel.hidden = false;
    trigger.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    // capture:true perquè els events "scroll" no fan bombolla: així es
    // detecta tant el scroll de la finestra com el d'un contenidor
    // intern amb overflow (.modal-fields, .table-wrap...) sense haver
    // de conèixer quin és — funciona igual dins el modal que a la
    // barra d'eines de la taula.
    window.addEventListener('scroll', closePanel, { passive: true, capture: true });
    window.addEventListener('resize', closePanel);
  }

  function closePanel() {
    panel.hidden = true;
    trigger.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    window.removeEventListener('scroll', closePanel, { capture: true });
    window.removeEventListener('resize', closePanel);
  }
  panel._closeMultiselect = closePanel;

  trigger.addEventListener('click', function (event) {
    event.stopPropagation();
    document.querySelectorAll('.multiselect-panel').forEach(function (openPanelEl) {
      if (openPanelEl !== panel && !openPanelEl.hidden && openPanelEl._closeMultiselect) openPanelEl._closeMultiselect();
    });
    if (panel.hidden) openPanel(); else closePanel();
  });

  panel.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closePanel();
      trigger.focus();
    }
  });

  wrap.appendChild(trigger);
  wrap.appendChild(panel);
  wrap.appendChild(hiddenInput);
  return wrap;
}

document.addEventListener('click', function () {
  document.querySelectorAll('.multiselect-panel').forEach(function (panel) {
    if (!panel.hidden && panel._closeMultiselect) panel._closeMultiselect();
  });
});

function buildMultiselectField(colIndex, initialValue, fixedOptions, idPrefix, getOptionColor) {
  const options = fixedOptions || getDistinctColumnValues(colIndex, true);
  return buildDropdownField(colIndex, initialValue, options, true, idPrefix, undefined, getOptionColor);
}
