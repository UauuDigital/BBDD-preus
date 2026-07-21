// Secció "Desplegable" del pas de desglossament: permet construir una
// llista d'opcions (nom en 3 idiomes + preu) que es desa a la cel·la
// com a JSON: [{"CAT":"...","CAST":"...","ENG":"...","PREU":123}, ...]
const DESPLEGABLE_HEADER = 'Desplegable';

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
      removeBtn.title = 'Esborra aquesta opció';
      removeBtn.innerHTML = ICONS.trash;
      removeBtn.addEventListener('click', function () {
        items.splice(index, 1);
        hiddenInput.value = JSON.stringify(items);
        renderRows();
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

  const castInput = document.createElement('input');
  castInput.type = 'text';
  castInput.placeholder = 'Castellà';

  const engInput = document.createElement('input');
  engInput.type = 'text';
  engInput.placeholder = 'Anglès';

  const priceWrap = document.createElement('div');
  priceWrap.className = 'currency-field';
  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.step = '0.01';
  priceInput.placeholder = 'Preu';
  const priceSuffix = document.createElement('span');
  priceSuffix.className = 'currency-suffix';
  priceSuffix.textContent = '€';
  priceWrap.appendChild(priceInput);
  priceWrap.appendChild(priceSuffix);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn-primary';
  addBtn.textContent = 'Afegeix a la taula';
  addBtn.addEventListener('click', function () {
    if (!catInput.value.trim() || !castInput.value.trim() || !engInput.value.trim() || priceInput.value === '') return;
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
    catInput.focus();
  });

  form.appendChild(catInput);
  form.appendChild(castInput);
  form.appendChild(engInput);
  form.appendChild(priceWrap);
  form.appendChild(addBtn);

  container.appendChild(table);
  container.appendChild(form);
  container.appendChild(hiddenInput);
  return container;
}
