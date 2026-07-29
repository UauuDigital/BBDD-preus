// Confirmació estilitzada per a accions destructives (esborrar fila), en
// lloc del confirm() natiu del navegador: aquest no es pot estilitzar,
// bloqueja el fil principal i no permet mostrar context (p.ex. quina
// fila concreta s'esborrarà) més enllà d'un únic missatge pla.
//
// "message" pot ser un text pla o un array de trossos (strings i/o
// { bold: text }, p.ex. el nom de la fila) que es construeixen amb
// crides DOM directes (textContent / <strong>), mai innerHTML: així no
// cal escapar res encara que el text vingui d'una cel·la del full.
function confirmDelete(message, confirmLabel) {
  return new Promise(function (resolve) {
    const dialog = document.getElementById('confirmDialog');
    const messageEl = document.getElementById('confirmMessage');
    messageEl.innerHTML = '';
    (Array.isArray(message) ? message : [message]).forEach(function (part) {
      if (part && typeof part === 'object' && 'bold' in part) {
        const strong = document.createElement('strong');
        strong.textContent = part.bold;
        messageEl.appendChild(strong);
      } else {
        messageEl.appendChild(document.createTextNode(part));
      }
    });
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    okBtn.textContent = confirmLabel || 'Esborra';

    function cleanup(result) {
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      dialog.removeEventListener('cancel', onCancel);
      if (dialog.open) dialog.close();
      resolve(result);
    }
    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    // "cancel" es dispara en tancar amb Escape, abans que el navegador
    // tanqui el <dialog> ell mateix.
    dialog.addEventListener('cancel', onCancel);
    dialog.showModal();
    okBtn.focus();
  });
}
