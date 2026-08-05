// Esquelet de càrrega i la construcció de la taula de dades pròpiament
// dita. La navegació (pestanyes, commutador de vista) viu a
// render-nav.js, els filtres a render-filters.js i la construcció de
// cada cel·la editable a render-cell.js.
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

  const visibleColIndexes = getVisibleColIndexes();
  // Si "Llindà Principi/Final" i els 2 preus hi són tots 4 i seguits
  // (en aquest ordre), es pinten com una sola columna amb el mateix
  // gràfic que el pas "Llindà" del formulari de nova fila (vegeu
  // getLlindaMergeStart/buildLlindaTableCellControl, llindasection.js).
  // Si en falta algun o no són consecutius, cada columna es manté
  // separada com sempre (cap sorpresa amb fulls que no segueixen aquest
  // esquema).
  const llindaMergeStart = getLlindaMergeStart(visibleColIndexes);

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');

  const thActions = document.createElement('th');
  thActions.className = 'row-actions-col';
  const selectAll = document.createElement('input');
  selectAll.type = 'checkbox';
  selectAll.className = 'row-select-checkbox';
  selectAll.setAttribute('aria-label', 'Selecciona totes les files visibles');
  thActions.appendChild(selectAll);
  headRow.appendChild(thActions);

  visibleColIndexes.forEach(function (colIndex, i) {
    // Les 3 columnes següents a on comença el grup del Llindà queden
    // absorbides pel colSpan del <th> fusionat (vegeu més avall): no
    // en pinten cap de pròpia.
    if (llindaMergeStart !== null && i > llindaMergeStart && i <= llindaMergeStart + 3) return;
    const isLlindaMerge = llindaMergeStart !== null && i === llindaMergeStart;

    const th = document.createElement('th');
    if (isLlindaMerge) {
      th.colSpan = 4;
      th.className = 'llinda-cell';
    } else {
      const colClass = columnClassFor(state.headers[colIndex]);
      if (colClass) th.classList.add(colClass);
    }

    const headerRow = document.createElement('div');
    headerRow.className = 'header-cell-row';

    if (isLlindaMerge) {
      // Columna fusionada: no és una capçalera ordenable (no
      // representa un únic valor comparable), només una etiqueta.
      const label = document.createElement('span');
      label.className = 'header-cell-label';
      label.textContent = 'Llindà';
      headerRow.appendChild(label);
    } else {
      const wrap = document.createElement('button');
      wrap.type = 'button';
      wrap.className = 'header-cell';
      wrap.setAttribute('aria-label', 'Ordena per "' + state.headers[colIndex] + '"');

      const label = document.createElement('span');
      label.className = 'header-cell-label';
      label.textContent = state.headers[colIndex];
      wrap.appendChild(label);

      if (state.sortColIndex === colIndex) {
        const arrow = document.createElement('span');
        arrow.className = 'header-cell-sort-icon';
        arrow.innerHTML = ICONS.chevron;
        if (state.sortDirection === 'asc') arrow.classList.add('is-asc');
        wrap.appendChild(arrow);
      }

      wrap.addEventListener('click', function () {
        if (state.sortColIndex === colIndex) {
          state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortColIndex = colIndex;
          state.sortDirection = 'asc';
        }
        renderTable();
      });

      headerRow.appendChild(wrap);

      // Mateixa ajuda contextual que ja existeix al formulari "+ Fila"
      // (vegeu FIELD_HELP_TEXT a modal-fields.js), ara també visible a
      // la pròpia capçalera de la taula: les columnes abreujades
      // (MÍN, PREU/P...) no haurien d'obligar a obrir el modal per
      // entendre-les. Germana del botó d'ordenació, no filla: un
      // <button> no pot contenir cap altre element interactiu.
      const helpIcon = buildFieldHelpIcon(state.headers[colIndex]);
      if (helpIcon) headerRow.appendChild(helpIcon);
    }

    th.appendChild(headerRow);
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const masiaColIndex = state.headers.indexOf('Masia');
  const anyColIndex = state.headers.indexOf('Any');
  const diaColIndex = state.headers.indexOf('Dia');
  const mesColIndex = state.headers.indexOf('Mes');
  const visible = state.rows
    .map(function (row, rowIndex) { return { row: row, rowIndex: rowIndex }; })
    .filter(function (item) {
      if (!rowMatchesValueFilter(item.row, masiaColIndex, state.filterMasia)) return false;
      if (!rowMatchesValueFilter(item.row, anyColIndex, state.filterAny)) return false;
      // Dia/Mes buits al full = "s'aplica a tots els dies/mesos" (mateixa
      // regla que fa servir el calendari): una cel·la buida no s'exclou
      // encara que hi hagi un filtre actiu.
      if (!rowMatchesValueFilter(item.row, diaColIndex, state.filterDia, { emptyMeansAll: true, normalize: normalizeDiaForFilter })) return false;
      if (!rowMatchesValueFilter(item.row, mesColIndex, state.filterMes, { emptyMeansAll: true, normalize: normalizeText })) return false;
      return true;
    });

  if (state.sortColIndex !== -1) {
    const dir = state.sortDirection === 'desc' ? -1 : 1;
    const sortColIndex = state.sortColIndex;
    visible.sort(function (a, b) { return compareForSort(a.row[sortColIndex], b.row[sortColIndex]) * dir; });
  }

  // Neteja de la selecció d'índexs que ja no són visibles (filtrats o
  // ordenats fora), perquè "Esborra"/"Duplica" en bloc no actuïn mai
  // sobre una fila que l'usuari ja no veu marcada.
  const visibleRowIndexes = visible.map(function (item) { return item.rowIndex; });
  Array.from(state.selectedRows).forEach(function (rowIndex) {
    if (visibleRowIndexes.indexOf(rowIndex) === -1) state.selectedRows.delete(rowIndex);
  });

  selectAll.checked = Boolean(visibleRowIndexes.length) && visibleRowIndexes.every(function (rowIndex) { return state.selectedRows.has(rowIndex); });
  selectAll.indeterminate = !selectAll.checked && visibleRowIndexes.some(function (rowIndex) { return state.selectedRows.has(rowIndex); });
  selectAll.addEventListener('change', function () {
    if (selectAll.checked) visibleRowIndexes.forEach(function (rowIndex) { state.selectedRows.add(rowIndex); });
    else visibleRowIndexes.forEach(function (rowIndex) { state.selectedRows.delete(rowIndex); });
    renderTable();
  });

  if (!state.rows.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    const td = document.createElement('td');
    td.colSpan = visibleColIndexes.length + 1;
    td.textContent = 'Encara no hi ha cap fila. Clica "+ Fila" per afegir-ne la primera.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else if (!visible.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    const td = document.createElement('td');
    td.colSpan = visibleColIndexes.length + 1;
    td.textContent = 'Cap fila coincideix amb els filtres seleccionats.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  visible.forEach(function (item) {
    const row = item.row;
    const rowIndex = item.rowIndex;
    const tr = document.createElement('tr');

    const tdActions = document.createElement('td');
    tdActions.className = 'row-actions-col';
    const rowSelect = document.createElement('input');
    rowSelect.type = 'checkbox';
    rowSelect.className = 'row-select-checkbox';
    rowSelect.checked = state.selectedRows.has(rowIndex);
    rowSelect.setAttribute('aria-label', 'Selecciona la fila ' + (rowIndex + 1));
    rowSelect.addEventListener('change', function () {
      if (rowSelect.checked) state.selectedRows.add(rowIndex); else state.selectedRows.delete(rowIndex);
      renderTable();
    });
    tdActions.appendChild(rowSelect);
    const dup = document.createElement('button');
    dup.type = 'button';
    dup.className = 'icon-btn';
    dup.dataset.tooltip = 'Duplica fila';
    dup.setAttribute('aria-label', 'Duplica la fila ' + (rowIndex + 1));
    dup.innerHTML = ICONS.duplicate;
    dup.addEventListener('click', function () { handleDuplicateRow(rowIndex); });
    tdActions.appendChild(dup);
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn';
    del.dataset.tooltip = 'Esborra fila';
    del.setAttribute('aria-label', 'Esborra la fila ' + (rowIndex + 1));
    del.innerHTML = ICONS.trash;
    del.addEventListener('click', function () { handleDeleteRow(rowIndex); });
    tdActions.appendChild(del);
    tr.appendChild(tdActions);

    visibleColIndexes.forEach(function (colIndex, i) {
      // Absorbides pel colspan de la cel·la fusionada d'abaix (mateix
      // criteri que a la capçalera).
      if (llindaMergeStart !== null && i > llindaMergeStart && i <= llindaMergeStart + 3) return;

      const td = document.createElement('td');
      if (llindaMergeStart !== null && i === llindaMergeStart) {
        td.colSpan = 4;
        td.className = 'llinda-cell';
        const control = buildLlindaTableCellControl(rowIndex);
        if (control) td.appendChild(control);
        tr.appendChild(td);
        return;
      }

      const value = row[colIndex];
      const colClass = columnClassFor(state.headers[colIndex]);
      if (colClass) td.classList.add(colClass);
      const control = buildTableCellControl(state.headers[colIndex], colIndex, rowIndex, value);
      getLabelableElement(control).setAttribute(
        'aria-label', (state.headers[colIndex] || 'Columna ' + (colIndex + 1)) + ', fila ' + (rowIndex + 1)
      );
      td.appendChild(control);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  renderBulkActionsBar();
}

// Barra que apareix sobre la taula quan hi ha files marcades amb la
// casella de selecció, amb les accions en bloc (duplicar/esborrar).
function renderBulkActionsBar() {
  const bar = document.getElementById('bulkActionsBar');
  const count = state.selectedRows.size;
  bar.hidden = count === 0;
  if (!count) return;
  document.getElementById('bulkActionsCount').textContent =
    count === 1 ? '1 fila seleccionada' : (count + ' files seleccionades');
  const rowIndexes = Array.from(state.selectedRows);
  document.getElementById('bulkDuplicateBtn').onclick = function () { handleBulkDuplicate(rowIndexes); };
  document.getElementById('bulkDeleteBtn').onclick = function () { handleBulkDelete(rowIndexes); };
  document.getElementById('bulkClearBtn').onclick = function () {
    state.selectedRows.clear();
    renderTable();
  };
}
