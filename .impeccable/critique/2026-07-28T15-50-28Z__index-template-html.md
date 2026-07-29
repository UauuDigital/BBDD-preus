---
target: Index.template.html
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-07-28T15-50-28Z
slug: index-template-html
---
Method: dual-agent (A: general-purpose · B: general-purpose)

## Fix Verification (des de la ronda 2, 29/40)

| Fix | Veredicte | Motiu |
|---|---|---|
| Cicle de teclat casella→duplica→esborra | **PASS** | `getFocusableCellControls`/`focusCellControl` cicla correctament dins la cel·la abans de saltar; entrar per la dreta amb `ArrowLeft` aterra al darrer control (esborra). `indexOf` retornant -1 cau amb seguretat al comportament normal, sense bucles ni doble gestió (`preventDefault` és mutualment exclusiu entre branques). |
| Vinyeta d'ajuda (posició i z-index) | **PASS** | Obrir cap avall i alineada a la dreta de la icona (que ja està a la vora dreta de la columna) manté la vinyeta sempre dins `.table-wrap`, també a l'última columna. **Observació**: el bump de `z-index` amb `:has()` (pensat per a l'antic obrir-cap-a-la-dreta) ja no soluciona res ara que obre cap avall dins el tbody (no sticky) — codi mort, no incorrecte. `:has()` no té suport a Firefox &lt;121, sense fallback (risc baix per a una eina d'un sol admin, però no documentat). |

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | `aria-live` existeix a `#statusMsg` però no a la barra d'accions massives |
| 2 | Match System / Real World | 3 | MÍN/PREU/P ara explicats amb les icones d'ajuda |
| 3 | User Control and Freedom | 2 | Sense "netejar selecció" a la barra massiva; esborrat amb confirmació però sense desfer |
| 4 | Consistency and Standards | 3 | Patrons d'icona/vinyeta consistents arreu |
| 5 | Error Prevention | 3 | Diàleg de confirmació d'esborrat es manté sòlid |
| 6 | Recognition Rather Than Recall | 3 | Fletxa del desplegable visible en repòs es manté |
| 7 | Flexibility and Efficiency | 3 | La navegació de teclat ja arriba a totes les accions de fila — avenç real |
| 8 | Aesthetic and Minimalist Design | 3 | Net, sense soroll |
| 9 | Error Recovery | 2 | Sense progrés ni recompte en operacions massives |
| 10 | Help and Documentation | 3 | Tooltips de capçalera presents i ben posicionats |
| **Total** | | **28/40** | **Good** |

(Molt semblant a la ronda 2 (29/40): la puntuació es manté estable, amb la 7 pujant per la navegació de teclat arreglada i la resta consistent.)

## Design Specificity Verdict

Els arranjaments són precisos i ben dirigits als bugs reportats, sense mala olor de codi. Però la superfície en conjunt continua sent una taula d'admin genèrica visualment; res la distingeix com a UAUU més enllà dels tokens de tipografia/paleta ja existents.

**Escaneig determinista**: els dos avisos `layout-transition` (`transition: width` a `.modal`/`.modal-progress-fill`) segueixen presents (`Index.html:714` i `761`), sense corregir des de la ronda 1. Cap troballa nova.

**Falsos positius**: `overused-font` (Inter) continua sent fals positiu confirmat.

**Nota d'edge case (B)**: si un desplegable multiselecció està obert (z-index 30) mentre s'intenta veure un tooltip de capçalera (z-index 2), el panell del desplegable el podria tapar si les regions se superposen — no verificat en navegador real, senyalat com a comprovació pendent, no com a bloqueig.

## Overall Impression

Tres rondes de correccions sense cap regressió detectada — bon senyal de disciplina. Els dos arranjaments d'aquesta sessió (cicle de teclat, posició del tooltip) són sòlids i ben resolts. El que queda pendent és exactament el que ja s'havia detectat a la ronda 2 i encara no s'ha tocat: accessibilitat de la barra d'accions massives, amplada de la columna d'accions en tàctil, i feedback de progrés en operacions massives.

## What's Working

- El cicle de navegació de teclat gestiona correctament els casos límit (primer/darrer control, `fromEnd`).
- El reposicionament del tooltip és una solució robusta que generalitza a qualsevol columna (alineat a la vora dreta de la icona), no només un pedaç per a l'última columna.
- Disciplina de correccions acumulades en 3 rondes sense regressions.

## Priority Issues

**[P1] La barra d'accions massives segueix sense `aria-live`.** `components/body.html:24-25` — `#bulkActionsCount` s'actualitza en silenci. Un usuari de lector de pantalla que faci operacions amb diverses files no rep cap confirmació del recompte seleccionat. → `/impeccable harden`

**[P2] `.row-actions-col` segueix sense encaixar en tàctil.** `css/table.css:203` manté els 116px fixos; `@media (pointer: coarse)` (table.css:145-147) puja cada `.icon-btn` a 44px — casella + 2 botons de 44px superen els 116px. → `/impeccable layout`

**[P3] Les operacions massives segueixen sense feedback de progrés.** `js/actions.js` (`performBulkDelete`/`handleBulkDuplicate`) només mostra un missatge estàtic a l'inici; si falla a mitges, l'usuari no sap quantes ja s'han completat. → `/impeccable polish`

**[P3] `transition: width` sense corregir.** `css/modal.css:10` i `:57` animen `width` directament, forçant recàlcul de layout a cada frame en lloc de només compositor. Senyalat pel detector des de la ronda 1. → `/impeccable optimize`

## Persona Red Flags

**Admin fent neteja massiva ràpida**: encara sense "netejar selecció" ni senyal de progrés — els dos punts de fricció amb més probabilitat de generar una consulta de suport.

**Admin només amb teclat**: ara totalment servit per a accions de fila — la queixa de la ronda 2 està resolta.

## Minor Observations

- El bump de `z-index` amb `:has()` (`table.css:35-38`) ja no soluciona res ara que el tooltip obre cap avall — val la pena actualitzar el comentari o eliminar-lo per no confondre en el futur.
- Als límits de la taula (primera/última fila o columna), `focusCellControl` no crida `preventDefault` quan no troba cel·la destí, així que la fletxa cau al desplaçament natiu del navegador — inconsistent amb la resta de la navegació tipus full de càlcul, severitat baixa.

## Questions to Consider

- Si les accions massives encara no poden mostrar progrés ni desfer-se, és segur mantenir "seleccionar diverses files" exposat, o hauria de requerir un flux de confirmació per ítem més petit fins que existeixi la UI de progrés?
- El bump de `z-index` amb `:has()` solucionava un problema que el canvi de direcció (tooltip cap avall) ja havia resolt — quants altres "pedaços" de CSS de rondes anteriors són ara pes mort que ningú torna a revisar?

**Caveat sobre l'evidència**: cap inspecció visual en navegador (app protegida per login de Google + `ADMIN_EMAIL`, inabastable des d'aquest entorn). Totes les troballes provenen de la lectura directa del codi font.
