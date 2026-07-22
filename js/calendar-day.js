// Construcció d'una cel·la de dia del calendari i el clic que porta a
// la taula filtrada per aquell dia.
function buildCalendarDayCell(cellDate, matches, cols, isToday) {
  // Dies sense preu són un <div> merament informatiu; dies amb preu són
  // un <button> real: cal poder-los activar per teclat/tàctil per veure
  // el detall complet quan queda tallat per l'el·lipsi (vegeu més avall
  // .is-expanded), no només amb el hover del "title".
  const cell = document.createElement(matches.length ? 'button' : 'div');
  if (matches.length) cell.type = 'button';
  cell.className = 'calendar-day' + (matches.length ? ' has-price' : '') + (isToday ? ' is-today' : '');

  const dayNumber = document.createElement('span');
  dayNumber.className = 'calendar-day-number';
  dayNumber.textContent = String(cellDate.getDate());
  cell.appendChild(dayNumber);

  if (!matches.length) return cell;

  // Una mateixa fila pot cobrir diverses masies alhora (cel·la separada
  // per comes): es mostra una línia (punt de color + tota la info) per
  // masia, no per fila. Si hi ha un filtre de Masia actiu, només es
  // mostren (i compten com a "coincidència") les masies seleccionades,
  // encara que la fila també en cobreixi d'altres.
  const entriesByMasia = [];
  const seenMasia = {};
  matches.forEach(function (row) {
    const raw = cols.masia !== -1 ? String(row[cols.masia] || '') : '';
    (raw ? raw.split(',') : ['']).forEach(function (part) {
      const name = part.trim();
      if (seenMasia[name]) return;
      if (state.filterMasia.length && name && state.filterMasia.indexOf(name) === -1) return;
      seenMasia[name] = true;
      entriesByMasia.push({ name: name, row: row });
    });
  });
  entriesByMasia.sort(function (a, b) { return getMasiaSortRank(a.name) - getMasiaSortRank(b.name); });

  const priceList = document.createElement('div');
  priceList.className = 'calendar-day-prices';
  entriesByMasia.forEach(function (entry) {
    const line = document.createElement('div');
    line.className = 'calendar-day-price-line';

    const dot = document.createElement('span');
    dot.className = 'calendar-day-dot';
    dot.style.background = getMasiaColor(entry.name);
    line.appendChild(dot);

    const details = document.createElement('span');
    details.className = 'calendar-day-price-details';

    if (cols.preuP !== -1 && entry.row[cols.preuP]) {
      const priceEl = document.createElement('span');
      priceEl.className = 'calendar-day-price';
      priceEl.textContent = formatPriceNoDecimals(entry.row[cols.preuP]);
      details.appendChild(priceEl);
    }

    const metaParts = [];
    if (cols.min !== -1 && entry.row[cols.min]) metaParts.push('m ' + entry.row[cols.min]);
    if (cols.preuComp !== -1 && entry.row[cols.preuComp]) metaParts.push('c ' + formatPriceNoDecimals(entry.row[cols.preuComp]));
    if (metaParts.length) {
      const metaEl = document.createElement('span');
      metaEl.className = 'calendar-day-price-meta';
      metaEl.textContent = ' · ' + metaParts.join(' · ');
      details.appendChild(metaEl);
    }

    line.appendChild(details);
    priceList.appendChild(line);
  });
  cell.appendChild(priceList);

  const fullDetail = entriesByMasia.map(function (entry) {
    const parts = [];
    if (entry.name) parts.push(entry.name);
    if (cols.preuP !== -1 && entry.row[cols.preuP]) parts.push(formatPriceNoDecimals(entry.row[cols.preuP]) + '/persona');
    if (cols.min !== -1 && entry.row[cols.min]) parts.push('mín. ' + entry.row[cols.min]);
    if (cols.preuComp !== -1 && entry.row[cols.preuComp]) parts.push('preu compensat: ' + formatPriceNoDecimals(entry.row[cols.preuComp]));
    return parts.join(' — ');
  }).join('. ');

  // Sense "title": la informació ja es veu directament a la cel·la, un
  // tooltip redundant en passar el ratolí només molestava. L'aria-label
  // manté el detall complet (mai truncat) accessible a lectors de
  // pantalla independentment del clic.
  const dayLabel = 'Dia ' + cellDate.getDate() + ': ' + fullDetail + '. Clica per veure aquestes files a la taula.';
  cell.setAttribute('aria-label', dayLabel);
  cell.addEventListener('click', function () { goToTableFilteredByDate(cellDate, matches, cols); });

  return cell;
}

// En clicar un dia del calendari, es passa a la vista de taula amb els
// filtres de Dia/Mes/Masia/Any ajustats a aquell dia concret (Dia/Mes
// només si hi ha, entre les opcions reals del full, un valor que hi
// correspongui — si la regla s'aplica "a tots els dies/mesos", es
// deixa sense filtrar per no amagar-la).
function goToTableFilteredByDate(cellDate, matches, cols) {
  const weekdayTarget = String(cellDate.getDay());
  const monthTarget = normalizeText(MONTH_NAMES_CA[cellDate.getMonth()]);

  const diaOption = findMatchingLiteralOption(cols.dia, true, normalizeDiaForFilter, weekdayTarget);
  const mesOption = findMatchingLiteralOption(cols.mes, true, normalizeText, monthTarget);

  const masiaNames = [];
  matches.forEach(function (row) {
    const raw = cols.masia !== -1 ? String(row[cols.masia] || '') : '';
    raw.split(',').forEach(function (part) {
      const name = part.trim();
      if (name && masiaNames.indexOf(name) === -1) masiaNames.push(name);
    });
  });

  state.filterDia = diaOption ? [diaOption] : [];
  state.filterMes = mesOption ? [mesOption] : [];
  state.filterMasia = masiaNames;
  state.filterAny = [String(cellDate.getFullYear())];
  state.view = 'table';

  renderViewToggle();
  renderCurrentView();
}
