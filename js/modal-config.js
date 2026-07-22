// Configuració dels passos del formulari "+ Fila": quines columnes
// apareixen a cada pas fix, i quins camps condicionals depenen de quina
// casella. L'estat de navegació (modalStepIndex/modalValues) també viu
// aquí perquè el fan servir tots els altres fitxers modal-*.js.
const SERVICE_NAME_HEADERS = ['Nom Servei', 'NomCAST', 'NomENG'];

// Pantalles fixes del formulari de nova fila (només mostren les
// columnes de la seva llista que existeixin al full actual). Cada full
// té el seu propi recorregut: "Serveis" fa servir el flux amb opcions/
// extres condicionals, "Preus per dia" (calendari) és més senzill i no
// té cap pas condicional.
const SERVICE_FIELD_STEPS = [
  { title: 'Informació general', headers: ['Nom Servei', 'NomCAST', 'NomENG', 'Masia', 'Any', 'Preu'] },
  { title: 'Opcions', headers: ['perConvidat', 'Optional', 'quantityBased', 'Extres'] },
];

// requiredHeaders: només aquestes són obligatòries al pas 1 (Dia/Mes/
// Excepte es poden deixar buits — buit vol dir "tots els dies/mesos"/
// sense excepció, mateixa lògica que la taula i el calendari).
const CALENDAR_FIELD_STEPS = [
  { title: 'Informació general', headers: ['Masia', 'Dia', 'Mes', 'Any', 'Excepte'], requiredHeaders: ['Masia', 'Any'] },
  { title: 'Preu', headers: ['PREU/P', 'MÍN', 'PreuComp'] },
];

function isCalendarSheet() {
  return state.currentName === CALENDAR_SHEET_NAME;
}

function getFieldSteps() {
  return isCalendarSheet() ? CALENDAR_FIELD_STEPS : SERVICE_FIELD_STEPS;
}

// Pas 3 (condicional): cada camp només apareix si la casella de la
// columna "conditionHeader" (pas "Opcions") s'ha marcat.
const DETAIL_STEP_FIELDS = [
  { header: 'Unit', conditionHeader: 'quantityBased', kind: 'select', options: ['Pack', 'Persona'] },
  { header: 'ExtresLlista', conditionHeader: 'Extres', kind: 'multiselect', options: ['Desplegable', 'Llindà', 'Altres Extres'] },
];

// Índexs de pas (fixos: 0 i 1 sempre existeixen; 2, 3 i 4 són condicionals).
const STEP_GENERAL = 0;
const STEP_OPTIONS = 1;
const STEP_DETAILS = 2;
const STEP_BREAKDOWN = 3;
const STEP_EXTRAS = 4;

let modalStepIndex = 0;
let modalValues = {};

function getStepColIndexes(step) {
  return step.headers
    .map(function (header) { return state.headers.indexOf(header); })
    .filter(function (colIndex) { return colIndex !== -1; });
}
