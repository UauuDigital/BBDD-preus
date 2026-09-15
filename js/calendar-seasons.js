// Temporada (alta / mitja / baixa) segons dia de la setmana i mes.
// Regla purament de calendari (no depèn de les dades del full): es fa
// servir només per pintar la graella, no per filtrar files.
//
// - Alta:  dissabtes de maig, juny, juliol, agost, setembre, octubre i novembre.
// - Mitja: dissabtes d'abril; divendres de maig, juny, juliol, agost, setembre i octubre.
// - Baixa: la resta (dilluns-dijous i diumenges sempre; dissabtes de
//   gener, febrer, març i desembre; divendres de gener, febrer, març,
//   abril, novembre i desembre).
const SEASON_META = {
  alta:  { label: 'Temporada alta',  shortLabel: 'Alta',  className: 'season-alta' },
  mitja: { label: 'Temporada mitja', shortLabel: 'Mitja', className: 'season-mitja' },
  baixa: { label: 'Temporada baixa', shortLabel: 'Baixa', className: 'season-baixa' }
};

function getSeasonForWeekdayMonth(weekday, month) {
  if (weekday === 6) { // dissabte
    if (month >= 4 && month <= 10) return 'alta'; // maig-novembre
    if (month === 3) return 'mitja'; // abril
    return 'baixa'; // gener, febrer, març, desembre
  }
  if (weekday === 5) { // divendres
    if (month >= 4 && month <= 9) return 'mitja'; // maig-octubre
    return 'baixa'; // gener, febrer, març, abril, novembre, desembre
  }
  return 'baixa'; // dilluns, dimarts, dimecres, dijous, diumenge
}

function getSeasonForDate(date) {
  return getSeasonForWeekdayMonth(date.getDay(), date.getMonth());
}

// Temporades que cobreix una regla de la taula (columnes "Dia"/"Mes",
// que poden llistar-ne diversos separats per comes, o quedar buides
// per dir "tots"): a diferència de getSeasonForDate, aquí no hi ha una
// data concreta, així que es calcula el conjunt de totes les temporades
// possibles combinant cada dia de la setmana amb cada mes de la regla.
function getSeasonsForRuleValues(diaRaw, mesRaw) {
  const diaTrim = String(diaRaw || '').trim();
  const mesTrim = String(mesRaw || '').trim();

  const weekdays = diaTrim
    ? diaTrim.split(',').map(function (part) { return normalizeWeekdayName(part); }).filter(function (w) { return w !== null; })
    : [0, 1, 2, 3, 4, 5, 6];

  const months = mesTrim
    ? mesTrim.split(',').map(function (part) { return normalizeText(part).trim(); })
      .map(function (name) { return MONTH_NAMES_CA.findIndex(function (m) { return normalizeText(m) === name; }); })
      .filter(function (m) { return m !== -1; })
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const found = [];
  weekdays.forEach(function (weekday) {
    months.forEach(function (month) {
      const season = getSeasonForWeekdayMonth(weekday, month);
      if (found.indexOf(season) === -1) found.push(season);
    });
  });

  return ['alta', 'mitja', 'baixa'].filter(function (s) { return found.indexOf(s) !== -1; });
}

// Cel·la de la columna "Temporada" a la taula: el nom de la temporada
// escrit amb el seu color (normalment una sola; més d'una, separades
// per "/", si la regla combina mesos/dies de temporades diferents).
function buildSeasonTableCell(diaRaw, mesRaw) {
  const wrap = document.createElement('span');
  wrap.className = 'season-cell';
  const seasons = getSeasonsForRuleValues(diaRaw, mesRaw);
  if (!seasons.length) return wrap;
  seasons.forEach(function (season, i) {
    if (i > 0) wrap.appendChild(document.createTextNode(' / '));
    const label = document.createElement('span');
    label.className = 'season-label ' + SEASON_META[season].className;
    label.textContent = SEASON_META[season].shortLabel;
    wrap.appendChild(label);
  });
  wrap.setAttribute('aria-label', seasons.map(function (s) { return SEASON_META[s].label; }).join(', '));
  return wrap;
}

const SEASON_SHORT_LABEL_TO_KEY = { Alta: 'alta', Mitja: 'mitja', Baixa: 'baixa' };

function getSeasonFilterColor(shortLabel) {
  const key = SEASON_SHORT_LABEL_TO_KEY[shortLabel];
  return key ? 'var(--' + SEASON_META[key].className + ')' : null;
}

// Filtre "Temporada" de la taula: com no és una columna real del full,
// no passa per buildFilterField (que busca l'índex de la columna a
// state.headers) — es construeix i s'aplica a part, vegeu render-filters.js.
function buildSeasonFilterField() {
  const options = ['Alta', 'Mitja', 'Baixa'];
  const field = buildDropdownField(-1, state.filterTemporada.join(', '), options, true, 'tableFilter', 'Temporada', getSeasonFilterColor);
  field.classList.add('table-filter');
  const hiddenInput = field.querySelector('input[type="hidden"]');
  field.addEventListener('change', function () {
    state.filterTemporada = hiddenInput.value ? hiddenInput.value.split(',').map(function (v) { return v.trim(); }).filter(Boolean) : [];
    renderCurrentView();
  });
  return field;
}

// Temporades (nom curt: Alta/Mitja/Baixa) que cobreix una fila, per
// filtrar-la i per ordenar-la (vegeu render.js).
function getSeasonShortLabelsForRow(diaRaw, mesRaw) {
  return getSeasonsForRuleValues(diaRaw, mesRaw).map(function (s) { return SEASON_META[s].shortLabel; });
}

// sortColIndex especial (fora del rang real de columnes) per marcar que
// s'ordena per la columna virtual "Temporada" (vegeu render.js).
const SEASON_SORT_COL = -2;

// Rang per ordenar per Temporada: la més "alta" de les que cobreix la
// regla (si en combina diverses, la que xoca primer amb l'ull en ordenar
// ascendent és la de temporada més alta).
function getSeasonSortRank(diaRaw, mesRaw) {
  const seasons = getSeasonsForRuleValues(diaRaw, mesRaw);
  if (!seasons.length) return 3;
  return { alta: 0, mitja: 1, baixa: 2 }[seasons[0]];
}

function buildSeasonLegend() {
  const legend = document.createElement('div');
  legend.className = 'calendar-legend calendar-season-legend';
  ['alta', 'mitja', 'baixa'].forEach(function (key) {
    const item = document.createElement('span');
    item.className = 'calendar-legend-item';
    const dot = document.createElement('span');
    dot.className = 'calendar-day-dot calendar-season-dot ' + SEASON_META[key].className;
    item.appendChild(dot);
    item.appendChild(document.createTextNode(SEASON_META[key].label));
    legend.appendChild(item);
  });
  return legend;
}
