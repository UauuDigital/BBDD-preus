function loadMeta() {
  setStatus('Carregant...', 'loading');
  google.script.run.withSuccessHandler(onMetaLoaded).withFailureHandler(onError).getSheetsMeta();
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
    .withFailureHandler(silent ? function () {} : onError)
    .getSheetData(requestedName);
}

function applySheetData(data) {
  state.headers = data.headers || [];
  const width = state.headers.length;
  state.rows = (data.rows || []).map(function (row) { return padRow(row, width); });
  state.loaded = true;
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
    .withFailureHandler(onError)
    .appendRow(state.currentName, values);
}

function handleDeleteRow(rowIndex) {
  const label = state.rows[rowIndex][0] || ('fila ' + (rowIndex + 1));
  if (!confirm('Segur que vols esborrar "' + label + '"?')) return;
  setStatus('Esborrant fila...', 'loading');
  google.script.run
    .withSuccessHandler(loadCurrentSheet)
    .withFailureHandler(onError)
    .deleteRow(state.currentName, rowIndex);
}
