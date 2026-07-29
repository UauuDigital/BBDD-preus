---
target: Index.template.html
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-07-28T15-29-26Z
slug: index-template-html
---
Method: dual-agent (A: general-purpose · B: general-purpose)

## Fix Verification (from previous critique run, 23/40)

| # | Fix | Verdict | Reason |
|---|-----|---------|--------|
| P0 | Esborrat segur (confirm-dialog) | **PASS** | `<dialog>` real amb `showModal()`, Promise resolta a OK/Cancel/Escape, neteja de listeners a cada crida; `handleDeleteRow`/bulk delete esperen correctament la confirmació abans de cridar el backend. |
| P1 | Errors clars + reintent | **PASS** | `onError` distingeix missatges propis (català, ja clars) d'excepcions tècniques via regex + detecció de salts de línia; reintent connectat a totes les operacions crítiques. Gap menor: el regex d'excepcions tècniques és una llista per patró, inherentment incompleta. |
| P1 | Desplegable visible (chevron) | **PASS** | `opacity: 0.35` en repòs, `1` en hover/focus/obert — confirmat al CSS. |
| P2 | Accions massives + navegació de teclat | **PARTIAL** | L'ordre descendent en l'esborrat en bloc i la neteja de selecció en re-renderitzar són correctes. Però `focusCellControl` (table-keyboard-nav.js) sempre selecciona el *primer* element focusable de la cel·la — a `.row-actions-col`, això és sempre la casella de selecció, mai els botons duplicar/esborrar. **Les fletxes de teclat no poden arribar mai als botons d'acció de fila.** |
| P3 | Ajuda a les capçaleres | **PASS** | Icona ⓘ afegida com a germana del botó d'ordenació (no filla), evitant HTML invàlid d'interactiu-dins-d'interactiu; confirmat pel comentari i el CSS. |

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Barra d'estat sòlida amb reintent; per confirmar que l'skeleton es mostra sempre abans del primer pintat en canviar de pestanya. |
| 2 | Match System / Real World | 3 | Terminologia catalana i de domini consistent. |
| 3 | User Control and Freedom | 3 | Confirmació + Cancel·la + Escape funcionen; sense desfer després de confirmar (acceptable per un Operate, però un buit real en esborrats massius). |
| 4 | Consistency and Standards | 3 | `.icon-btn`/`.btn-danger` reutilitzats consistentment; el nou patró de fila (casella+2 icones) és consistent amb si mateix. |
| 5 | Error Prevention | 3 | Ordre descendent en l'esborrat en bloc i neteja de selecció en filtrar/ordenar prevenen bugs reals d'índex desplaçat. |
| 6 | Recognition Rather Than Recall | 3 | Icones d'ajuda a les capçaleres redueixen la necessitat de memoritzar columnes. |
| 7 | Flexibility and Efficiency | 2 | La navegació de teclat és un avenç real, però el punt mort a `.row-actions-col` (veure P1 nou) elimina mig objectiu de l'eficiència promesa. |
| 8 | Aesthetic and Minimalist Design | 3 | Columna d'accions densa (casella+2 icones en 116px) però la resta es manté restringida. |
| 9 | Error Recovery | 3 | Missatge de reintent genèric funciona bé; el fallback tècnic encara podria filtrar-se si un error nou no coincideix amb el regex. |
| 10 | Help and Documentation | 3 | Ajuda a capçaleres + modal ara consistent; sense superfície d'ajuda més àmplia, però proporcionat per a una eina interna. |
| **Total** | | **29/40** | **Good** |

(Pujada respecte al 23/40 anterior — millora real, no renormalitzada; cap heurística marcada n/a.)

## Design Specificity Verdict

**LLM assessment**: Els nous canvis mantenen l'especificitat: decisions ancorades en restriccions concretes (matemàtica de contrast WCAG, validesa d'HTML, correcció d'índexs en esborrat massiu) en lloc de polit genèric. Just el llistó que necessita aquesta superfície Operate.

**Escaneig determinista**: cap troballa nova del codi afegit (barra d'accions massives, diàleg de confirmació, navegació de teclat, icones d'ajuda a capçaleres). Els dos avisos `layout-transition` (`transition: width` a `.modal`/`.modal-progress-fill`) de la crítica anterior **encara hi són** (ara a `Index.html:686` i `733`, desplaçats per les línies noves) — no es van arribar a corregir en aquesta ronda, ja que no formaven part de la llista d'accions prioritzades.

**Falsos positius**: `overused-font` (Inter) segueix sent fals positiu (token de marca fixat).

## Overall Impression

Els cinc arranjaments funcionen tal com es van dissenyar, amb una excepció real: la navegació de teclat —el component estrella del P2— té un punt mort exactament a la columna on un usuari expert (Riley/Alex) l'esperaria més: els botons de duplicar/esborrar per fila. És un bug de comportament concret, no una qüestió d'opinió, i val la pena tancar-lo abans de donar el P2 per fet. La resta de canvis (esborrat segur, errors clars, desplegable visible, ajuda a capçaleres) passen la verificació neta.

## What's Working

- L'ordre descendent abans d'esborrar en bloc i la neteja de selecció contra les files visibles a cada render són decisions de correcció que muntes equips es saltarien; ben fetes i ben documentades al codi.
- L'estructura germana (no filla) per a la icona d'ajuda de capçalera demostra disciplina real de validesa HTML, no només un pedaç visual.
- La triatge de missatges d'error (regex d'excepcions tècniques + heurística de salt de línia) és un punt mitjà pragmàtic entre "sempre genèric" i "sempre cru".

## Priority Issues

**[P1] La navegació de teclat no arriba mai als botons d'acció de fila.** `js/table-keyboard-nav.js:9` (`focusCellControl`) selecciona el primer element focusable de la cel·la amb `querySelector`, que a `.row-actions-col` és sempre la casella de selecció (inserida abans dels botons a `render.js`). Les fletxes mai deixen arribar a duplicar/esborrar per teclat.
- **Per què importa**: és exactament el gap que el P2 volia tancar per a usuaris experts, i ara aquest punt concret continua sent un cul-de-sac.
- **Fix**: o bé excloure `.row-actions-col` de la navegació amb fletxes (només Tab, documentat), o fer que ArrowRight repetit cicli casella→duplicar→esborrar abans de saltar a la cel·la següent.
- **Suggested command**: `/impeccable harden` (és una correcció de comportament ja enviat, no una decisió de disseny nova)

**[P2] `.row-actions-col` no cap en dispositius tàctils.** `css/table.css:175` (`width: 116px` fix). Sota `@media (pointer: coarse)`, `.icon-btn` puja a 44×44px; casella (16px) + marges + 2 botons de 44px + padding sumen ~132px, per sobre dels 116px fixats, amb `white-space: nowrap` — confirmat de forma independent per les dues avaluacions.
- **Per què importa**: en una eina d'admin oberta també des de tauleta, la columna d'accions es veurà retallada o forçarà desplaçament horitzontal.
- **Fix**: amplada flexible de `.row-actions-col` sota `pointer: coarse`, o replantejar la densitat d'aquesta columna en tàctil.
- **Suggested command**: `/impeccable layout`

**[P3] Sense progrés ni recompte en accions massives.** `performBulkDelete`/`handleBulkDuplicate` (`actions.js`) només mostren "Esborrant N files..." estàtic; si falla a mitges, el reintent és tècnicament correcte però l'usuari no sap quantes ja s'han completat.
- **Fix**: missatge de progrés ("Esborrant fila 3 de 10...") i indicar quantes ja s'han completat en cas d'error.
- **Suggested command**: `/impeccable clarify`

**[P3] La barra d'accions massives no anuncia canvis a lectors de pantalla.** `#bulkActionsBar` (`components/body.html`) no té `aria-live`/`role`; quan apareix i el recompte de files seleccionades canvia, un usuari de lector de pantalla no n'és informat (confirmat independentment per Assessment B).
- **Fix**: afegir `aria-live="polite"` al contenidor o al `#bulkActionsCount`.
- **Suggested command**: `/impeccable harden`

**[P3] Sense manera òbvia de "netejar selecció".** La barra només ofereix Duplica/Esborra; l'única manera de desmarcar-ho tot és desactivar la casella de "seleccionar-les totes" al capçal, sense cap "x"/"Deselecciona" visible a la pròpia barra.
- **Suggested command**: `/impeccable polish`

## Persona Red Flags

**Riley (usuari expert/eficiència)**: topa directament amb el punt mort de navegació de teclat (P1) — és exactament la persona que el fix pretenia servir, i és qui notarà que està incomplet.

**Casey (usuari ocasional/tàctil)**: la columna de 116px amb objectius tàctils de 44px (P2) és el punt de trencament més probable en ús real, ja que és per a qui s'activa la media query `pointer: coarse`.

**Alex (prudent amb accions destructives)**: ben servit ara (confirmació estilitzada amb avís explícit "no es pot desfer"), però una fallada parcial en un esborrat massiu sense indicador de progrés (P3) podria reintroduir ansietat just en el moment en què s'intenta confiar en l'eina.

## Minor Observations

- Els dos avisos `layout-transition` (`transition: width`) del detector segueixen sense corregir-se — menors, es poden deixar per a un `/impeccable polish` final.
- `setStatus` reconstrueix tot l'`innerHTML` a cada crida, incloent-hi el botó de reintent — si l'usuari hi té el focus i l'estat es torna a renderitzar, el perd.
- Amb la nova icona d'ajuda ocupant espai horitzontal dins `.header-cell-row`, les capçaleres estretes (`.col-narrow`, 90px, com "MÍN") poden truncar-se més agressivament — val la pena una comprovació visual real.

## Questions to Consider

- Si la navegació de teclat ha de fer l'eina "eficient", per què precisament la cel·la més utilitzada (accions de fila) és l'única on les fletxes no arriben — va ser un tall d'abast intencionat o un descuit?
- És 116px fix el disseny correcte per a la columna d'accions, o hauria de col·lapsar duplicar/esborrar en un menú "⋮" a mòbil/tàctil en lloc de forçar 3 controls en una caixa fixa?

**Caveat sobre l'evidència**: cap de les dues avaluacions ha pogut fer inspecció visual en navegador — l'app és una implementació de Google Apps Script protegida per login de Google + `ADMIN_EMAIL`, inabastable des d'aquest entorn. Totes les troballes provenen de la lectura directa del codi font.
