// Secció "Llindà" del pas de desglossament: Principi/Final són numèrics,
// els dos preus són de moneda (reutilitza buildCurrencyField).
const LLINDA_HEADERS = {
  principi: 'Llindà Principi',
  final: 'Llindà Final',
  negatiu: 'Llindà preu X<0',
  positiu: 'Llindà preu 0<X',
};

// Principi/Final es mouen entre 0 i 500 convidats: un lliscador dona
// una lectura més ràpida del rang que dos camps numèrics solts.
const LLINDA_RANGE_MIN = 0;
const LLINDA_RANGE_MAX = 500;

// Un únic control de rang amb dos cursors (Principi/Final), no dos
// lliscadors separats: dos <input type="range"> superposats sobre la
// mateixa pista, amb el "thumb" com a únic punt clicable de cadascun
// (truc habitual per simular un slider de doble cursor sense llibreries).
// "valuesSource": d'on llegeixen el seu valor inicial els 3 camps de
// preu — modalValues (pas de desglossament) o la pròpia fila de la
// taula (state.rows[rowIndex], que també es pot indexar per colIndex).
// "onFieldChange(colIndex, value)": si es passa, cada canvi es desa a
// l'instant (ús a la taula, buildLlindaTableCellControl); si no,
// el component es limita a deixar els valors als [data-col-index]
// perquè els reculli captureStepValues en canviar de pas del modal.
function buildLlindaRangeField(principiColIndex, finalColIndex, principiValue, finalValue, valuesSource, onFieldChange) {
  valuesSource = valuesSource || modalValues;
  const field = document.createElement('fieldset');
  field.className = 'modal-field range-dual-field';

  const wrap = document.createElement('div');
  wrap.className = 'range-dual';
  // Sense llegenda visible (el nom "Llindà" ja hi és, com a capçalera
  // de secció al modal o de columna a la taula): l'explicació es manté
  // com a vinyeta d'ajuda sobre el propi slider.
  wireHoverTooltip(wrap, 'Rang de nombre de convidats (de Principi a Final) al qual s\'aplica aquest tram.');

  const track = document.createElement('div');
  track.className = 'range-dual-track';
  const fill = document.createElement('div');
  fill.className = 'range-dual-fill';
  wrap.appendChild(track);
  wrap.appendChild(fill);

  // El cursor natiu (16px) és massa petit per a un dit (mínim
  // recomanat WCAG 2.5.8: 24px): en tàctil es dibuixa més gran (28px,
  // vegeu @media (pointer: coarse) a modal-breakdown.css), i cal que
  // la fórmula de posicionament (thumbCenter) en tingui coneixement
  // perquè bombolla/farciment quedin igual d'alineats en tots dos casos.
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const THUMB_WIDTH = isCoarsePointer ? 28 : 16;

  function buildThumbInput(colIndex, initialValue, ariaLabel) {
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'range-dual-input';
    input.id = 'addRowField' + colIndex;
    input.dataset.colIndex = String(colIndex);
    input.min = String(LLINDA_RANGE_MIN);
    input.max = String(LLINDA_RANGE_MAX);
    input.step = '1';
    input.value = initialValue || '0';
    input.setAttribute('aria-label', ariaLabel);
    return input;
  }

  const minInput = buildThumbInput(principiColIndex, principiValue || LLINDA_RANGE_MIN, 'Llindà Principi');
  const maxInput = buildThumbInput(finalColIndex, finalValue || LLINDA_RANGE_MAX, 'Llindà Final');
  wrap.appendChild(minInput);
  wrap.appendChild(maxInput);

  function clampRange(value) {
    if (isNaN(value)) return LLINDA_RANGE_MIN;
    return Math.min(LLINDA_RANGE_MAX, Math.max(LLINDA_RANGE_MIN, value));
  }

  // Bombolla amb el valor just a sobre de cada cursor (no un text fix
  // sota el slider), que es desplaça horitzontalment amb el propi
  // cursor. Conté un <input type="number"> editable: escriure-hi mou
  // directament el cursor corresponent, sense necessitat d'un camp
  // separat. El posicionament (left) es fa sobre el <span> contenidor,
  // no sobre l'input: un <input> és un element "replaced" i no admet
  // ::after (la punta de la bombolla), per això cal l'embolcall.
  function buildBubble(pairedInput, ariaLabel) {
    const bubble = document.createElement('span');
    bubble.className = 'range-dual-bubble';

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'range-dual-bubble-input';
    input.min = String(LLINDA_RANGE_MIN);
    input.max = String(LLINDA_RANGE_MAX);
    input.step = '1';
    input.value = pairedInput.value;
    input.setAttribute('aria-label', ariaLabel);
    input.addEventListener('input', function () {
      pairedInput.value = String(clampRange(Number(input.value)));
      refresh(pairedInput);
    });
    if (onFieldChange) input.addEventListener('change', commitBounds);
    bubble.appendChild(input);

    wrap.appendChild(bubble);
    return { wrapper: bubble, input: input };
  }
  const minBubble = buildBubble(minInput, 'Llindà Principi (valor exacte)');
  const maxBubble = buildBubble(maxInput, 'Llindà Final (valor exacte)');

  // Sota el slider, un camp de moneda per a cadascun dels 3 trams que
  // els dos cursors dibuixen a la pista (0→Principi, Principi→Final,
  // Final→500), en aquest ordre: "Llindà preu X<0", "Preu" i "Llindà
  // preu 0<X". "Preu" és el mateix camp que ja existeix al pas
  // "Informació general" (mateix colIndex): editar-lo aquí també
  // actualitza aquell valor, no és una dada a part.
  const zonesRow = document.createElement('div');
  zonesRow.className = 'range-dual-zones';

  // El mínim fix de 32px (CSS) no n'hi ha prou quan el cursor és a un
  // extrem i el número té més d'un parell de dígits (p.ex. "500"): cal
  // que el mínim creixi amb la mida real del contingut, no que quedi
  // fix. "ch" escala amb l'ample del propi tipus de lletra.
  function updateZoneMinWidth(input) {
    const digits = String(input.value).replace('-', '').length;
    input.style.minWidth = Math.max(2, digits + 1) + 'ch';
  }

  // La bombolla, a diferència dels camps de tram, no viu dins d'un
  // contenidor flex que li doni amplada: cal fixar "width" (no només
  // "min-width", que un <input type="number"> ignoraria en favor de la
  // seva amplada per defecte del navegador, molt més grossa que el
  // contingut real).
  function updateBubbleWidth(input) {
    const digits = String(input.value).replace('-', '').length;
    input.style.width = Math.max(1, digits) + 'ch';
  }

  // Mateix patró visual que buildCurrencyField (camp de moneda), però
  // en miniatura: el símbol "€" al costat, no superposat com allà,
  // perquè no queda prou espai dins dels 32px mínims d'aquests inputs.
  function buildZoneInput(header) {
    const wrap = document.createElement('div');
    wrap.className = 'range-dual-zone';

    const colIndex = state.headers.indexOf(header);
    if (colIndex === -1) {
      wrap.hidden = true;
      zonesRow.appendChild(wrap);
      return wrap;
    }

    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.className = 'range-dual-zone-input';
    input.id = 'addRowField' + colIndex;
    input.dataset.colIndex = String(colIndex);
    const parsedValue = parseCurrencyInputValue(valuesSource[colIndex]);
    input.value = parsedValue || '0';
    input.setAttribute('aria-label', header);
    input.addEventListener('input', function () { updateZoneMinWidth(input); });
    if (onFieldChange) input.addEventListener('change', function () { onFieldChange(colIndex, input.value); });
    updateZoneMinWidth(input);
    if (FIELD_HELP_TEXT[header]) wireHoverTooltip(wrap, FIELD_HELP_TEXT[header]);

    const suffix = document.createElement('span');
    suffix.className = 'range-dual-zone-suffix';
    suffix.textContent = '€';
    suffix.setAttribute('aria-hidden', 'true');

    wrap.appendChild(input);
    wrap.appendChild(suffix);
    zonesRow.appendChild(wrap);
    return wrap;
  }
  const zoneStart = buildZoneInput(LLINDA_HEADERS.negatiu);
  const zoneMiddle = buildZoneInput('Preu');
  const zoneEnd = buildZoneInput(LLINDA_HEADERS.positiu);

  // Un <input type="range"> no mou el cursor de forma linealment
  // proporcional a l'amplada total: es desplaça entre 0 i "amplada de
  // la pista − amplada del cursor", deixant mig cursor de marge a cada
  // extrem. Cal la mateixa fórmula perquè la bombolla i el farciment
  // coincideixin exactament amb el centre real del cursor, no només
  // amb un percentatge lineal ingenu.
  function thumbCenter(ratio) {
    return 'calc((100% - ' + THUMB_WIDTH + 'px) * ' + ratio + ' + ' + (THUMB_WIDTH / 2) + 'px)';
  }

  // El farciment i els inputs de tram necessiten un canvi real
  // d'amplada (com .modal { transition: width }, ja documentat: un
  // transform: scale() distorsionaria el text/spinner dels inputs), i
  // les bombolles depenen de la mateixa fórmula basada en percentatges
  // de contenidor (thumbCenter), que només és vàlida amb "left", no amb
  // "transform: translateX" (hi tindria un altre marc de referència).
  // Per no forçar un recàlcul de layout a cada esdeveniment "input"
  // mentre s'arrossega, totes les escriptures d'un mateix moviment
  // s'agrupen en un únic requestAnimationFrame.
  function applyRefresh(movedInput) {
      // El cursor de Principi no pot superar el de Final, ni al revés:
      // clava'l a l'altre cursor en lloc de deixar-los creuar-se.
      if (Number(minInput.value) > Number(maxInput.value)) {
        if (movedInput === maxInput) minInput.value = maxInput.value;
        else maxInput.value = minInput.value;
      }
      const range = LLINDA_RANGE_MAX - LLINDA_RANGE_MIN;
      const minRatio = (Number(minInput.value) - LLINDA_RANGE_MIN) / range;
      const maxRatio = (Number(maxInput.value) - LLINDA_RANGE_MIN) / range;
      const minCenter = thumbCenter(minRatio);
      const maxCenter = thumbCenter(maxRatio);

      fill.style.left = minCenter;
      fill.style.width = 'calc((100% - ' + THUMB_WIDTH + 'px) * ' + (maxRatio - minRatio) + ')';
      // "left" (no transform: translateX) a consciència: dins de
      // transform, un percentatge es resol respecte a la pròpia caixa
      // de la bombolla, no respecte al contenidor — la fórmula de
      // thumbCenter() perdria tot sentit si s'hi apliqués.
      minBubble.wrapper.style.left = minCenter;
      minBubble.input.value = minInput.value;
      updateBubbleWidth(minBubble.input);
      maxBubble.wrapper.style.left = maxCenter;
      maxBubble.input.value = maxInput.value;
      updateBubbleWidth(maxBubble.input);

      // Repartiment amb flexbox (flex-grow proporcional a l'amplada de
      // cada tram, min-width fixat a CSS): a diferència de left/width
      // amb percentatges, mai deixa que un tram molt estret surti per
      // fora del contenidor en aplicar-hi el mínim (li cedeix l'espai
      // que li falta als altres dos, en lloc de sobreeiximplar).
      zoneStart.style.flexGrow = String(minRatio);
      zoneMiddle.style.flexGrow = String(maxRatio - minRatio);
      zoneEnd.style.flexGrow = String(1 - maxRatio);
  }

  // Només les crides per arrossegament (moltes per segon) s'ajornen a
  // requestAnimationFrame; la pintura inicial és síncrona perquè no hi
  // hagi un frame sense estils en obrir el pas.
  let refreshScheduled = false;
  function refresh(movedInput) {
    if (refreshScheduled) return;
    refreshScheduled = true;
    requestAnimationFrame(function () {
      refreshScheduled = false;
      applyRefresh(movedInput);
    });
  }

  // Desa Principi i Final junts (no només el cursor que s'ha mogut):
  // si arrossegar-ne un ha clavat l'altre per evitar que es creuin
  // (applyRefresh), aquell canvi silenciós també ha d'acabar desat.
  function commitBounds() {
    if (!onFieldChange) return;
    onFieldChange(principiColIndex, minInput.value);
    onFieldChange(finalColIndex, maxInput.value);
  }

  minInput.addEventListener('input', function () { refresh(minInput); });
  maxInput.addEventListener('input', function () { refresh(maxInput); });
  if (onFieldChange) {
    minInput.addEventListener('change', commitBounds);
    maxInput.addEventListener('change', commitBounds);
  }
  applyRefresh(minInput);

  field.appendChild(wrap);
  field.appendChild(zonesRow);

  // Els 3 preus són obligatoris (Principi/Final no cal comprovar-los:
  // un <input type="range"> sempre té un valor, mai queden buits). Un
  // sol missatge combinat, no un per input: no hi ha espai per a un
  // paràgraf d'error sota cada input de 32px. Es crida després
  // d'afegir wrap/zonesRow perquè el missatge quedi sota el slider,
  // no per sobre.
  wireRequiredField(field, function () {
    return [zoneStart, zoneMiddle, zoneEnd].every(function (zone) {
      const zoneInput = zone.querySelector('input');
      return zone.hidden || (zoneInput && zoneInput.value.trim() !== '');
    }) ? '1' : '';
  }, 'Omple els tres preus del Llindà.',
  // Si "Llindà preu X<0" no existeix en aquest full, cau al primer
  // input real que sí hi hagi (mai queden els 3 amagats alhora, ja que
  // "Preu" sempre hi és).
  zoneStart.querySelector('input') || zoneMiddle.querySelector('input') || zoneEnd.querySelector('input'));

  return field;
}

function buildLlindaSection() {
  const container = document.createElement('div');
  container.className = 'breakdown-section';

  const heading = document.createElement('h3');
  heading.className = 'section-heading';
  heading.textContent = 'Llindà';
  container.appendChild(heading);

  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'modal-fields modal-fields-nested';

  const principiColIndex = state.headers.indexOf(LLINDA_HEADERS.principi);
  const finalColIndex = state.headers.indexOf(LLINDA_HEADERS.final);
  if (principiColIndex !== -1 && finalColIndex !== -1) {
    fieldsGrid.appendChild(buildLlindaRangeField(
      principiColIndex, finalColIndex, modalValues[principiColIndex], modalValues[finalColIndex], modalValues
    ));
  }

  container.appendChild(fieldsGrid);
  return container;
}

// Posició (dins de "visibleColIndexes") on comencen les 4 columnes del
// Llindà a la taula principal, si hi són TOTES 4 i són consecutives en
// aquest ordre exacte (Principi, Final, preu X<0, preu 0<X); null si en
// falta alguna o no van seguides — en aquest cas cada columna es pinta
// per separat, com sempre (mai se n'amaga cap sense fusionar-la).
function getLlindaMergeStart(visibleColIndexes) {
  const headers = [LLINDA_HEADERS.principi, LLINDA_HEADERS.final, LLINDA_HEADERS.negatiu, LLINDA_HEADERS.positiu];
  const positions = headers.map(function (header) {
    return visibleColIndexes.indexOf(state.headers.indexOf(header));
  });
  if (positions.indexOf(-1) !== -1) return null;
  const start = positions[0];
  const isConsecutive = positions.every(function (pos, i) { return pos === start + i; });
  return isConsecutive ? start : null;
}

// Mateix gràfic que el pas "Llindà" del formulari de nova fila, però
// per a una fila ja existent de la taula: llegeix/desa directament
// contra state.rows[rowIndex] (indexable per colIndex igual que
// modalValues) en lloc de contra el formulari de nova fila. Substitueix
// les 4 columnes soltes (Principi/Final/els 2 preus) per una de sola.
function buildLlindaTableCellControl(rowIndex) {
  const principiColIndex = state.headers.indexOf(LLINDA_HEADERS.principi);
  const finalColIndex = state.headers.indexOf(LLINDA_HEADERS.final);
  if (principiColIndex === -1 || finalColIndex === -1) return null;

  // Encara que la columna hi sigui, només es dibuixa el gràfic si
  // aquesta fila té "llinda" marcat a "ExtresLlista" (mateix criteri
  // que decideix si el pas "Llindà" surt al formulari de nova fila,
  // vegeu getSelectedExtresLlistaLive a modal-state.js, aplicat aquí
  // contra la fila ja desada en lloc de modalValues). La cel·la queda
  // buida en cas contrari, no s'hi amaga la columna sencera.
  const extresLlistaColIndex = state.headers.indexOf('ExtresLlista');
  if (extresLlistaColIndex === -1) return null;
  const selected = String(state.rows[rowIndex][extresLlistaColIndex] || '').split(',').map(function (part) { return part.trim(); });
  if (selected.indexOf('llinda') === -1) return null;

  // Col·lapsat per defecte (state.expandedLlindaRows, state.js): el
  // gràfic és molt més alt que una cel·la normal, així que a cada fila
  // només s'hi construeix quan l'usuari l'obre explícitament, no de
  // seguida. L'estat d'obert/tancat es manté entre renderTable()
  // (p.ex. en desar un altre canvi), igual que selectedRows.
  const disclosure = document.createElement('div');
  disclosure.className = 'llinda-disclosure';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'llinda-disclosure-toggle';
  const chevron = document.createElement('span');
  chevron.className = 'llinda-disclosure-chevron';
  chevron.innerHTML = ICONS.chevron;
  chevron.setAttribute('aria-hidden', 'true');
  const toggleLabel = document.createElement('span');
  toggleBtn.appendChild(chevron);
  toggleBtn.appendChild(toggleLabel);
  disclosure.appendChild(toggleBtn);

  const body = document.createElement('div');
  body.className = 'llinda-disclosure-body';
  disclosure.appendChild(body);

  function setExpanded(expanded) {
    toggleBtn.setAttribute('aria-expanded', String(expanded));
    chevron.classList.toggle('is-open', expanded);
    toggleLabel.textContent = expanded ? 'Amaga el Llindà' : 'Mostra el Llindà';
    body.hidden = !expanded;
    // Es construeix el gràfic real només la primera vegada que s'obre
    // (no de seguida, ni cada vegada que es tanca i es torna a obrir):
    // és l'únic camp de la cel·la, així que no cal reconstruir-lo.
    if (expanded && !body.firstChild) {
      const row = state.rows[rowIndex];
      body.appendChild(buildLlindaRangeField(
        principiColIndex, finalColIndex, row[principiColIndex], row[finalColIndex], row,
        function (colIndex, value) { saveTableCell(rowIndex, colIndex, value); }
      ));
    }
  }
  toggleBtn.addEventListener('click', function () {
    const expanded = !state.expandedLlindaRows.has(rowIndex);
    if (expanded) state.expandedLlindaRows.add(rowIndex); else state.expandedLlindaRows.delete(rowIndex);
    setExpanded(expanded);
  });
  setExpanded(state.expandedLlindaRows.has(rowIndex));

  return disclosure;
}
