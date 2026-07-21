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

  state.headers.forEach(function (label, colIndex) {
    const th = document.createElement('th');
    const wrap = document.createElement('div');
    wrap.className = 'header-cell';

    const input = document.createElement('input');
    input.className = 'header-input';
    input.value = label;
    input.setAttribute('aria-label', 'Nom de la columna ' + (colIndex + 1));
    input.addEventListener('change', function () { renameColumn(colIndex, input.value); });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn';
    del.title = 'Esborra columna';
    del.setAttribute('aria-label', 'Esborra la columna "' + label + '"');
    del.innerHTML = ICONS.trash;
    del.addEventListener('click', function () { handleDeleteColumn(colIndex, label); });

    wrap.appendChild(input);
    wrap.appendChild(del);
    th.appendChild(wrap);
    headRow.appendChild(th);
  });

  const thActions = document.createElement('th');
  thActions.className = 'row-actions-col';
  headRow.appendChild(thActions);
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const query = normalizeText(state.filterQuery).trim();
  const visible = state.rows
    .map(function (row, rowIndex) { return { row: row, rowIndex: rowIndex }; })
    .filter(function (item) {
      if (!query) return true;
      return item.row.some(function (cell) { return normalizeText(cell).indexOf(query) !== -1; });
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
    td.textContent = 'Cap fila coincideix amb "' + state.filterQuery + '".';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  visible.forEach(function (item) {
    const row = item.row;
    const rowIndex = item.rowIndex;
    const tr = document.createElement('tr');
    row.forEach(function (value, colIndex) {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.className = 'cell-input';
      input.value = value;
      input.dataset.original = value;
      input.setAttribute('aria-label', (state.headers[colIndex] || 'Columna ' + (colIndex + 1)) + ', fila ' + (rowIndex + 1));
      input.addEventListener('input', function () { input.classList.add('dirty'); });
      input.addEventListener('change', function () { saveCell(input, rowIndex, colIndex); });
      td.appendChild(input);
      tr.appendChild(td);
    });

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

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}
