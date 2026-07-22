// Filtres de Dia/Mes/Masia/Any: neteja, construcció de cada desplegable
// i els dos jocs independents (taula i calendari) que en reutilitzen la
// mateixa lògica. La casella "Simplifica" i el càlcul de columnes
// visibles de la taula també viuen aquí.
function clearAllFilters() {
  state.filterDia = [];
  state.filterMes = [];
  state.filterMasia = [];
  state.filterAny = [];
  renderCurrentView();
}

function hasAnyFilterSelected() {
  return Boolean(state.filterDia.length || state.filterMes.length || state.filterMasia.length || state.filterAny.length);
}

// Colors d'opció per filtre, quan n'hi ha (vegeu getMasiaColor a
// calendar-colors.js i getYearRelativeColor a yearfield.js).
const FILTER_OPTION_COLORS = { 'Masia': getMasiaColor, 'Any': getYearRelativeColor };

function buildFilterField(def) {
  const colIndex = state.headers.indexOf(def.header);
  if (colIndex === -1) return null;

  const field = buildDropdownField(
    colIndex, def.selected.join(', '), getDistinctColumnValues(colIndex, true), true, 'tableFilter', def.header,
    FILTER_OPTION_COLORS[def.header]
  );
  field.classList.add('table-filter');
  const hiddenInput = field.querySelector('input[type="hidden"]');
  field.addEventListener('change', function () {
    def.apply(hiddenInput.value ? hiddenInput.value.split(',').map(function (v) { return v.trim(); }).filter(Boolean) : []);
    renderCurrentView();
  });
  return field;
}

function buildClearFiltersButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-ghost';
  btn.textContent = 'Neteja filtres';
  btn.addEventListener('click', clearAllFilters);
  return btn;
}

// Dos jocs de filtres independents, cadascun amb el seu contenidor:
// la taula (Dia, Mes, Masia, Any — les columnes que existeixin al full
// actual) i el calendari (només Masia, ja que Dia/Mes/Any ja els tria
// la pròpia navegació any → mes → dia). Comparteixen l'estat
// (state.filterDia, etc.): un filtre aplicat des d'un dia del calendari
// (vegeu goToTableFilteredByDate) es veu reflectit en canviar a la taula.
function renderFilters() {
  const isCalendar = state.view === 'calendar' && state.currentName === CALENDAR_SHEET_NAME;
  const showTableFilters = !isCalendar && (state.currentName === SERVICES_SHEET_NAME || state.currentName === CALENDAR_SHEET_NAME);
  const showCalendarFilters = isCalendar;

  const tableContainer = document.getElementById('tableFilters');
  tableContainer.innerHTML = '';
  tableContainer.hidden = !showTableFilters;
  if (showTableFilters) {
    [
      { header: 'Dia', selected: state.filterDia, apply: function (values) { state.filterDia = values; } },
      { header: 'Mes', selected: state.filterMes, apply: function (values) { state.filterMes = values; } },
      { header: 'Masia', selected: state.filterMasia, apply: function (values) { state.filterMasia = values; } },
      { header: 'Any', selected: state.filterAny, apply: function (values) { state.filterAny = values; } },
    ].forEach(function (def) {
      const field = buildFilterField(def);
      if (field) tableContainer.appendChild(field);
    });
    if (hasAnyFilterSelected()) tableContainer.appendChild(buildClearFiltersButton());
  }

  const calendarContainer = document.getElementById('calendarFilters');
  calendarContainer.innerHTML = '';
  calendarContainer.hidden = !showCalendarFilters;
  if (showCalendarFilters) {
    const masiaField = buildFilterField(
      { header: 'Masia', selected: state.filterMasia, apply: function (values) { state.filterMasia = values; } }
    );
    if (masiaField) calendarContainer.appendChild(masiaField);
    if (state.filterMasia.length) calendarContainer.appendChild(buildClearFiltersButton());
  }
}

// Casella "Simplifica": només a la taula de "Preus per dia". Quan està
// activada (per defecte), la taula només mostra SIMPLIFY_TABLE_COLUMNS;
// desactivada, totes les columnes.
function renderSimplifyToggle() {
  const wrap = document.getElementById('simplifyToggle');
  wrap.hidden = !(state.currentName === CALENDAR_SHEET_NAME && state.view === 'table');
}

function getVisibleColIndexes() {
  const simplifying = state.currentName === CALENDAR_SHEET_NAME && state.view === 'table' && state.simplifyTable;
  return state.headers
    .map(function (label, colIndex) { return { label: label, colIndex: colIndex }; })
    .filter(function (item) { return !simplifying || SIMPLIFY_TABLE_COLUMNS.indexOf(item.label) !== -1; })
    .map(function (item) { return item.colIndex; });
}
