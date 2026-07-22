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

function loadCurrentSheet() {
  setStatus('Carregant...', 'loading');
  google.script.run.withSuccessHandler(onSheetLoaded).withFailureHandler(onError).getSheetData(state.currentName);
}

function onSheetLoaded(data) {
  state.headers = data.headers || [];
  const width = state.headers.length;
  state.rows = (data.rows || []).map(function (row) { return padRow(row, width); });
  state.loaded = true;
  renderCurrentView();
  setStatus(state.rows.length + ' files carregades.', 'success');
}

function handleAddRow() {
  openAddRowModal();
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
