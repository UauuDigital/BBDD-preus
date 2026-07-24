// Pestanyes de full, commutador Taula/Calendari, i el dispatcher que
// decideix quina vista (taula o calendari) i quin joc de filtres toca
// mostrar.
function renderTabs() {
  const nav = document.getElementById('tabs');
  nav.innerHTML = '';
  state.sheets.forEach(function (sheet) {
    const info = SHEET_INFO[sheet.name];
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (sheet.name === state.currentName ? ' active' : '');
    btn.type = 'button';
    btn.textContent = info ? info.label : sheet.name;
    if (info && info.hint) btn.dataset.tooltip = info.hint;
    btn.setAttribute('aria-selected', sheet.name === state.currentName ? 'true' : 'false');
    btn.addEventListener('click', function () {
      if (sheet.name === state.currentName) return;
      state.currentName = sheet.name;
      state.filterMasia = [];
      state.filterAny = [];
      state.filterDia = [];
      state.filterMes = [];
      state.sortColIndex = -1;
      state.sortDirection = 'asc';
      state.view = 'table';
      renderTabs();
      const cached = state.sheetCache[sheet.name];
      if (cached) {
        // Ja la tenim: es mostra a l'instant i es refresca en segon pla
        // per si el full de càlcul ha canviat mentrestant.
        applySheetData(cached);
        renderCurrentView();
        setStatus(state.rows.length + ' files carregades.', 'success');
        loadCurrentSheet(true);
      } else {
        renderSkeleton(state.headers.length || 3, 5);
        loadCurrentSheet();
      }
    });
    nav.appendChild(btn);
  });

  const hintEl = document.getElementById('sheetHint');
  const currentInfo = SHEET_INFO[state.currentName];
  hintEl.textContent = currentInfo ? currentInfo.hint : '';

  renderViewToggle();
}

// Commutador Taula/Calendari: només als fulls de CALENDAR_VIEW_SHEETS
// ("Preus menu" i "Còctel"). No depèn de les dades (a diferència dels
// filtres), es pot construir tan bon punt se sap quin full s'ha
// seleccionat.
function renderViewToggle() {
  const container = document.getElementById('viewToggle');
  container.innerHTML = '';
  container.hidden = !isCalendarViewSheet(state.currentName);
  if (container.hidden) return;

  [
    { view: 'table', label: 'Taula' },
    { view: 'calendar', label: 'Calendari' },
  ].forEach(function (opt) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn view-toggle-btn' + (state.view === opt.view ? ' is-active' : '');
    btn.textContent = opt.label;
    btn.addEventListener('click', function () {
      if (state.view === opt.view) return;
      state.view = opt.view;
      if (opt.view === 'calendar') state.calendarLevel = 'years';
      renderViewToggle();
      renderCurrentView();
    });
    container.appendChild(btn);
  });
}

// Mostra la taula o el calendari segons state.view (només rellevant als
// fulls de CALENDAR_VIEW_SHEETS — a la resta sempre és la taula), i el
// joc de filtres corresponent (vegeu renderFilters a render-filters.js).
function renderCurrentView() {
  const isCalendar = state.view === 'calendar' && isCalendarViewSheet(state.currentName);
  document.getElementById('tableWrap').hidden = isCalendar;
  document.getElementById('calendarView').hidden = !isCalendar;
  renderFilters();
  renderSimplifyToggle();
  if (isCalendar) {
    renderCalendar();
  } else {
    renderTable();
  }
}
