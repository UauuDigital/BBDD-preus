// Confirmació estilitzada per a accions destructives (esborrar fila), en
// lloc del confirm() natiu del navegador: aquest no es pot estilitzar,
// bloqueja el fil principal i no permet mostrar context (p.ex. quina
// fila concreta s'esborrarà) més enllà d'un únic missatge pla.
function confirmDelete(message, confirmLabel) {
  return new Promise(function (resolve) {
    const dialog = document.getElementById('confirmDialog');
    document.getElementById('confirmMessage').textContent = message;
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
