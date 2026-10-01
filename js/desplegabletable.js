// Secció "Desplegable" del pas de desglossament: permet construir una
// llista d'opcions (nom en 3 idiomes + preu) que es desa a la cel·la
// com a JSON: [{"CAT":"...","CAST":"...","ENG":"...","PREU":123}, ...]
const DESPLEGABLE_HEADER = 'Desplegable';

// Connecta un grup de camps [{ input, lang }] (codis 'ca'/'es'/'en')
// perquè, en escriure en un, es tradueixi automàticament als altres
// (amb debounce, com el mateix mecanisme del pas "Informació general").
function wireLangAutoTranslate(fields) {
  fields.forEach(function (field) {
    // Només el camp en català tradueix cap als altres; editar el
    // castellà o l'anglès a mà mai no dispara cap traducció.
    if (field.lang !== 'ca') return;
    const triggerTranslate = debounce(function () {
      const text = field.input.value.trim();
      if (!text) return;

      google.script.run
        .withSuccessHandler(function (translations) {
          if (field.input.value.trim() !== text) return;
          fields.forEach(function (other) {
            if (other === field) return;
            const translated = translations[other.lang];
            if (translated === undefined || document.activeElement === other.input) return;
            other.input.value = translated;
            // Dispara "input" perquè qualsevol listener propi del camp
            // (p.ex. la sincronització de dades del Switch) se n'assabenti:
            // només assignar .value no el dispara sol. isTrusted=false en
            // aquest event evita que torni a disparar una traducció en
            // cadena (vegeu el filtre més avall).
            other.input.dispatchEvent(new Event('input', { bubbles: true }));
          });
        })
        .withFailureHandler(onError)
        .translateToLangs(text, field.lang);
    }, 400);

    field.input.addEventListener('input', function (event) {
      if (!event.isTrusted) return;
      triggerTranslate();
    });
  });
}

function parseDesplegableItems(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Sincronitza "desplegable" al valor de la cel·la "ExtresLlista" amb si
// la columna "Desplegable" d'aquesta mateixa fila té opcions desades o
// no: l'afegeix quan n'hi ha i el treu quan no n'hi ha (mai pot quedar
// marcat sense cap opció real al darrere). Purament de lectura/
// visualització (no desa res sol): es recalcula a cada render, així que
// sempre queda consistent encara que "Desplegable" s'hagi editat sense
// passar mai per "ExtresLlista".
function withDesplegableAutoSelected(extresLlistaValue, rowIndex) {
  const desplegableColIndex = state.headers.indexOf(DESPLEGABLE_HEADER);
  if (desplegableColIndex === -1) return extresLlistaValue;
  const hasItems = parseDesplegableItems(state.rows[rowIndex][desplegableColIndex]).length > 0;

  const parts = String(extresLlistaValue || '').split(',').map(function (part) { return part.trim(); }).filter(Boolean);
  const index = parts.indexOf('desplegable');
  if (hasItems && index === -1) parts.push('desplegable');
  if (!hasItems && index !== -1) parts.splice(index, 1);
  return parts.join(',');
}

// Taula + formulari per construir la llista d'opcions (nom en 3
// idiomes + preu), independent de d'on es criden (pas de desglossament
// del formulari de nova fila, o el diàleg d'edició ràpida des de la
// taula): "items" es muta in situ (push/splice), mai es reassigna, així
// qui la té capturada (el propi cridant) sempre veu l'última versió;
// "onChange" es crida després de cada mutació perquè el cridant decideixi
// què fer-ne (desar a un input ocult, desar directament a la fulla...).
// Retorna { element, renderRows } — renderRows es reexposa perquè un
// cridant pugui forçar-ne el repintat si reverteix "items" ell mateix
// (p.ex. en desfer un desat fallit).
function buildDesplegableListEditor(items, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'desplegable-editor';

  const table = document.createElement('table');
  table.className = 'desplegable-table';
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  // Índex de l'opció que s'està editant en línia (-1 si cap).
  let editingIndex = -1;

  function renderRows() {
    tbody.innerHTML = '';
    if (editingIndex >= items.length) editingIndex = -1;
    if (!items.length) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 5;
      emptyCell.className = 'desplegable-empty';
      emptyCell.textContent = 'Encara no s\'ha afegit cap opció.';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }
    items.forEach(function (item, index) {
      tbody.appendChild(index === editingIndex ? buildEditRow(item) : buildReadRow(item, index));
    });
  }

  function buildIconButton(className, label, icon, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.dataset.tooltip = label;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = icon;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function buildReadRow(item, index) {
    const tr = document.createElement('tr');
    [item.CAT, item.CAST, item.ENG, item.PREU + ' €'].forEach(function (text) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    const tdActions = document.createElement('td');
    tdActions.className = 'desplegable-actions';
    tdActions.appendChild(buildIconButton('icon-btn', 'Edita aquesta opció', ICONS.pencil, function () {
      editingIndex = index;
      renderRows();
    }));
    tdActions.appendChild(buildIconButton('icon-btn icon-btn-danger', 'Esborra aquesta opció', ICONS.trash, function () {
      if (editingIndex !== -1 && index < editingIndex) editingIndex--;
      else if (index === editingIndex) editingIndex = -1;
      items.splice(index, 1);
      renderRows();
      onChange();
    }));
    tr.appendChild(tdActions);
    return tr;
  }

  // Fila en mode edició: 4 inputs sense traducció automàtica (editar el
  // nom d'una opció ja existent no ha de sobreescriure els altres idiomes).
  function buildEditRow(item) {
    const tr = document.createElement('tr');
    tr.className = 'desplegable-row-editing';
    const fields = [
      { key: 'CAT', label: 'Nom en català', type: 'text', value: item.CAT },
      { key: 'CAST', label: 'Nom en castellà', type: 'text', value: item.CAST },
      { key: 'ENG', label: 'Nom en anglès', type: 'text', value: item.ENG },
      { key: 'PREU', label: 'Preu', type: 'number', value: item.PREU },
    ];
    const inputs = fields.map(function (field) {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = field.type;
      if (field.type === 'number') input.step = '0.01';
      input.value = field.value;
      input.setAttribute('aria-label', field.label);
      td.appendChild(input);
      tr.appendChild(td);
      return input;
    });

    function isValid() {
      return inputs[0].value.trim() && inputs[1].value.trim() && inputs[2].value.trim() && inputs[3].value !== '';
    }
    function save() {
      if (!isValid()) return;
      item.CAT = inputs[0].value.trim();
      item.CAST = inputs[1].value.trim();
      item.ENG = inputs[2].value.trim();
      item.PREU = Number(inputs[3].value);
      editingIndex = -1;
      renderRows();
      onChange();
    }
    function cancel() {
      editingIndex = -1;
      renderRows();
    }

    const saveBtn = buildIconButton('icon-btn', 'Desa els canvis', ICONS.check, save);
    function refreshSaveBtn() { saveBtn.disabled = !isValid(); }
    refreshSaveBtn();

    inputs.forEach(function (input) {
      input.addEventListener('input', refreshSaveBtn);
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          save();
        } else if (event.key === 'Escape') {
          // Evita que l'Escape tanqui també el modal sencer.
          event.preventDefault();
          event.stopPropagation();
          cancel();
        }
      });
    });

    const tdActions = document.createElement('td');
    tdActions.className = 'desplegable-actions';
    tdActions.appendChild(saveBtn);
    tdActions.appendChild(buildIconButton('icon-btn', 'Cancel·la l\'edició', ICONS.close, cancel));
    tr.appendChild(tdActions);

    // Enfoca el primer camp un cop la fila és al DOM.
    setTimeout(function () { inputs[0].focus(); }, 0);
    return tr;
  }
  renderRows();

  const form = document.createElement('div');
  form.className = 'desplegable-form';

  const catInput = document.createElement('input');
  catInput.type = 'text';
  catInput.placeholder = 'Català';
  wireHoverTooltip(catInput, 'Nom de l\'opció en català. Si l\'escrius aquí, es tradueix sol a Castellà i Anglès.');

  const castInput = document.createElement('input');
  castInput.type = 'text';
  castInput.placeholder = 'Castellà';
  wireHoverTooltip(castInput, 'Traducció al castellà (es genera sola en escriure el nom en català, però es pot editar a mà).');

  const engInput = document.createElement('input');
  engInput.type = 'text';
  engInput.placeholder = 'Anglès';
  wireHoverTooltip(engInput, 'Traducció a l\'anglès (es genera sola en escriure el nom en català, però es pot editar a mà).');

  const priceWrap = document.createElement('div');
  priceWrap.className = 'currency-field';
  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.step = '0.01';
  priceInput.placeholder = 'Preu';
  wireHoverTooltip(priceWrap, 'Preu d\'aquesta opció del desplegable.');
  const priceSuffix = document.createElement('span');
  priceSuffix.className = 'currency-suffix';
  priceSuffix.textContent = '€';
  priceWrap.appendChild(priceInput);
  priceWrap.appendChild(priceSuffix);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn-primary';
  addBtn.textContent = 'Afegeix a la taula';
  wireHoverTooltip(addBtn, 'Afegeix aquesta opció a la llista del desplegable amb els 4 camps d\'aquí sobre.');

  function isEntryValid() {
    return Boolean(catInput.value.trim() && castInput.value.trim() && engInput.value.trim() && priceInput.value !== '');
  }
  function refreshAddBtn() { addBtn.disabled = !isEntryValid(); }
  refreshAddBtn();

  function addEntry() {
    if (!isEntryValid()) return;
    items.push({
      CAT: catInput.value.trim(),
      CAST: castInput.value.trim(),
      ENG: engInput.value.trim(),
      PREU: Number(priceInput.value),
    });
    renderRows();
    catInput.value = '';
    castInput.value = '';
    engInput.value = '';
    priceInput.value = '';
    refreshAddBtn();
    catInput.focus();
    onChange();
  }

  addBtn.addEventListener('click', addEntry);

  // Evita que un Enter dins d'aquests camps enviï tot el formulari del
  // modal (podria coincidir amb el pas final): en aquest mini-formulari
  // Enter equival a "Afegeix a la taula".
  [catInput, castInput, engInput, priceInput].forEach(function (input) {
    input.addEventListener('input', refreshAddBtn);
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      addEntry();
    });
  });

  wireLangAutoTranslate([
    { input: catInput, lang: 'ca' },
    { input: castInput, lang: 'es' },
    { input: engInput, lang: 'en' },
  ]);

  form.appendChild(catInput);
  form.appendChild(castInput);
  form.appendChild(engInput);
  form.appendChild(priceWrap);
  form.appendChild(addBtn);

  wrap.appendChild(table);
  wrap.appendChild(form);

  return { element: wrap, renderRows: renderRows };
}

// Secció "Desplegable" del pas de desglossament del formulari de nova
// fila: embolcall de buildDesplegableListEditor amb capçalera, input
// ocult (el que legeix captureStepValues en canviar de pas) i validació
// de "cal almenys una opció".
function buildDesplegableSection(colIndex) {
  const container = document.createElement('div');
  container.className = 'breakdown-section';
  // "group" (no un camp de formulari real) perquè pugui rebre
  // aria-invalid quan la llista és buida: sense cap rol, un lector de
  // pantalla no anunciaria mai aquest estat (vegeu wireRequiredField
  // més avall, on es passa el propi contenidor com a ariaTarget).
  container.setAttribute('role', 'group');
  container.setAttribute('aria-label', 'Llista d\'opcions del desplegable');

  const heading = document.createElement('h3');
  heading.className = 'section-heading';
  heading.textContent = 'Desplegable';
  container.appendChild(heading);

  const items = parseDesplegableItems(modalValues[colIndex]);

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.dataset.colIndex = String(colIndex);
  hiddenInput.value = JSON.stringify(items);

  const editor = buildDesplegableListEditor(items, function () {
    hiddenInput.value = JSON.stringify(items);
    container.dispatchEvent(new Event('change'));
  });

  container.appendChild(editor.element);
  container.appendChild(hiddenInput);

  // Cal almenys una opció afegida a la taula (el formulari de dalt, per
  // si sol, no compta com a valor: mentre no es clica "Afegeix a la
  // taula" no hi ha cap fila desada). El propi "container" (role=group)
  // com a ariaTarget, no el catInput per defecte: qui és realment
  // obligatori/invàlid és la llista sencera, no el formulari per
  // afegir-hi una fila nova.
  wireRequiredField(container, function () {
    return items.length ? '1' : '';
  }, 'Afegeix almenys una opció al desplegable.', container);

  return container;
}

