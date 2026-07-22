// Traducció automàtica dels camps de nom (pas "Informació general") i
// enviament final del formulari "+ Fila". La configuració dels passos
// viu a modal-config.js, l'estat en viu a modal-state.js, la
// construcció de camps a modal-fields.js i el render/navegació a
// modal-render.js.
function debounce(fn, delayMs) {
  let timeoutId;
  return function () {
    const args = arguments;
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () { fn.apply(context, args); }, delayMs);
  };
}

function handleServiceNameInput(event) {
  const sourceInput = event.target;
  const sourceHeader = sourceInput.dataset.langHeader;
  const text = sourceInput.value.trim();
  if (!text) return;

  google.script.run
    .withSuccessHandler(function (translations) {
      // Descarta la resposta si l'usuari ha seguit escrivint mentrestant.
      if (sourceInput.value.trim() !== text) return;
      Object.keys(translations).forEach(function (header) {
        const targetInput = document.querySelector('#addRowFields input[data-lang-header="' + header + '"]');
        if (targetInput && document.activeElement !== targetInput) targetInput.value = translations[header];
      });
    })
    .withFailureHandler(onError)
    .translateServiceName(text, sourceHeader);
}

function submitAddRowForm(event) {
  event.preventDefault();
  captureStepValues();

  const values = state.headers.map(function (_, colIndex) {
    return modalValues[colIndex] !== undefined ? modalValues[colIndex] : '';
  });

  closeAddRowModal();
  setStatus('Afegint fila...', 'loading');
  google.script.run
    .withSuccessHandler(loadCurrentSheet)
    .withFailureHandler(onError)
    .appendRow(state.currentName, values);
}
