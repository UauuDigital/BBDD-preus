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
        hiddenInput.value = JSON.stringify(items);
        renderRows();
        container.dispatchEvent(new Event('change'));
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
    hiddenInput.value = JSON.stringify(items);
    renderRows();
    catInput.value = '';
    castInput.value = '';
    engInput.value = '';
    priceInput.value = '';
    refreshAddBtn();
    catInput.focus();
    container.dispatchEvent(new Event('change'));
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

  container.appendChild(table);
  container.appendChild(form);
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
