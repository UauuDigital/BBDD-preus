// Backend de l'aplicació web "BBDD Preus".
// Aquest script viu DINS del Google Sheet (Extensions → Apps Script), per això
// no necessita cap Client ID ni Google Cloud Console: fa servir directament els
// permisos de l'usuari que ha iniciat sessió.

// Full amb el qual treballa l'aplicació. Es referencia per ID (no per
// "full actiu") perquè es pugui apuntar temporalment a una còpia de proves
// sense tocar el full real.
const PROD_SPREADSHEET_ID = '1sDCJhzn-xYT26mY23dKkmuSakEgbPorwfabaUHf1tSg';
const TEST_SPREADSHEET_ID = '1QHeig7QbKfKYbbRpEjxtV_ei7qY6wsXvuWH-cWYau68';

// Canvia aquesta línia per moure't entre proves i producció.
const SPREADSHEET_ID = TEST_SPREADSHEET_ID;

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BBDD Preus')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheetOrThrow_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error('No s\'ha trobat el full "' + sheetName + '".');
  return sheet;
}

function getSheetsMeta() {
  return getSpreadsheet_().getSheets().map(function (sheet) {
    return { name: sheet.getName() };
  });
}

function getSheetData(sheetName) {
  const sheet = getSheetOrThrow_(sheetName);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow === 0 || lastCol === 0) return { headers: [], rows: [] };

  const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  return { headers: values[0], rows: values.slice(1) };
}

function updateCell(sheetName, rowIndex, colIndex, value) {
  const sheet = getSheetOrThrow_(sheetName);
  sheet.getRange(rowIndex + 2, colIndex + 1).setValue(value);
  return true;
}

function renameHeader(sheetName, colIndex, label) {
  const sheet = getSheetOrThrow_(sheetName);
  sheet.getRange(1, colIndex + 1).setValue(label);
  return true;
}

function appendRow(sheetName, numCols) {
  const sheet = getSheetOrThrow_(sheetName);
  const newRow = sheet.getLastRow() + 1;
  if (numCols > 0) {
    sheet.getRange(newRow, 1, 1, numCols).setValue('');
  }
  return true;
}

function deleteRow(sheetName, rowIndex) {
  const sheet = getSheetOrThrow_(sheetName);
  sheet.deleteRow(rowIndex + 2);
  return true;
}

function addColumn(sheetName, label) {
  const sheet = getSheetOrThrow_(sheetName);
  const newCol = sheet.getLastColumn() + 1;
  sheet.getRange(1, newCol).setValue(label);
  return true;
}

function deleteColumn(sheetName, colIndex) {
  const sheet = getSheetOrThrow_(sheetName);
  sheet.deleteColumn(colIndex + 1);
  return true;
}
