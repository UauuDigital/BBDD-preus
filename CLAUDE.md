# CLAUDE.md — BBDD-preus

Regles específiques d'aquest projecte (les globals són a `~/.claude/CLAUDE.md`).

## Stack
- Google Apps Script (`Código.js`) + HTML/CSS/JS pur al client, desplegat amb `clasp`.

## Build
- `Index.html` es genera amb `node scripts/build.js` a partir de `Index.template.html` + `/css` + `/js` + `/components`. No s'edita a mà: editar els fitxers font i regenerar.
