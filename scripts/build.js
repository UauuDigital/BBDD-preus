// Munta Index.template.html + /css + /js + /components en un únic Index.html,
// que és el fitxer que Apps Script/clasp espera trobar (vegeu .claspignore).
// Cal executar-lo abans de cada `clasp push` (ho fa automàticament l'script
// "prepush" de package.json).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'Index.template.html');
const OUTPUT = path.join(ROOT, 'Index.html');

const INCLUDE_RE = /<!--INCLUDE:(.+?)-->/;

function build() {
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const lines = template.split('\n');

  const output = lines
    .map(function (line) {
      const match = line.match(INCLUDE_RE);
      if (!match) return line;
      const includePath = path.join(ROOT, match[1].trim());
      return fs.readFileSync(includePath, 'utf8').replace(/\n$/, '');
    })
    .join('\n');

  fs.writeFileSync(OUTPUT, output, 'utf8');
  console.log('Index.html generat a partir de Index.template.html');
}

build();
