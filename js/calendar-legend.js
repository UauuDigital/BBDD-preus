// Llegenda de masies del mes visible, i el càlcul de quines masies
// tenen dades per a un any/mes concret (per pintar els punts a les
// targetes del selector any → mes).
function buildCalendarLegend(masiaNames) {
  if (masiaNames.length < 2) return null;
  const legend = document.createElement('div');
  legend.className = 'calendar-legend';
  sortMasiaNames(masiaNames).forEach(function (masiaName) {
    const item = document.createElement('span');
    item.className = 'calendar-legend-item';
    const dot = document.createElement('span');
    dot.className = 'calendar-day-dot';
    dot.style.background = getMasiaColor(masiaName);
    item.appendChild(dot);
    item.appendChild(document.createTextNode(masiaName));
    legend.appendChild(item);
  });
  return legend;
}

// Noms de masia (individuals, ja separats per comes) amb alguna fila
// que cobreixi aquest any — es fan servir per pintar-ne els punts a la
// targeta en lloc d'un recompte de files. "rows" ja filtrades es passa
// des de fora perquè renderCalendarYears/Months no torni a recórrer
// tot state.rows a cada targeta (3, o 12 cops per als mesos).
function getMasiaNamesForYear(rows, cols, year) {
  if (cols.any === -1) return [];
  const names = [];
  rows.forEach(function (row) {
    if (String(row[cols.any] || '').trim() !== String(year)) return;
    const raw = cols.masia !== -1 ? String(row[cols.masia] || '') : '';
    raw.split(',').forEach(function (part) {
      const name = part.trim();
      if (name && names.indexOf(name) === -1) names.push(name);
    });
  });
  return names;
}

function getMasiaNamesForYearMonth(rows, cols, year, monthIndex) {
  if (cols.any === -1) return [];
  const monthName = normalizeText(MONTH_NAMES_CA[monthIndex]);
  const names = [];
  rows.forEach(function (row) {
    if (String(row[cols.any] || '').trim() !== String(year)) return;
    const mesRaw = String(row[cols.mes] || '').trim();
    if (mesRaw && mesRaw.split(',').map(function (part) { return normalizeText(part).trim(); }).indexOf(monthName) === -1) return;
    const raw = cols.masia !== -1 ? String(row[cols.masia] || '') : '';
    raw.split(',').forEach(function (part) {
      const name = part.trim();
      if (name && names.indexOf(name) === -1) names.push(name);
    });
  });
  return names;
}

function buildPickerCardDots(masiaNames) {
  const dots = document.createElement('span');
  dots.className = 'calendar-picker-card-dots';
  sortMasiaNames(masiaNames).forEach(function (name) {
    const dot = document.createElement('span');
    dot.className = 'calendar-day-dot';
    dot.style.background = getMasiaColor(name);
    dots.appendChild(dot);
  });
  return dots;
}
