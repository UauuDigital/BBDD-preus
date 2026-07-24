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

// Correu admès per entrar a l'app. Es llegeix de les Propietats del script
// (Configuració del projecte → Propietats del script → clau "ADMIN_EMAIL"),
// mai del codi: així no queda versionat a git, igual que un .env. Cal
// configurar-lo un sol cop des de l'editor d'Apps Script; vegeu README.md.
function getAdminEmail_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
}

function isAuthorized_() {
  const adminEmail = getAdminEmail_();
  const userEmail = Session.getActiveUser().getEmail();
  return Boolean(adminEmail) && Boolean(userEmail) && userEmail.toLowerCase() === adminEmail.toLowerCase();
}

function doGet() {
  if (!isAuthorized_()) {
    return HtmlService.createHtmlOutput(
      '<p style="font-family: sans-serif; padding: 2rem; color: #515856;">' +
      'No tens autorització per accedir a aquesta aplicació.</p>'
    ).setTitle('Accés denegat');
  }

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

// Nom de la columna que conté l'identificador autogenerat de cada fila
// (es compara ignorant majúscules/minúscules). Aquesta columna no
// s'ofereix mai com a editable: ni al formulari de nova fila (es genera
// un UUID nou) ni des de la taula (updateCell la rebutja).
const ID_HEADER = 'id';

function isIdHeader_(header) {
  return String(header).trim().toLowerCase() === ID_HEADER;
}

function isIdColumn_(sheet, colIndex) {
  return isIdHeader_(sheet.getRange(1, colIndex + 1).getValue());
}

// La columna "DATA" (full "Preus per dia") no és un valor introduït a
// mà: sempre s'ha de poder deduir de Dia + Mes + Excepte amb el patró
// "[Dia] de [Mes] (excepte [Excepte])" (Dia/Mes buits = "tots els
// dies"/"tots els mesos"). Per això és de només lectura des de la
// taula i es recalcula sola en crear o editar una fila.
const DATA_HEADER = 'DATA';

function isDataHeader_(header) {
  return String(header).trim() === DATA_HEADER;
}

function joinWithI_(items) {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  return items.slice(0, items.length - 1).join(', ') + ' i ' + items[items.length - 1];
}

function splitListCell_(raw) {
  return String(raw || '').split(',').map(function (part) { return part.trim(); }).filter(function (part) { return part; });
}

function computeDataDescription_(diaRaw, mesRaw, excepteRaw) {
  const diaItems = splitListCell_(diaRaw);
  const mesItems = splitListCell_(mesRaw);
  const excepte = String(excepteRaw || '').trim();

  const diaPart = diaItems.length ? joinWithI_(diaItems) : 'Tots els dies';
  const mesPart = mesItems.length ? joinWithI_(mesItems) : 'tots els mesos';

  let text = diaPart + ' de ' + mesPart;
  if (excepte) text += ' (excepte ' + excepte + ')';
  return text;
}

// Índexs (a "headers") de les columnes que intervenen en la descripció
// de "DATA". -1 si el full no en té alguna.
function getDataFormulaColIndexes_(headers) {
  return {
    data: headers.indexOf(DATA_HEADER),
    dia: headers.indexOf('Dia'),
    mes: headers.indexOf('Mes'),
    excepte: headers.indexOf('Excepte'),
  };
}

function updateCell(sheetName, rowIndex, colIndex, value) {
  const sheet = getSheetOrThrow_(sheetName);
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  if (isIdHeader_(headers[colIndex])) {
    throw new Error('La columna d\'identificador es genera automàticament i no es pot editar.');
  }
  if (isDataHeader_(headers[colIndex])) {
    throw new Error('La columna "DATA" es genera automàticament a partir de Dia/Mes/Excepte i no es pot editar directament.');
  }

  const targetRow = rowIndex + 2;
  sheet.getRange(targetRow, colIndex + 1).setValue(value);

  // Si s'edita Dia, Mes o Excepte, "DATA" es recalcula perquè segueixi
  // descrivint exactament la regla.
  const cols = getDataFormulaColIndexes_(headers);
  const editedHeader = headers[colIndex];
  if (cols.data !== -1 && (editedHeader === 'Dia' || editedHeader === 'Mes' || editedHeader === 'Excepte')) {
    const rowValues = sheet.getRange(targetRow, 1, 1, lastCol).getDisplayValues()[0];
    const dataText = computeDataDescription_(
      cols.dia !== -1 ? rowValues[cols.dia] : '',
      cols.mes !== -1 ? rowValues[cols.mes] : '',
      cols.excepte !== -1 ? rowValues[cols.excepte] : ''
    );
    sheet.getRange(targetRow, cols.data + 1).setValue(dataText);
    return { dataColIndex: cols.data, dataText: dataText };
  }
  return {};
}

function appendRow(sheetName, values) {
  const sheet = getSheetOrThrow_(sheetName);
  const newRow = sheet.getLastRow() + 1;
  if (values.length > 0) {
    const headers = sheet.getRange(1, 1, 1, values.length).getValues()[0];
    const finalValues = values.map(function (value, colIndex) {
      if (!isIdHeader_(headers[colIndex])) return value;
      return value || Utilities.getUuid();
    });

    // "DATA" es genera sempre a partir de Dia/Mes/Excepte, encara que
    // el formulari no l'ofereixi com a camp editable.
    const cols = getDataFormulaColIndexes_(headers);
    if (cols.data !== -1) {
      finalValues[cols.data] = computeDataDescription_(
        cols.dia !== -1 ? finalValues[cols.dia] : '',
        cols.mes !== -1 ? finalValues[cols.mes] : '',
        cols.excepte !== -1 ? finalValues[cols.excepte] : ''
      );
    }

    sheet.getRange(newRow, 1, 1, finalValues.length).setValues([finalValues]);
  }
  return true;
}

function deleteRow(sheetName, rowIndex) {
  const sheet = getSheetOrThrow_(sheetName);
  sheet.deleteRow(rowIndex + 2);
  return true;
}

// Relaciona cada capçalera de nom de servei amb el seu codi d'idioma,
// per poder traduir-les entre elles amb el traductor integrat d'Apps
// Script (LanguageApp), sense necessitat de cap API key.
const SERVICE_NAME_LANGS = {
  'Nom Servei': 'ca',
  'NomCAST': 'es',
  'NomENG': 'en',
};

// Tradueix un text als altres dos idiomes de ['ca', 'es', 'en'] (retorna
// un objecte { <codi idioma>: traducció } sense el de sourceLang).
function translateToLangs(text, sourceLang) {
  if (!text || !sourceLang) return {};
  const translations = {};
  ['ca', 'es', 'en'].forEach(function (lang) {
    if (lang === sourceLang) return;
    translations[lang] = LanguageApp.translate(text, sourceLang, lang);
  });
  return translations;
}

function translateServiceName(text, sourceHeader) {
  const sourceLang = SERVICE_NAME_LANGS[sourceHeader];
  if (!sourceLang) return {};
  const byLang = translateToLangs(text, sourceLang);

  const translations = {};
  Object.keys(SERVICE_NAME_LANGS).forEach(function (header) {
    const lang = SERVICE_NAME_LANGS[header];
    if (byLang[lang] !== undefined) translations[header] = byLang[lang];
  });
  return translations;
}
