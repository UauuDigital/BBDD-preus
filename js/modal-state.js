// Lectura en viu de l'estat del formulari, per decidir a cada moment
// (sense esperar a canviar de pas) si calen els passos condicionals 3,
// 4 i 5, i quants passos hi haurà en total (barra de progrés).
function readLiveValue(colIndex) {
  const liveEl = document.querySelector('#addRowFields [data-col-index="' + colIndex + '"]');
  if (!liveEl) return modalValues[colIndex];
  return liveEl.type === 'checkbox' ? (liveEl.checked ? 'TRUE' : 'FALSE') : liveEl.value;
}

function isDetailsStepNeededLive() {
  return DETAIL_STEP_FIELDS.some(function (def) {
    const condColIndex = state.headers.indexOf(def.conditionHeader);
    return condColIndex !== -1 && readLiveValue(condColIndex) === 'TRUE';
  });
}

function getActiveDetailFields() {
  return DETAIL_STEP_FIELDS.filter(function (def) {
    const condColIndex = state.headers.indexOf(def.conditionHeader);
    return condColIndex !== -1
      && modalValues[condColIndex] === 'TRUE'
      && state.headers.indexOf(def.header) !== -1;
  });
}

function getSelectedExtresLlistaLive() {
  const colIndex = state.headers.indexOf('ExtresLlista');
  if (colIndex === -1) return [];
  const raw = readLiveValue(colIndex) || '';
  return String(raw).split(',').map(function (part) { return part.trim(); }).filter(Boolean);
}

function isBreakdownStepNeededLive() {
  return getSelectedExtresLlistaLive().length > 0;
}

function getSelectedAltresExtresLive() {
  const colIndex = state.headers.indexOf('ExtraExtresLlista');
  if (colIndex === -1) return [];
  const raw = readLiveValue(colIndex) || '';
  return String(raw).split(',').map(function (part) { return part.trim(); }).filter(Boolean);
}

function isExtrasStepNeededLive() {
  return getSelectedAltresExtresLive().length > 0;
}

// Nombre de passos previstos amb la informació que es coneix fins ara
// (les tries encara no fetes es donen per "no calen"): la barra de
// progrés es recalcula cada pas i pot créixer a mesura que l'usuari
// marca opcions que n'afegeixen més endavant.
function getPlannedStepCount() {
  let count = 2;
  if (isDetailsStepNeededLive()) {
    count++;
    if (isBreakdownStepNeededLive()) {
      count++;
      if (isExtrasStepNeededLive()) count++;
    }
  }
  return count;
}
