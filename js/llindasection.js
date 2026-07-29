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
function buildLlindaRangeField(principiColIndex, finalColIndex, principiValue, finalValue) {
  const field = document.createElement('fieldset');
  field.className = 'modal-field range-dual-field';

  const legend = document.createElement('legend');
  legend.textContent = 'Llindà (Principi – Final)';
  wireHoverTooltip(legend, 'Rang de nombre de convidats (de Principi a Final) al qual s\'aplica aquest tram.');
  field.appendChild(legend);

  const wrap = document.createElement('div');
  wrap.className = 'range-dual';

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

  // Bombolla amb el valor just a sobre de cada cursor (no un text fix
  // sota el slider), que es desplaça horitzontalment amb el propi cursor.
  function buildBubble() {
    const bubble = document.createElement('span');
    bubble.className = 'range-dual-bubble';
    wrap.appendChild(bubble);
    return bubble;
  }
  const minBubble = buildBubble();
  const maxBubble = buildBubble();

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
    const parsedValue = parseCurrencyInputValue(modalValues[colIndex]);
    input.value = parsedValue || '0';
    input.setAttribute('aria-label', header);
    input.addEventListener('input', function () { updateZoneMinWidth(input); });
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
      minBubble.style.left = minCenter;
      minBubble.textContent = minInput.value;
      maxBubble.style.left = maxCenter;
      maxBubble.textContent = maxInput.value;

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

  minInput.addEventListener('input', function () { refresh(minInput); });
  maxInput.addEventListener('input', function () { refresh(maxInput); });
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
  }, 'Omple els tres preus del Llindà.');

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
      principiColIndex, finalColIndex, modalValues[principiColIndex], modalValues[finalColIndex]
    ));
  }

  container.appendChild(fieldsGrid);
  return container;
}
