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
  renderTableFilters();
  renderTable();
  setStatus(state.rows.length + ' files carregades.', 'success');
}

function saveCell(input, rowIndex, colIndex) {
  const value = input.value;
  if (value === input.dataset.original) {
    input.classList.remove('dirty');
    return;
  }
  setStatus('Desant...', 'loading');
  google.script.run
    .withSuccessHandler(function () {
      state.rows[rowIndex][colIndex] = value;
      input.dataset.original = value;
      input.classList.remove('dirty');
      setStatus('Desat.', 'success');
    })
    .withFailureHandler(function (err) {
      input.value = input.dataset.original;
      input.classList.remove('dirty');
      onError(err);
    })
    .updateCell(state.currentName, rowIndex, colIndex, value);
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
