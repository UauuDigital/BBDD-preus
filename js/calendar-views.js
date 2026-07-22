// Els tres nivells de vista del calendari (anys → mesos → mes concret)
// i el dispatcher renderCalendar() que decideix quin toca mostrar.
function renderCalendarYears() {
  const container = document.getElementById('calendarView');
  container.innerHTML = '';

  const title = document.createElement('h2');
  title.className = 'calendar-title calendar-picker-title';
  title.textContent = 'Tria un any';
  container.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'calendar-picker-grid calendar-picker-grid-years';

  const cols = getCalendarColIndexes();
  const rows = getCalendarRows();
  const currentYear = new Date().getFullYear();
  [currentYear - 1, currentYear, currentYear + 1].forEach(function (year) {
    const masiaNames = getMasiaNamesForYear(rows, cols, year);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'calendar-picker-card' + (year === currentYear ? ' is-current' : '') + (masiaNames.length ? '' : ' is-empty');

    const value = document.createElement('span');
    value.className = 'calendar-picker-card-value';
    value.textContent = String(year);
    card.appendChild(value);
    card.appendChild(masiaNames.length
      ? buildPickerCardDots(masiaNames)
      : Object.assign(document.createElement('span'), { className: 'calendar-picker-card-meta', textContent: 'sense dades' }));

    card.addEventListener('click', function () {
      state.calendarYear = year;
      state.calendarLevel = 'months';
      renderCalendar();
    });
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderCalendarMonths() {
  const container = document.getElementById('calendarView');
  container.innerHTML = '';

  const year = state.calendarYear;
  container.appendChild(buildCalendarBackLink('Anys', function () {
    state.calendarLevel = 'years';
    renderCalendar();
  }));

  const title = document.createElement('h2');
  title.className = 'calendar-title calendar-picker-title';
  title.textContent = String(year);
  container.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'calendar-picker-grid calendar-picker-grid-months';

  const cols = getCalendarColIndexes();
  const rows = getCalendarRows();
  const today = new Date();
  MONTH_NAMES_CA.forEach(function (name, monthIndex) {
    const masiaNames = getMasiaNamesForYearMonth(rows, cols, year, monthIndex);
    const isCurrent = year === today.getFullYear() && monthIndex === today.getMonth();
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'calendar-picker-card' + (isCurrent ? ' is-current' : '') + (masiaNames.length ? '' : ' is-empty');

    const value = document.createElement('span');
    value.className = 'calendar-picker-card-value';
    value.textContent = name;
    card.appendChild(value);
    card.appendChild(masiaNames.length
      ? buildPickerCardDots(masiaNames)
      : Object.assign(document.createElement('span'), { className: 'calendar-picker-card-meta', textContent: 'sense dades' }));

    card.addEventListener('click', function () {
      state.calendarRefDate = new Date(year, monthIndex, 1);
      state.calendarLevel = 'month';
      renderCalendar();
    });
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderCalendarMonthGrid() {
  const container = document.getElementById('calendarView');
  container.innerHTML = '';

  const cols = getCalendarColIndexes();
  if (cols.dia === -1 || cols.mes === -1 || cols.any === -1) {
    const msg = document.createElement('p');
    msg.className = 'calendar-empty-msg';
    msg.textContent = 'Aquest full no té les columnes "Dia", "Mes" i "Any" necessàries per calcular el calendari.';
    container.appendChild(msg);
    return;
  }

  const refDate = state.calendarRefDate;
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  state.calendarYear = year;

  container.appendChild(buildCalendarBackLink(String(year), function () {
    state.calendarLevel = 'months';
    renderCalendar();
  }));
  container.appendChild(buildCalendarHeader(year, month));

  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  WEEKDAY_HEADER_NAMES_CA.forEach(function (name) {
    const weekdayCell = document.createElement('div');
    weekdayCell.className = 'calendar-weekday';
    weekdayCell.textContent = name;
    grid.appendChild(weekdayCell);
  });

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // setmana comença en dilluns
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows = getCalendarRows();
  const today = new Date();

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day calendar-day-empty';
    grid.appendChild(empty);
  }

  const monthMasiaNames = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const matches = rows.filter(function (row) { return ruleAppliesToDate(row, cols, cellDate); });
    matches.forEach(function (row) {
      const raw = cols.masia !== -1 ? String(row[cols.masia] || '') : '';
      raw.split(',').forEach(function (part) {
        const name = part.trim();
        if (name && monthMasiaNames.indexOf(name) === -1) monthMasiaNames.push(name);
      });
    });
    const isToday = cellDate.getFullYear() === today.getFullYear()
      && cellDate.getMonth() === today.getMonth()
      && cellDate.getDate() === today.getDate();
    grid.appendChild(buildCalendarDayCell(cellDate, matches, cols, isToday));
  }

  container.appendChild(grid);

  const legend = buildCalendarLegend(monthMasiaNames);
  if (legend) container.appendChild(legend);

  if (!rows.length) {
    const msg = document.createElement('p');
    msg.className = 'calendar-empty-msg';
    msg.textContent = 'Cap fila coincideix amb els filtres seleccionats.';
    container.appendChild(msg);
  }
}

function renderCalendar() {
  if (state.calendarLevel === 'months') {
    renderCalendarMonths();
  } else if (state.calendarLevel === 'month') {
    renderCalendarMonthGrid();
  } else {
    renderCalendarYears();
  }
}
