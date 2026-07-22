document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('addRowBtn').innerHTML = ICONS.plus + '<span>Fila</span>';
  document.getElementById('refreshBtn').innerHTML = ICONS.refresh;

  document.getElementById('addRowBtn').addEventListener('click', handleAddRow);
  document.getElementById('refreshBtn').addEventListener('click', loadCurrentSheet);
  document.getElementById('simplifyCheckbox').addEventListener('change', function (e) {
    state.simplifyTable = e.target.checked;
    renderCurrentView();
  });

  document.getElementById('addRowForm').addEventListener('submit', submitAddRowForm);
  document.getElementById('addRowCancelBtn').addEventListener('click', closeAddRowModal);
  document.getElementById('addRowNextBtn').addEventListener('click', handleModalNext);
  document.getElementById('addRowBackBtn').addEventListener('click', handleModalBack);

  renderSkeleton(3, 5);
  loadMeta();
});
