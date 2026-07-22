// Capçaleres d'un sol valor que s'editen amb un desplegable uniselecció,
// amb les opcions calculades a partir dels valors ja existents a la
// columna (una per cel·la, no combinats amb comes). Mateix component
// visual que el multiselecció (vegeu buildDropdownField a multiselect.js).
const SELECT_HEADERS = ['Unit'];

function buildSelectField(colIndex, initialValue, fixedOptions, idPrefix, getOptionColor) {
  const options = fixedOptions || getDistinctColumnValues(colIndex, false);
  return buildDropdownField(colIndex, initialValue, options, false, idPrefix, undefined, getOptionColor);
}
