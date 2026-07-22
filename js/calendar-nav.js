// Navegació del calendari: enllaç "enrere" (torna al nivell anterior)
// i la capçalera de mes (fletxes anterior/següent + "Avui").
function buildCalendarBackLink(label, onClick) {
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'calendar-back-link';
  back.innerHTML = ICONS.chevron + '<span>' + label + '</span>';
  back.addEventListener('click', onClick);
  return back;
}

function buildCalendarHeader(year, month) {
  const header = document.createElement('div');
  header.className = 'calendar-header';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'icon-btn calendar-nav-btn calendar-nav-prev';
  prevBtn.innerHTML = ICONS.chevron;
  prevBtn.setAttribute('aria-label', 'Mes anterior');
  prevBtn.addEventListener('click', function () {
    state.calendarRefDate = new Date(year, month - 1, 1);
    renderCalendar();
  });

  const title = document.createElement('h2');
  title.className = 'calendar-title';
  title.textContent = MONTH_NAMES_CA[month] + ' ' + year;

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'icon-btn calendar-nav-btn calendar-nav-next';
  nextBtn.innerHTML = ICONS.chevron;
  nextBtn.setAttribute('aria-label', 'Mes següent');
  nextBtn.addEventListener('click', function () {
    state.calendarRefDate = new Date(year, month + 1, 1);
    renderCalendar();
  });

  const todayBtn = document.createElement('button');
  todayBtn.type = 'button';
  todayBtn.className = 'btn btn-ghost calendar-today-btn';
  todayBtn.textContent = 'Avui';
  todayBtn.addEventListener('click', function () {
    state.calendarRefDate = new Date();
    state.calendarLevel = 'month';
    renderCalendar();
  });

  header.appendChild(prevBtn);
  header.appendChild(title);
  header.appendChild(nextBtn);
  header.appendChild(todayBtn);
  return header;
}
