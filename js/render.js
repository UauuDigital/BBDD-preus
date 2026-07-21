function renderTabs() {
  const nav = document.getElementById('tabs');
  nav.innerHTML = '';
  state.sheets.forEach(function (sheet) {
    const info = SHEET_INFO[sheet.name];
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (sheet.name === state.currentName ? ' active' : '');
    btn.type = 'button';
    btn.textContent = info ? info.label : sheet.name;
    btn.title = info ? sheet.name : '';
    btn.setAttribute('aria-selected', sheet.name === state.currentName ? 'true' : 'false');
    btn.addEventListener('click', function () {
      if (sheet.name === state.currentName) return;
      state.currentName = sheet.name;
      state.filterQuery = '';
      state.filterMasia = [];
      state.filterAny = [];
      document.getElementById('searchInput').value = '';
      renderTabs();
      renderSkeleton(state.headers.length || 3, 5);
      loadCurrentSheet();
    });
    nav.appendChild(btn);
  });

  const hintEl = document.getElementById('sheetHint');
  const currentInfo = SHEET_INFO[state.currentName];
  hintEl.textContent = currentInfo ? currentInfo.hint : '';
}

// Filtres per Masia i Any: només al full "Serveis", i només per a les
// columnes que hi existeixin. Es reconstrueixen cada cop que es carrega
// el full (les opcions depenen de les dades actuals), conservant la
// selecció ja feta.
function renderTableFilters() {
  const container = document.getElementById('tableFilters');
  container.innerHTML = '';
  container.hidden = state.currentName !== SERVICES_SHEET_NAME;
  if (container.hidden) return;

  [
    { header: 'Masia', selected: state.filterMasia, apply: function (values) { state.filterMasia = values; } },
    { header: 'Any', selected: state.filterAny, apply: function (values) { state.filterAny = values; } },
  ].forEach(function (def) {
    const colIndex = state.headers.indexOf(def.header);
    if (colIndex === -1) return;

    const field = buildDropdownField(
      colIndex, def.selected.join(', '), getDistinctColumnValues(colIndex, true), true, 'tableFilter', def.header
    );
    field.classList.add('table-filter');
    const hiddenInput = field.querySelector('input[type="hidden"]');
    field.addEventListener('change', function () {
      def.apply(hiddenInput.value ? hiddenInput.value.split(',').map(function (v) { return v.trim(); }).filter(Boolean) : []);
      renderTable();
    });

    container.appendChild(field);
  });
}

function renderSkeleton(cols, rows) {
  const table = document.getElementById('dataTable');
  table.innerHTML = '';
  const tbody = document.createElement('tbody');
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < Math.max(cols, 1); c++) {
      const td = document.createElement('td');
      const bar = document.createElement('div');
      bar.className = 'skeleton-cell';
      bar.style.width = (60 + ((r * 7 + c * 13) % 30)) + '%';
      td.appendChild(bar);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
}

function renderTable() {
  const table = document.getElementById('dataTable');
  table.innerHTML = '';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');

  const thActions = document.createElement('th');
  thActions.className = 'row-actions-col';
  headRow.appendChild(thActions);

  state.headers.forEach(function (label) {
    const th = document.createElement('th');
    const wrap = document.createElement('div');
    wrap.className = 'header-cell';
    wrap.textContent = label;
    th.appendChild(wrap);
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const query = normalizeText(state.filterQuery).trim();
  const masiaColIndex = state.headers.indexOf('Masia');
  const anyColIndex = state.headers.indexOf('Any');
  const visible = state.rows
    .map(function (row, rowIndex) { return { row: row, rowIndex: rowIndex }; })
    .filter(function (item) {
      if (query && !item.row.some(function (cell) { return normalizeText(cell).indexOf(query) !== -1; })) return false;
      if (!rowMatchesValueFilter(item.row, masiaColIndex, state.filterMasia)) return false;
      if (!rowMatchesValueFilter(item.row, anyColIndex, state.filterAny)) return false;
      return true;
    });

  if (!state.rows.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    const td = document.createElement('td');
    td.colSpan = state.headers.length + 1;
    td.textContent = 'Encara no hi ha cap fila. Clica "+ Fila" per afegir-ne la primera.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else if (!visible.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    const td = document.createElement('td');
    td.colSpan = state.headers.length + 1;
    td.textContent = state.filterQuery
      ? 'Cap fila coincideix amb "' + state.filterQuery + '".'
      : 'Cap fila coincideix amb els filtres seleccionats.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  visible.forEach(function (item) {
    const row = item.row;
    const rowIndex = item.rowIndex;
    const tr = document.createElement('tr');

    const tdActions = document.createElement('td');
    tdActions.className = 'row-actions-col';
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn';
    del.title = 'Esborra fila';
    del.setAttribute('aria-label', 'Esborra la fila ' + (rowIndex + 1));
    del.innerHTML = ICONS.trash;
    del.addEventListener('click', function () { handleDeleteRow(rowIndex); });
    tdActions.appendChild(del);
    tr.appendChild(tdActions);

    row.forEach(function (value, colIndex) {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.className = 'cell-input';
      input.value = value;
      input.dataset.original = value;
      input.setAttribute('aria-label', (state.headers[colIndex] || 'Columna ' + (colIndex + 1)) + ', fila ' + (rowIndex + 1));
      if (isIdHeader(state.headers[colIndex])) {
        input.readOnly = true;
        input.classList.add('cell-input-readonly');
      } else {
        input.addEventListener('input', function () { input.classList.add('dirty'); });
        input.addEventListener('change', function () { saveCell(input, rowIndex, colIndex); });
      }
      td.appendChild(input);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}
