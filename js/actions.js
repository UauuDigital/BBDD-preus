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

function renameColumn(colIndex, newLabel) {
  const oldLabel = state.headers[colIndex];
  if (newLabel === oldLabel) return;
  setStatus('Desant capçalera...', 'loading');
  google.script.run
    .withSuccessHandler(function () {
      state.headers[colIndex] = newLabel;
      setStatus('Desat.', 'success');
    })
    .withFailureHandler(function (err) {
      onError(err);
      renderTable();
    })
    .renameHeader(state.currentName, colIndex, newLabel);
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

function handleAddColumn() {
  const label = prompt('Nom de la nova columna:');
  if (!label) return;
  setStatus('Afegint columna...', 'loading');
  google.script.run
    .withSuccessHandler(loadCurrentSheet)
    .withFailureHandler(onError)
    .addColumn(state.currentName, label);
}

function handleDeleteColumn(colIndex, label) {
  if (!confirm('Segur que vols esborrar la columna "' + label + '"? S\'esborraran totes les dades d\'aquesta columna.')) return;
  setStatus('Esborrant columna...', 'loading');
  google.script.run
    .withSuccessHandler(loadCurrentSheet)
    .withFailureHandler(onError)
    .deleteColumn(state.currentName, colIndex);
}
