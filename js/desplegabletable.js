// Secció "Desplegable" del pas de desglossament: permet construir una
// llista d'opcions (nom en 3 idiomes + preu) que es desa a la cel·la
// com a JSON: [{"CAT":"...","CAST":"...","ENG":"...","PREU":123}, ...]
const DESPLEGABLE_HEADER = 'Desplegable';

// Connecta un grup de camps [{ input, lang }] (codis 'ca'/'es'/'en')
// perquè, en escriure en un, es tradueixi automàticament als altres
// (amb debounce, com el mateix mecanisme del pas "Informació general").
function wireLangAutoTranslate(fields) {
  fields.forEach(function (field) {
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

  function renderRows() {
    tbody.innerHTML = '';
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
      const tr = document.createElement('tr');
      [item.CAT, item.CAST, item.ENG, item.PREU + ' €'].forEach(function (text) {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      const tdActions = document.createElement('td');
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'icon-btn';
      removeBtn.dataset.tooltip = 'Esborra aquesta opció';
      removeBtn.setAttribute('aria-label', 'Esborra aquesta opció');
      removeBtn.innerHTML = ICONS.trash;
      removeBtn.addEventListener('click', function () {
        items.splice(index, 1);
        renderRows();
        onChange();
      });
      tdActions.appendChild(removeBtn);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
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

// Botó de la cel·la a la taula principal (columna "Desplegable"): mostra
// un resum ("N opcions") i, en clicar-hi, obre un diàleg amb el mateix
// editor (taula + formulari) que al pas de desglossament, però desant
// cada canvi a l'instant (com la resta de cel·les editables), no en
// acabar tot un formulari de nova fila.
function updateDesplegableCellBtnLabel(btn, items) {
  // Cel·la buida (no "Sense opcions") quan encara no hi ha cap opció:
  // mateix criteri que la resta de columnes sense valor a la taula
  // (p.ex. buildMultiselectField amb placeholder ''). El botó continua
  // sent clicable per afegir-ne la primera.
  btn.textContent = items.length
    ? items.length + (items.length === 1 ? ' opció' : ' opcions')
    : '';
}

function openDesplegableCellDialog(colIndex, rowIndex, items, onSaved) {
  const dialog = document.getElementById('desplegableCellModal');
  const fieldsWrap = document.getElementById('desplegableCellFields');
  fieldsWrap.innerHTML = '';

  // Última versió efectivament desada al servidor: si un desat falla,
  // "items" es reverteix a aquest JSON (i no simplement es descarta el
  // canvi, perquè l'usuari pot haver afegit/tret més d'una opció abans
  // que la crida fallida torni).
  let lastSavedJson = JSON.stringify(items);

  const editor = buildDesplegableListEditor(items, function () {
    const attemptedJson = JSON.stringify(items);
    saveTableCell(rowIndex, colIndex, attemptedJson, function () {
      items.length = 0;
      Array.prototype.push.apply(items, JSON.parse(lastSavedJson));
      editor.renderRows();
      onSaved(items);
    }, function () {
      lastSavedJson = attemptedJson;
      onSaved(items);
    });
  });
  fieldsWrap.appendChild(editor.element);

  const closeBtn = document.getElementById('desplegableCellCloseBtn');
  function onClose() {
    closeBtn.removeEventListener('click', onClose);
    dialog.removeEventListener('cancel', onClose);
    if (dialog.open) dialog.close();
  }
  closeBtn.addEventListener('click', onClose);
  // "cancel" es dispara en tancar amb Escape.
  dialog.addEventListener('cancel', onClose);

  dialog.showModal();
}

function buildDesplegableCellControl(colIndex, rowIndex, value) {
  const items = parseDesplegableItems(value);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'desplegable-cell-btn';
  updateDesplegableCellBtnLabel(btn, items);
  wireHoverTooltip(btn, 'Edita la llista d\'opcions del desplegable.');

  btn.addEventListener('click', function () {
    // renderTable() sencer (no només updateDesplegableCellBtnLabel en
    // aquest botó): un canvi aquí també pot alterar què hi surt marcat a
    // "ExtresLlista" d'aquesta mateixa fila (withDesplegableAutoSelected),
    // que és una cel·la diferent i, sense repintar-la, es quedava amb el
    // valor vell fins que l'usuari recarregava la pàgina.
    openDesplegableCellDialog(colIndex, rowIndex, items, function () {
      renderTable();
    });
  });

  return btn;
}
