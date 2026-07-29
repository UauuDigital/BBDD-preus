function loadMeta() {
  setStatus('Carregant...', 'loading');
  google.script.run
    .withSuccessHandler(onMetaLoaded)
    .withFailureHandler(function (err) { onError(err, loadMeta); })
    .getSheetsMeta();
}

function onMetaLoaded(sheets) {
  state.sheets = sheets;
  if (!state.sheets.length) {
    setStatus('El full de càlcul no té cap pestanya.', 'error');
    return;
  }
  if (!state.currentName) state.currentName = state.sheets[0].name;
  renderTabs();
  loadCurrentSheet();
}

function loadCurrentSheet(silent) {
  const requestedName = state.currentName;
  if (!silent) setStatus('Carregant...', 'loading');
  google.script.run
    .withSuccessHandler(function (data) { onSheetLoaded(data, requestedName, silent); })
    .withFailureHandler(silent ? function () {} : function (err) { onError(err, function () { loadCurrentSheet(silent); }); })
    .getSheetData(requestedName);
}

function applySheetData(data) {
  state.headers = data.headers || [];
  const width = state.headers.length;
  state.rows = (data.rows || []).map(function (row) { return padRow(row, width); });
  state.loaded = true;
  state.selectedRows.clear();
}

function onSheetLoaded(data, requestedName, silent) {
  state.sheetCache[requestedName] = data;
  // Descarta la resposta si l'usuari ja ha canviat a una altra pestanya
  // mentre esperàvem el servidor (rellevant sobretot en refrescos silenciosos).
  if (requestedName !== state.currentName) return;
  applySheetData(data);
  renderCurrentView();
  if (!silent) setStatus(state.rows.length + ' files carregades.', 'success');
}

function handleAddRow() {
  openAddRowModal();
}

// Duplica una fila: es reenvia com a fila nova a appendRow, buidant Id
// (perquè el backend en generi un de nou) i DATA (perquè es recalculi
// sola a partir de Dia/Mes/Excepte, si el full en té).
function handleDuplicateRow(rowIndex) {
  const source = state.rows[rowIndex];
  const idColIndex = state.headers.findIndex(isIdHeader);
  const dataColIndex = state.headers.findIndex(isDataHeader);
  const values = source.map(function (value, colIndex) {
    if (colIndex === idColIndex || colIndex === dataColIndex) return '';
    return value;
  });
  setStatus('Duplicant fila...', 'loading');
  google.script.run
    .withSuccessHandler(loadCurrentSheet)
    .withFailureHandler(function (err) { onError(err, function () { handleDuplicateRow(rowIndex); }); })
    .appendRow(state.currentName, values);
}

function performDeleteRow(rowIndex) {
  setStatus('Esborrant fila...', 'loading');
  google.script.run
    .withSuccessHandler(loadCurrentSheet)
    .withFailureHandler(function (err) { onError(err, function () { performDeleteRow(rowIndex); }); })
    .deleteRow(state.currentName, rowIndex);
}

function handleDeleteRow(rowIndex) {
  const label = state.rows[rowIndex][0] || ('fila ' + (rowIndex + 1));
  confirmDelete('Segur que vols esborrar "' + label + '"? Aquesta acció no es pot desfer.').then(function (confirmed) {
    if (confirmed) performDeleteRow(rowIndex);
  });
}

// Duplicar en bloc: l'ordre no importa (cada fila s'afegeix al final,
// sense desplaçar les altres), així que es processen seqüencialment
// una darrere l'altra i es recarrega el full en acabar totes.
function handleBulkDuplicate(rowIndexes) {
  const idColIndex = state.headers.findIndex(isIdHeader);
  const dataColIndex = state.headers.findIndex(isDataHeader);
  const total = rowIndexes.length;

  let i = 0;
  function next() {
    if (i >= total) { loadCurrentSheet(); return; }
    const done = i;
    setStatus('Duplicant fila ' + (done + 1) + ' de ' + total + '...', 'loading');
    const rowIndex = rowIndexes[i++];
    const source = state.rows[rowIndex];
    const values = source.map(function (value, colIndex) {
      if (colIndex === idColIndex || colIndex === dataColIndex) return '';
      return value;
    });
    google.script.run
      .withSuccessHandler(next)
      .withFailureHandler(function (err) {
        onError(err, function () { handleBulkDuplicate(rowIndexes.slice(i - 1)); }, done + ' de ' + total + ' files duplicades abans de l\'error.');
      })
      .appendRow(state.currentName, values);
  }
  next();
}

// Esborrar en bloc: cal processar-les de l'índex més alt al més baix,
// perquè esborrar una fila desplaça totes les de sota una posició amunt
// (canviaria l'índex de les que encara falta esborrar si no es fes així).
function handleBulkDelete(rowIndexes) {
  const count = rowIndexes.length;
  const message = count === 1
    ? 'Segur que vols esborrar la fila seleccionada? Aquesta acció no es pot desfer.'
    : 'Segur que vols esborrar aquestes ' + count + ' files? Aquesta acció no es pot desfer.';
  confirmDelete(message, count === 1 ? 'Esborra' : 'Esborra-les').then(function (confirmed) {
    if (!confirmed) return;
    performBulkDelete(rowIndexes.slice().sort(function (a, b) { return b - a; }));
  });
}

function performBulkDelete(sortedDescRowIndexes) {
  const total = sortedDescRowIndexes.length;
  let i = 0;
  function next() {
    if (i >= total) { loadCurrentSheet(); return; }
    const done = i;
    setStatus('Esborrant fila ' + (done + 1) + ' de ' + total + '...', 'loading');
    const rowIndex = sortedDescRowIndexes[i++];
    google.script.run
      .withSuccessHandler(next)
      .withFailureHandler(function (err) {
        onError(err, function () { performBulkDelete(sortedDescRowIndexes.slice(i - 1)); }, done + ' de ' + total + ' files esborrades abans de l\'error.');
      })
      .deleteRow(state.currentName, rowIndex);
  }
  next();
}
