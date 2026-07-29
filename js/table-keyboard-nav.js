// Navegació de cel·la a cel·la amb les fletxes, com un full de càlcul:
// des de qualsevol control d'una cel·la de la taula, amunt/avall/
// esquerra/dreta mouen el focus a la cel·la veïna en lloc de la
// pàgina. Un únic listener delegat a #tableWrap (la taula es
// reconstrueix sencera a cada renderTable, així que no té sentit
// enganxar-lo cel·la per cel·la).
function getFocusableCellControls(td) {
  return Array.prototype.slice.call(
    td.querySelectorAll('input:not([type="hidden"]):not(:disabled), button:not(:disabled)')
  );
}

// fromEnd: en entrar a una cel·la amb més d'un control (la columna
// d'accions té casella + duplica + esborra) venint de la dreta, cal
// aterrar en el darrer control, no sempre el primer.
function focusCellControl(td, fromEnd) {
  if (!td) return false;
  const controls = getFocusableCellControls(td);
  const target = fromEnd ? controls[controls.length - 1] : controls[0];
  if (!target) return false;
  target.focus();
  return true;
}

function handleTableKeyNav(event) {
  const key = event.key;
  if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight') return;

  const td = event.target.closest('td');
  if (!td) return;
  const tr = td.parentElement;
  const cellIndex = Array.prototype.indexOf.call(tr.children, td);

  // Dins d'un input de text, esquerra/dreta han de moure el cursor
  // normalment; només salten de cel·la quan el cursor ja és a l'extrem.
  if ((key === 'ArrowLeft' || key === 'ArrowRight') &&
      event.target.tagName === 'INPUT' && event.target.type !== 'checkbox') {
    const input = event.target;
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    const atEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
    if ((key === 'ArrowLeft' && !atStart) || (key === 'ArrowRight' && !atEnd)) return;
  }

  // Dins d'una mateixa cel·la amb més d'un control (columna d'accions:
  // casella, duplica, esborra), esquerra/dreta primer cicla entre els
  // controls de la pròpia cel·la — si no, les fletxes mai arribarien a
  // duplicar/esborrar (sempre quedarien a la casella, la primera trobada).
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const controls = getFocusableCellControls(td);
    if (controls.length > 1) {
      const currentIndex = controls.indexOf(event.target);
      const nextIndex = currentIndex + (key === 'ArrowRight' ? 1 : -1);
      if (currentIndex !== -1 && nextIndex >= 0 && nextIndex < controls.length) {
        controls[nextIndex].focus();
        event.preventDefault();
        return;
      }
    }
  }

  let targetRow = tr;
  let targetIndex = cellIndex;
  let fromEnd = false;
  if (key === 'ArrowUp') targetRow = tr.previousElementSibling;
  else if (key === 'ArrowDown') targetRow = tr.nextElementSibling;
  else if (key === 'ArrowLeft') { targetIndex = cellIndex - 1; fromEnd = true; }
  else targetIndex = cellIndex + 1;

  if (!targetRow) return;
  const targetCell = targetRow.children[targetIndex];
  if (targetCell && focusCellControl(targetCell, fromEnd)) event.preventDefault();
}
