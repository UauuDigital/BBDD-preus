// Targeta clicable per a camps booleans (pas "Opcions"): mateixa
// semàntica que un checkbox (es desa "TRUE"/"FALSE") però es clica la
// targeta sencera en lloc de marcar una caseta petita.
// Vinyeta d'ajuda reutilitzable en passar el ratolí (o amb focus de
// teclat) per sobre de qualsevol element del modal — targetes del pas
// "Opcions", camps del pas "Llindà"/"Desplegable"... No pot ser el
// [data-tooltip]::before habitual (CSS pur, vegeu layout.css): aquests
// elements viuen dins .modal-fields, que té overflow-y:auto i
// max-height:60vh, així que una vinyeta posicionada de forma absoluta
// quedaria tallada a prop del final del pas. Tampoc n'hi ha prou amb
// position:fixed a seques: el <dialog> obert (showModal) es renderitza
// en el "top layer" del navegador, per sobre de tot document.body per
// molt z-index que hi posem, així que cal afegir-la dins del propi
// <dialog> perquè hereti aquest mateix "top layer".
// Vinyeta oberta actualment (com a molt una a la vegada, com ja fan
// els desplegables — vegeu document.addEventListener('click', ...) a
// multiselect.js): en canviar el focus molt de pressa entre camps
// (p.ex. clic seguit de teclejar tot d'una), "mouseleave"/"focusout"
// del camp anterior no sempre arriba abans que "mouseenter"/"focusin"
// del següent, i sense tancar-la explícitament es podien acumular
// varies vinyetes obertes alhora.
let openTooltipHide = null;

function wireHoverTooltip(el, text) {
  let tooltipEl = null;

  function show() {
    if (openTooltipHide) openTooltipHide();
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'hover-tooltip';
    tooltipEl.textContent = text;
    tooltipEl.style.visibility = 'hidden';
    (el.closest('dialog') || document.body).appendChild(tooltipEl);

    const rect = el.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openBelow = spaceBelow >= tooltipRect.height || spaceBelow >= rect.top - 8;

    const left = Math.min(
      Math.max(8, rect.left + rect.width / 2 - tooltipRect.width / 2),
      window.innerWidth - tooltipRect.width - 8
    );
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = (openBelow ? rect.bottom + 8 : rect.top - tooltipRect.height - 8) + 'px';
    tooltipEl.style.visibility = 'visible';
    openTooltipHide = hide;
  }

  function hide() {
    if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
    if (openTooltipHide === hide) openTooltipHide = null;
  }

  el.addEventListener('mouseenter', show);
  el.addEventListener('mouseleave', hide);
  // "focusin"/"focusout" (no "focus"/"blur", que no fan bombolla): en
  // una targeta, qui rep el focus és el <input> de dins, no l'element
  // en si. Només amb :focus-visible (focus real de teclat):
  // renderModalStep() posa el focus automàticament al primer input del
  // pas en obrir-lo (focus programàtic, no de teclat), i sense aquesta
  // comprovació la vinyeta del primer camp quedaria oberta permanentment.
  el.addEventListener('focusin', function (event) {
    if (event.target.matches(':focus-visible')) show();
  });
  el.addEventListener('focusout', hide);
}

function buildCardToggleField(colIndex, label, initialValue) {
  const card = document.createElement('label');
  card.className = 'option-card';
  // Mateix diccionari d'explicacions que la resta de camps (vegeu
  // FIELD_HELP_TEXT a modal-fields.js); aquí, com que la targeta no té
  // espai per a una icona ⓘ separada, la vinyeta surt en passar el
  // ratolí per qualsevol punt de la targeta sencera.
  const helpText = FIELD_HELP_TEXT[label];
  if (helpText) wireHoverTooltip(card, helpText);

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
