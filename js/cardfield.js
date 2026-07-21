// Targeta clicable per a camps booleans (pas "Opcions"): mateixa
// semàntica que un checkbox (es desa "TRUE"/"FALSE") però es clica la
// targeta sencera en lloc de marcar una caseta petita.
function buildCardToggleField(colIndex, label, initialValue) {
  const card = document.createElement('label');
  card.className = 'option-card';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'option-card-input';
  input.id = 'addRowField' + colIndex;
  input.dataset.colIndex = String(colIndex);
  input.checked = initialValue === 'TRUE';

  const text = document.createElement('span');
  text.className = 'option-card-text';
  text.textContent = label;

  const check = document.createElement('span');
  check.className = 'option-card-check';
  check.innerHTML = ICONS.check;

  card.classList.toggle('is-selected', input.checked);
  input.addEventListener('change', function () {
    card.classList.toggle('is-selected', input.checked);
  });

  card.appendChild(input);
  card.appendChild(text);
  card.appendChild(check);
  return card;
}
