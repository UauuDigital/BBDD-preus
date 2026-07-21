document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('addRowBtn').innerHTML = ICONS.plus + '<span>Fila</span>';
  document.getElementById('addColBtn').innerHTML = ICONS.plus + '<span>Columna</span>';
  document.getElementById('refreshBtn').innerHTML = ICONS.refresh;

  document.getElementById('searchIcon').innerHTML = ICONS.search;

  document.getElementById('addRowBtn').addEventListener('click', handleAddRow);
  document.getElementById('addColBtn').addEventListener('click', handleAddColumn);
  document.getElementById('refreshBtn').addEventListener('click', loadCurrentSheet);
  document.getElementById('searchInput').addEventListener('input', function (e) {
    state.filterQuery = e.target.value;
    renderTable();
  });

  document.getElementById('addRowForm').addEventListener('submit', submitAddRowForm);
  document.getElementById('addRowCancelBtn').addEventListener('click', closeAddRowModal);

  renderSkeleton(3, 5);
  loadMeta();
});
