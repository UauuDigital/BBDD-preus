// Color i ordre fixos per masia (per nom, no per ordre alfabètic de les
// dades): les que no coincideixen amb cap d'aquestes es pinten amb
// --masia-default i van al final. Els colors viuen a variables.css
// (--masia-*), no aquí, perquè quedin dins el sistema de tokens.
const MASIA_COLOR_RULES = [
  { match: 'Alzina', color: 'var(--masia-alzina)' },
  { match: 'Macià', color: 'var(--masia-macia)' },
  { match: 'Tous', color: 'var(--masia-tous)' },
  { match: 'Vivencs', color: 'var(--masia-vivencs)' },
];

function getMasiaColor(masiaName) {
  const rule = MASIA_COLOR_RULES.find(function (r) { return masiaName && masiaName.indexOf(r.match) !== -1; });
  return rule ? rule.color : 'var(--masia-default)';
}

function getMasiaSortRank(masiaName) {
  const index = MASIA_COLOR_RULES.findIndex(function (r) { return masiaName && masiaName.indexOf(r.match) !== -1; });
  return index === -1 ? MASIA_COLOR_RULES.length : index;
}

function sortMasiaNames(names) {
  return names.slice().sort(function (a, b) {
    const rankDiff = getMasiaSortRank(a) - getMasiaSortRank(b);
    return rankDiff !== 0 ? rankDiff : a.localeCompare(b, 'ca');
  });
}
