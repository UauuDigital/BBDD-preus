# BBDD Preus

Pàgina web per fer CRUD (crear, llegir, editar, esborrar) de totes les columnes i files
del Google Sheet ["BBDD preus"](https://docs.google.com/spreadsheets/d/1sDCJhzn-xYT26mY23dKkmuSakEgbPorwfabaUHf1tSg/edit).

## Com funciona

Fet amb **Google Apps Script**, integrat directament dins del mateix Google Sheet:

- [`Código.js`](Código.js) és la part que llegeix i escriu el full (backend, l'única lògica
  que necessita Google Sheets). Es diu així (i no `Code.gs`) perquè és el nom que li vam
  donar quan es va crear des del navegador — clasp sincronitza pel nom real del fitxer al
  projecte d'Apps Script, no es pot canviar sense crear-ne un altre.
- `Index.html` és la pàgina que es veu (interfície de la taula editable). **És un fitxer
  generat, no s'edita a mà ni es versiona a git**: Apps Script només pot servir un únic
  fitxer HTML, així que el codi font real viu dividit en:
  - [`components/`](components) — fragments HTML (`head.html`, `body.html`)
  - [`css/`](css) — estils per component (`variables.css`, `layout.css`, `toolbar.css`, `table.css`)
  - [`js/`](js) — lògica per funcionalitat (`icons.js`, `state.js`, `render.js`, `actions.js`, `init.js`)
  - [`Index.template.html`](Index.template.html) — l'esquelet que indica on va cada tros
    (marques `<!--INCLUDE:ruta-->`)
  - [`scripts/build.js`](scripts/build.js) — munta tot això en `Index.html`. S'executa
    automàticament abans de `npm run push`, `npm run deploy` i `npm run watch` (també es
    pot llançar a mà amb `npm run build`).
- Apps Script serveix `Index.html` directament — no cal cap altre allotjament (GitHub
  Pages, Cloudflare, etc.).
- No cal Google Cloud Console ni Client ID: l'script fa servir els teus propis permisos
  d'editor sobre el full.
- Les pestanyes del full (`Hoja 1`, `PreusMenu`, `BarraLliure`, ...) es detecten
  automàticament, igual que les columnes de cadascuna.

Es desenvolupa des de VSCode i es sincronitza amb Google mitjançant
**[`clasp`](https://github.com/google/clasp)** (l'eina oficial de línia d'ordres de Google
per a Apps Script) — sense copiar i enganxar codi manualment.

## Configuració (només un cop)

1. Instal·la les dependències:
   ```bash
   cd BBDD-preus
   npm install
   ```
2. Inicia sessió amb clasp (obrirà el navegador per autoritzar-te amb el teu compte
   Google; és un login estàndard de Google, no cal crear cap credencial ni projecte a
   Google Cloud):
   ```bash
   npx clasp login
   ```
3. Si **encara no has creat** el projecte d'Apps Script:
   ```bash
   npx clasp create --type webapp --title "BBDD Preus" --rootDir .
   ```
   Això substitueix `.clasp.json` amb el `scriptId` del projecte nou.

   Si **ja el vas crear des del navegador** (Extensions → Apps Script), agafa'n l'ID:
   dins l'editor d'Apps Script, icona d'engranatge **Configuració del projecte** →
   **ID de secuencia de comandos** → copia'l i enganxa'l a [`.clasp.json`](.clasp.json),
   al camp `scriptId`. Després baixa el que ja hi hagi al núvol per no perdre res:
   ```bash
   npx clasp pull
   ```
4. Activa l'API d'Apps Script (només un cop; és un interruptor personal, no un projecte
   de Google Cloud): visita https://script.google.com/home/usersettings i activa'l.
   Espera un minut perquè es propagui.
5. Puja el codi d'aquest repositori (`Código.js` + `Index.html`) al projecte:
   ```bash
   npx clasp push
   ```
6. **Desplega'l com a aplicació web** (això només cal fer-ho un cop, o quan canviïs les
   opcions d'accés — no cada vegada que editis codi):
   ```bash
   npx clasp deploy
   ```
   O bé des del navegador (`npx clasp open` t'hi porta directament): **Desplega → Nova
   implementació → Aplicació web**, amb "Executar com: Jo mateix/a" i "Qui té accés"
   segons qui hagi de poder-hi entrar (vegeu Seguretat més avall).

## Flux de treball diari

Edita `Código.js` o `Index.html` a VSCode com qualsevol altre projecte, i quan vulguis
provar els canvis:

```bash
npx clasp push
```

(o `npx clasp push --watch` per pujar automàticament cada cop que desis un fitxer).

Els canvis es veuen a l'instant a la **URL de prova** (`npx clasp open` → Desplega →
Implementacions de prova). Per publicar-los a la URL definitiva que fa servir l'equip
(sense generar-ne una de nova), cal actualitzar la implementació existent, indicant-ne
l'ID:

```bash
npx clasp deploy -i AKfycbwuviZsKCprgfdKt8b_eaBm3P5WOEgI2ZPxIbifeD18EzGzRSemi7rRAuieQkqnowaI2A
```

(Aquest ID es pot tornar a consultar amb `npx clasp deployments`.)

## Seguretat

- No hi ha cap credencial ni clau en aquests fitxers: l'script fa servir directament els
  teus propis permisos sobre el full.
- L'accés a la pàgina es controla amb l'opció "Qui té accés" del desplegament (Google
  Workspace intern, o enllaç compartit manualment) — no hi ha cap altra capa
  d'autenticació pròpia.
- Les credencials de `clasp login` es guarden fora d'aquest repositori (a la teva
  carpeta d'usuari), mai en fitxers versionats.
