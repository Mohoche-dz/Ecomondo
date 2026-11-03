/* Ecomondo 2026 — carnet de salon. Données sur l'appareil (IndexedDB). */
(() => {
'use strict';
const APP_VERSION = '1.0.0';
const DAYS = { mar: 'Mardi', mer: 'Mercredi', jeu: 'Jeudi' };
const DAY_DATES = { mar: '3 nov.', mer: '4 nov.', jeu: '5 nov.' };
const DAY_ORDER = { mar: 1, mer: 2, jeu: 3 };
const dayCmp = (a, b) => (DAY_ORDER[a.day] || 9) - (DAY_ORDER[b.day] || 9);
const KIND_LABEL = { rdv: 'RDV', visite: 'Visite', ajout: 'Ajout', reserve: 'Réserve', delegation: 'Délégation' };
const COUNTRIES = { IT:'Italie', DE:'Allemagne', CN:'Chine', AT:'Autriche', ES:'Espagne', CH:'Suisse', FR:'France', DK:'Danemark', BE:'Belgique', NL:'Pays-Bas', CZ:'Tchéquie', TR:'Turquie', GB:'Royaume-Uni', CL:'Chili', NO:'Norvège', SE:'Suède', FI:'Finlande', PL:'Pologne', PT:'Portugal', US:'États-Unis', CA:'Canada', GR:'Grèce', HU:'Hongrie', SI:'Slovénie', SK:'Slovaquie', RO:'Roumanie', BG:'Bulgarie', HR:'Croatie', IE:'Irlande', LU:'Luxembourg', LT:'Lituanie', LV:'Lettonie', EE:'Estonie', UA:'Ukraine', RS:'Serbie', IN:'Inde', JP:'Japon', KR:'Corée du Sud', TW:'Taïwan', IL:'Israël', AE:'Émirats arabes unis', EG:'Égypte', MA:'Maroc', TN:'Tunisie', DZ:'Algérie', ZA:'Afrique du Sud', BR:'Brésil', MX:'Mexique', AR:'Argentine', AU:'Australie', SM:'Saint-Marin', MT:'Malte', CY:'Chypre', IS:'Islande', GE:'Géorgie', KZ:'Kazakhstan', SA:'Arabie saoudite', NG:'Nigéria', KE:'Kenya', GH:'Ghana', ET:'Éthiopie', MY:'Malaisie', SG:'Singapour', TH:'Thaïlande', VN:'Vietnam', ID:'Indonésie', PK:'Pakistan', LB:'Liban', JO:'Jordanie', IR:'Iran', IQ:'Irak', QA:'Qatar', KW:'Koweït', OM:'Oman', BH:'Bahreïn', AL:'Albanie', MK:'Macédoine du Nord', BA:'Bosnie-Herzégovine', ME:'Monténégro', XK:'Kosovo', MD:'Moldavie', BY:'Biélorussie', RU:'Russie', LI:'Liechtenstein', MC:'Monaco', AD:'Andorre', CO:'Colombie', PE:'Pérou', UY:'Uruguay', EC:'Équateur', VE:'Venezuela', CR:'Costa Rica', PA:'Panama', DO:'République dominicaine', NZ:'Nouvelle-Zélande', HK:'Hong Kong', PH:'Philippines', BD:'Bangladesh', LK:'Sri Lanka', UZ:'Ouzbékistan', AZ:'Azerbaïdjan', AM:'Arménie', SN:'Sénégal', CI:"Côte d'Ivoire", CM:'Cameroun', TZ:'Tanzanie', UG:'Ouganda', RW:'Rwanda', MZ:'Mozambique', AO:'Angola', ZM:'Zambie', ZW:'Zimbabwe', LY:'Libye', SD:'Soudan', MU:'Maurice' };
const INFO_BLOCKS = [
  ['Horaires', 'Salon ouvert de 9 h 30 à 18 h 30 du mardi au jeudi. Rendez-vous d’affaires de 10 h 15 à 13 h 10 et de 14 h 15 à 17 h 10 (créneaux officiels de 30 min; règle personnelle : 15 min, 20 max pour les A). Participation obligatoire.'],
  ['Arrivée', 'L’autobus dépose à l’entrée Est. Suivre l’accueil jusqu’au comptoir « Desk Reserved to International Delegations invited by IEG » pour réimprimer le billet. Vestiaire réservé dans l’East Hall.'],
  ['Lounges', 'B8 : point de rencontre du matin (café, ordinateurs pour le sondage, personnel IEG et agence de voyage). B7 : espace de travail et restaurant des acheteurs. Salle de prière derrière le lounge B8.'],
  ['Repas', 'Repas gratuit au lounge B7 de 12 h à 14 h 45. Jours de rendez-vous : 13 h à 14 h. Jour de visite libre : 12 h à 12 h 45 ou 14 h à 14 h 45. Toute la délégation y mange : réseautage de jour.'],
  ['Signature des rencontres', 'Application « ECOMONDO and KEY », même adresse que la plateforme de jumelage. À la fin de chaque rencontre : « Add Contact » puis scanner le code QR du badge exposant. Si le scan échoue : signature physique sur l’agenda, avec le nom de la personne rencontrée si elle diffère.'],
  ['Fin du programme', 'Après le dernier rendez-vous (SEFT, jeudi 17 h) : remettre l’agenda au personnel IEG au lounge B8, indiquer les rencontres scannées, remplir le sondage sur place et le sondage ITA (lien dans le Buyers Program).'],
  ['Rythme', 'Scanner le badge, puis partir. Le temps libéré va au stand voisin quand le prochain rendez-vous est dans le même pavillon. Aucune conférence. Les exposants ne se voient qu’aux heures du salon; les soirées sont réservées à la délégation.'],
  ['Les 3 questions', '1. Vendez-vous au Canada ou en Amérique du Nord aujourd’hui, et par qui ? 2. Comment rémunérez-vous vos agents ailleurs, et seriez-vous prêts à financer une phase de lancement de 6 mois contre un plan et des indicateurs ? 3. Quelle prochaine étape datée : appel en novembre, accord de confidentialité, visite au Québec ?'],
  ['Argument', 'Accès au marché clé en main : représentation en français, plan de marché, coordination de la certification CSA, recrutement d’installateurs partenaires, repérage de subventions pour les acheteurs (Quadralis), ce qui raccourcit le cycle de vente du fabricant.'],
];

/* ---------- utilitaires ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
const nowIso = () => new Date().toISOString();
const timeMin = t => { const m = /^(\d{1,2})[:h.](\d{2})/.exec(String(t || '').trim()); return m ? +m[1] * 60 + +m[2] : null; };
const fmtDate = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }); };
const country = c => COUNTRIES[c] || c || '';
const norm = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\b(SRL|SPA|GMBH|LTD|LLC|INC|SAS|SA|BV|AG|AB|SRO|SL|SNC|CO|KG|CORP|SOCIETA|UNIPERSONALE|GROUP|GRUPPO|INTERNATIONAL)\b/g, ' ').replace(/\s+/g, ' ').trim();
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const todayKey = () => { const d = new Date(); const k = { '2026-11-03': 'mar', '2026-11-04': 'mer', '2026-11-05': 'jeu' }; const s = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); return k[s] || null; };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
function toast(msg, ms = 2200) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), ms); }
function confirm2(msg) { return window.confirm(msg); }

/* ---------- stockage (IndexedDB) ---------- */
const DB_NAME = 'ecomondo2026', DB_VER = 1;
let idb;
function openDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('items')) d.createObjectStore('items', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('contacts')) d.createObjectStore('contacts', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'k' });
    };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
const tx = (store, mode, fn) => new Promise((res, rej) => { const t = idb.transaction(store, mode); const s = t.objectStore(store); const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
const dbAll = store => new Promise((res, rej) => { const r = idb.transaction(store).objectStore(store).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const dbGet = (store, id) => new Promise((res, rej) => { const r = idb.transaction(store).objectStore(store).get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const dbPut = (store, obj) => tx(store, 'readwrite', s => s.put(obj));
const dbDel = (store, id) => tx(store, 'readwrite', s => s.delete(id));
const dbClear = store => tx(store, 'readwrite', s => s.clear());
const setting = (k, v) => { try { if (v === undefined) return localStorage.getItem('eco:' + k); localStorage.setItem('eco:' + k, v); } catch (e) { return null; } };

/* ---------- état ---------- */
const S = { items: [], contacts: [], reserve: [], cat: null, catIndex: null, ready: false, view: null, day: setting('day') || todayKey() || 'mar', q: '', saveTimers: {}, urls: new Map(), expoFilter: { hall: '', reserveOnly: true } };
const byId = (arr, id) => arr.find(x => x.id === id);
function newItem(o) {
  return Object.assign({ id: uid(), kind: 'ajout', day: S.day, order: 999, time: '', stand: '', hall: '', company: '', country: '', contactPlanned: '', what: '', objective: '', priority: '', angle: '', duration: '', status: 'todo', doneAt: '', rating: '', intAgent: false, intMay: false, intQuad: false, inCanada: '', fixOk: '', nextStep: '', nextDate: '', notes: '', exhibitorId: '', createdAt: nowIso(), updatedAt: nowIso() }, o);
}
async function seedIfNeeded() {
  const meta = await dbGet('meta', 'seed');
  const r = await fetch('data/seed.json'); const seed = await r.json();
  S.reserve = seed.reserve;
  if (!meta) {
    for (const it of seed.items) await dbPut('items', newItem(Object.assign({}, it, { status: 'todo' })));
    await dbPut('meta', { k: 'seed', version: seed.version, at: nowIso() });
  }
}
async function loadAll() { S.items = await dbAll('items'); S.contacts = await dbAll('contacts'); }
async function loadCatalogue() {
  if (S.cat) return S.cat;
  const r = await fetch('data/catalogue.json'); const c = await r.json();
  S.cat = c; S.catIndex = c.exhibitors.map(e => ({ e, n: norm(e.n), toks: norm(e.n).split(' ').filter(t => t.length > 1) }));
  S.catById = new Map(c.exhibitors.map(e => [e.id, e]));
  S.df = new Map(); for (const x of S.catIndex) for (const t of new Set(x.toks)) S.df.set(t, (S.df.get(t) || 0) + 1);
  return c;
}
function saveItem(it, immediate) {
  it.updatedAt = nowIso();
  clearTimeout(S.saveTimers[it.id]);
  const run = async () => { try { await dbPut('items', it); flashSaved(); } catch (e) { toast('Erreur d’enregistrement'); console.error(e); } };
  if (immediate) return run();
  S.saveTimers[it.id] = setTimeout(run, 500);
}
async function saveContact(c) { c.updatedAt = nowIso(); await dbPut('contacts', c); if (!byId(S.contacts, c.id)) S.contacts.push(c); flashSaved(); }
function flashSaved() { const el = $('#savedFlag'); if (!el) return; el.textContent = 'Enregistré'; clearTimeout(flashSaved._t); flashSaved._t = setTimeout(() => { el.textContent = ''; }, 1500); }
function photoUrl(id) { return S.urls.get(id) || null; }
async function loadPhotoUrl(id) {
  if (S.urls.has(id)) return S.urls.get(id);
  const p = await dbGet('photos', id); if (!p) return null;
  const url = URL.createObjectURL(new Blob([p.data], { type: p.type || 'image/jpeg' })); S.urls.set(id, url); return url;
}

/* ---------- navigation ---------- */
const views = {};
function go(hash) { location.hash = hash; }
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'plan';
  const [name, ...rest] = h.split('/');
  const v = views[name] || views.plan;
  S.view = name;
  $$('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === (v.tab || name)));
  const main = $('#main');
  main.classList.toggle('nav-hidden', !!v.noTabs);
  $('#tabs').classList.toggle('hidden', !!v.noTabs);
  $('#back').classList.toggle('hidden', !v.back);
  $('#searchBtn').classList.toggle('hidden', !v.search);
  if (!v.search) closeSearch();
  const same = S.lastHash === location.hash; S.lastHash = location.hash;
  const y = window.scrollY;
  const p = v.render(rest.join('/'));
  if (same) { requestAnimationFrame(() => window.scrollTo(0, y)); if (p && p.then) p.then(() => window.scrollTo(0, y)); } else window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
$('#back').addEventListener('click', () => { if (history.length > 1) history.back(); else go('plan'); });
$$('#tabs button').forEach(b => b.addEventListener('click', () => { closeSearch(); const h = b.dataset.tab === 'plan' ? 'plan/' + S.day : b.dataset.tab; if (location.hash === '#' + h) route(); else go(h); }));
$('#gear').addEventListener('click', () => go('settings'));
$('#searchBtn').addEventListener('click', () => { $('#searchbar').classList.remove('hidden'); $('#main').classList.add('withsearch'); $('#q').focus(); });
$('#qClose').addEventListener('click', () => { $('#q').value = ''; S.q = ''; closeSearch(); route(); });
$('#q').addEventListener('input', debounce(() => { S.q = $('#q').value.trim(); route(); }, 150));
function closeSearch() { $('#searchbar').classList.add('hidden'); $('#main').classList.remove('withsearch'); S.q = ''; $('#q').value = ''; }
function setTitle(t, sub = '') { $('#title').textContent = t; $('#subtitle').textContent = sub; document.title = t === 'Ecomondo 2026' ? t : t + ' · Ecomondo 2026'; }

/* ---------- rendu : listes ---------- */
const chevSvg = '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const checkSvg = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const skipSvg = '<svg viewBox="0 0 24 24"><path d="M6 12h12" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
function matchQ(it, q) { if (!q) return true; const n = norm(q); const hay = norm([it.company, it.stand, it.contactPlanned, it.what, it.notes, it.nextStep].join(' ')); return hay.includes(n); }
function itemRow(it, opts = {}) {
  const cls = ['row', 'tap', it.status === 'done' ? 'done' : '', it.status === 'skipped' ? 'skipped' : '', opts.next ? 'next' : ''].join(' ');
  const contactsN = S.contacts.filter(c => c.itemId === it.id).length;
  const t2 = [it.stand ? esc(it.stand) : '', it.contactPlanned ? esc(it.contactPlanned) : '', it.country ? esc(country(it.country)) : ''].filter(Boolean).join(' · ');
  const chips = [`<span class="chip ${it.kind}">${KIND_LABEL[it.kind] || it.kind}</span>`, it.priority === '1' ? '<span class="chip p1">P1</span>' : '', it.rating ? `<span class="chip ${it.rating}">${it.rating}</span>` : '', contactsN ? `<span class="chip">${contactsN} contact${contactsN > 1 ? 's' : ''}</span>` : '', it.nextStep ? '<span class="chip">suivi</span>' : ''].filter(Boolean).join(' ');
  const time = it.kind === 'delegation' ? '' : `<div class="time">${esc(it.time || '—')}${it.duration ? `<small>${esc(it.duration)}</small>` : ''}</div>`;
  const ck = `<button class="checkwrap" data-check="${it.id}" aria-label="Fait"><span class="check ${it.status === 'done' ? 'on' : it.status === 'skipped' ? 'skip' : ''}">${it.status === 'skipped' ? skipSvg : checkSvg}</span></button>`;
  return `<div class="${cls}" data-open="${it.id}">${time}<div class="main"><div class="t1">${esc(it.company)}</div><div class="t2">${t2 || '&nbsp;'}</div><div class="t3">${chips}</div></div>${ck}</div>`;
}
function bindRows(root) {
  root.addEventListener('click', async e => {
    const ck = e.target.closest('[data-check]');
    if (ck) { e.stopPropagation(); const it = byId(S.items, ck.dataset.check); if (!it) return; it.status = it.status === 'done' ? 'todo' : 'done'; it.doneAt = it.status === 'done' ? nowIso() : ''; await saveItem(it, true); route(); return; }
    const row = e.target.closest('[data-open]'); if (row) go('item/' + row.dataset.open);
    const ex = e.target.closest('[data-ex]'); if (ex) go('exhibitor/' + ex.dataset.ex);
    const ct = e.target.closest('[data-contact]'); if (ct) go('contact/' + ct.dataset.contact);
  });
}
function sortItems(arr) { return arr.slice().sort((a, b) => { const ta = timeMin(a.time), tb = timeMin(b.time); if (ta !== null && tb !== null && ta !== tb) return ta - tb; if (ta === null && tb !== null) return 1; if (tb === null && ta !== null) return -1; return (a.order || 0) - (b.order || 0); }); }

/* ---------- vue Plan ---------- */
views.plan = { search: true, render(day) {
  if (day && DAYS[day]) { S.day = day; setting('day', day); }
  const main = $('#main');
  const all = sortItems(S.items.filter(it => it.day === S.day && it.kind !== 'delegation'));
  const list = all.filter(it => matchQ(it, S.q));
  const done = all.filter(i => i.status === 'done').length, skipped = all.filter(i => i.status === 'skipped').length;
  const isToday = todayKey() === S.day; const nm = nowMin();
  let nextId = null; if (isToday) { const nx = all.find(i => i.status === 'todo' && timeMin(i.time) !== null && timeMin(i.time) >= nm - 10); nextId = nx ? nx.id : null; }
  if (!nextId) { const nx = all.find(i => i.status === 'todo'); nextId = nx ? nx.id : null; }
  setTitle(`${DAYS[S.day]} ${DAY_DATES[S.day]}`, `${done} fait${done > 1 ? 's' : ''} sur ${all.length}${skipped ? ` · ${skipped} sauté${skipped > 1 ? 's' : ''}` : ''}`);
  const seg = `<div class="seg days">${Object.keys(DAYS).map(k => `<button class="${k === S.day ? 'on' : ''}" data-day="${k}">${DAYS[k].slice(0, 3)}.<br><span style="font-weight:500;font-size:12px">${DAY_DATES[k]}</span></button>`).join('')}</div>`;
  const pct = all.length ? Math.round(100 * (done + skipped) / all.length) : 0;
  const prog = `<div class="card"><div class="pad"><div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-bottom:6px"><span>Progression</span><span>${pct} %</span></div><div class="progress"><div style="width:${pct}%"></div></div></div></div>`;
  const banner = installBanner();
  const rows = list.length ? list.map(it => itemRow(it, { next: it.id === nextId })).join('') : `<div class="empty">${S.q ? 'Aucun résultat.' : 'Rien de prévu ce jour. Ajoute un stand avec le bouton +.'}</div>`;
  main.innerHTML = banner + seg + prog + `<div class="card" id="list">${rows}</div><button class="fab" id="fab" aria-label="Ajouter un stand"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>`;
  $$('[data-day]', main).forEach(b => b.addEventListener('click', () => go('plan/' + b.dataset.day)));
  bindRows($('#list'));
  $('#fab').addEventListener('click', () => go('add'));
  bindBanner();
} };
function installBanner() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone || setting('hideInstall') === '1') return '';
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const how = ios ? 'Safari : bouton Partager, puis « Sur l’écran d’accueil ».' : 'Menu du navigateur (⋮), puis « Ajouter à l’écran d’accueil » ou « Installer l’application ».';
  return `<div class="banner"><b>Installer l’application</b>${how} Elle fonctionne ensuite hors ligne, en plein écran.<button class="linkbtn" id="hideInstall">Ne plus afficher</button></div>`;
}
function bindBanner() { const b = $('#hideInstall'); if (b) b.addEventListener('click', () => { setting('hideInstall', '1'); route(); }); }

/* ---------- vue Délégation ---------- */
views.delegation = { search: true, render() {
  const all = S.items.filter(it => it.kind === 'delegation').sort((a, b) => (a.order || 0) - (b.order || 0));
  const list = all.filter(it => matchQ(it, S.q));
  const met = all.filter(i => i.status === 'done').length;
  setTitle('Délégation canadienne', `${met} rencontré${met > 1 ? 's' : ''} sur ${all.length} · soirées et autobus`);
  const rows = list.map(it => { const cls = ['row', 'tap', it.status === 'done' ? 'done' : ''].join(' '); const n = S.contacts.filter(c => c.itemId === it.id).length;
    return `<div class="${cls}" data-open="${it.id}"><div class="main"><div class="t1">${esc(it.company)}</div><div class="t2">${esc(it.contactPlanned || '')}${it.time ? ' · ' + esc(it.time) : ''}</div><div class="t3">${it.priority === '1' ? '<span class="chip p1">P1</span> ' : ''}${n ? `<span class="chip">${n} contact${n > 1 ? 's' : ''}</span>` : ''}${it.nextStep ? ' <span class="chip">suivi</span>' : ''}</div></div><button class="checkwrap" data-check="${it.id}" aria-label="Rencontré"><span class="check ${it.status === 'done' ? 'on' : ''}">${checkSvg}</span></button></div>`; }).join('');
  $('#main').innerHTML = `<div class="hint" style="margin:0 4px 10px">Membres à rencontrer à l’hôtel, dans l’autobus et au lounge B7. Coche quand c’est fait; note le suivi dans la fiche.</div><div class="card" id="list">${rows || '<div class="empty">Aucun résultat.</div>'}</div><button class="fab" id="fab" aria-label="Ajouter une personne"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>`;
  bindRows($('#list'));
  $('#fab').addEventListener('click', () => go('add/delegation'));
} };

/* ---------- vue Exposants (réserve + catalogue) ---------- */
views.expo = { search: true, async render() {
  setTitle('Exposants', 'Réserve et catalogue complet (1 883)');
  const main = $('#main'); main.innerHTML = '<div class="empty">Chargement du catalogue…</div>';
  await loadCatalogue();
  const halls = ['A1','A2','A3','A4','A5','A6','A7','B1','B2','B3','B4','B5','B6','B7','B8','C1','C2','C3','C4','C5','C6','C7','D1','D2','D3','D4','D5','D6','D7','D8','Hall SUD'];
  const f = S.expoFilter; const q = S.q;
  const inPlan = new Map(S.items.filter(i => i.exhibitorId).map(i => [i.exhibitorId, i]));
  const resById = new Map(S.reserve.map(r => [r.exhibitorId, r]));
  let rows = '';
  let list;
  if (q) {
    const n = norm(q);
    list = S.catIndex.filter(x => x.n.includes(n) || (x.e.s && x.e.s.toUpperCase().includes(q.toUpperCase())) || (x.e.ps && norm(x.e.ps).includes(n))).map(x => x.e);
    if (f.hall) list = list.filter(e => e.h === f.hall);
    list = list.slice(0, 150);
  } else if (f.reserveOnly) {
    list = S.reserve.filter(r => !f.hall || r.hall === f.hall).sort((a, b) => (a.priority || '9').localeCompare(b.priority || '9') || a.hall.localeCompare(b.hall)).map(r => S.catById.get(r.exhibitorId)).filter(Boolean);
  } else {
    list = S.cat.exhibitors.filter(e => (!f.hall || e.h === f.hall) && e.k !== 'represented').sort((a, b) => a.n.localeCompare(b.n)).slice(0, 400);
  }
  rows = list.map(e => { const r = resById.get(e.id); const p = inPlan.get(e.id);
    const t3 = [r ? `<span class="chip reserve">Réserve${r.priority ? ' P' + esc(r.priority) : ''}</span>` : '', p ? `<span class="chip ${p.kind}">${p.day ? DAYS[p.day] : KIND_LABEL[p.kind]}${p.status === 'done' ? ' ✓' : ''}</span>` : '', r && r.objective ? `<span class="chip">Obj. ${esc(r.objective)}</span>` : ''].filter(Boolean).join(' ');
    return `<div class="row tap" data-ex="${e.id}"><div class="main"><div class="t1">${esc(e.n)}</div><div class="t2">${[e.s, country(e.c)].filter(Boolean).map(esc).join(' · ')}${e.ps ? ' · ' + esc(e.ps) : ''}</div>${t3 ? `<div class="t3">${t3}</div>` : ''}</div>${chevSvg}</div>`; }).join('');
  const pills = `<div class="pillrow"><button class="pill ${f.reserveOnly && !q ? 'on' : ''}" data-mode="reserve">Réserve (${S.reserve.length})</button><button class="pill ${!f.reserveOnly && !q ? 'on' : ''}" data-mode="all">Tous</button>${halls.map(h => `<button class="pill ${f.hall === h ? 'on' : ''}" data-hall="${h}">${h}</button>`).join('')}</div>`;
  main.innerHTML = pills + `<div class="card" id="list">${rows || '<div class="empty">Aucun exposant.</div>'}</div>${!q && !f.reserveOnly && list.length >= 400 ? '<div class="hint" style="margin:8px 4px">Liste limitée à 400. Utilise la recherche ou un pavillon.</div>' : ''}`;
  $$('[data-mode]', main).forEach(b => b.addEventListener('click', () => { f.reserveOnly = b.dataset.mode === 'reserve'; route(); }));
  $$('[data-hall]', main).forEach(b => b.addEventListener('click', () => { f.hall = f.hall === b.dataset.hall ? '' : b.dataset.hall; route(); }));
  bindRows($('#list'));
} };

views.exhibitor = { back: true, tab: 'expo', async render(id) {
  await loadCatalogue();
  const e = S.catById.get(id); if (!e) { $('#main').innerHTML = '<div class="empty">Exposant introuvable.</div>'; return; }
  const r = S.reserve.find(x => x.exhibitorId === id); const planned = S.items.filter(i => i.exhibitorId === id);
  setTitle(e.n, [e.s, country(e.c)].filter(Boolean).join(' · '));
  const sectors = (e.sec || []).map(c => S.cat.sectors[c] || c);
  const html = `<div class="hero"><h2>${esc(e.n)}</h2><div class="meta">${e.s ? `<span>Stand <b>${esc(e.s)}</b></span>` : ''}${e.c ? `<span>${esc(country(e.c))}</span>` : ''}${e.k === 'represented' ? '<span class="chip">Représentée</span>' : ''}</div>
    ${e.ps ? `<div class="info"><b>Produits et services${e.b ? ` (${esc(e.b.toLowerCase())})` : ''}</b>${esc(e.ps)}</div>` : ''}
    ${sectors.length ? `<div class="info"><b>Secteurs au catalogue</b>${sectors.map(esc).join(' · ')}</div>` : ''}
    ${r ? `<div class="info"><b>Réserve · priorité ${esc(r.priority || '')} · objectif ${esc(r.objective || '')}</b>${esc(r.what || '')}${r.angle ? `<div class="mt"><b>Angle</b>${esc(r.angle)}</div>` : ''}${r.when ? `<div class="mt"><b>Quand</b>${esc(r.when)}</div>` : ''}</div>` : ''}
    </div>
    ${planned.length ? `<div class="section-title">Dans le plan</div><div class="card" id="list">${planned.map(it => itemRow(it)).join('')}</div>` : ''}
    <div class="section-title">Ajouter au plan</div><div class="card"><div class="pad btnrow">${Object.keys(DAYS).map(k => `<button class="btn secondary" data-add="${k}">${DAYS[k]}</button>`).join('')}</div></div>`;
  $('#main').innerHTML = html;
  if (planned.length) bindRows($('#list'));
  $$('[data-add]', $('#main')).forEach(b => b.addEventListener('click', async () => {
    const it = newItem({ kind: 'ajout', userAdded: true, day: b.dataset.add, order: 900 + S.items.length, company: e.n, stand: e.s, hall: e.h, country: e.c, exhibitorId: e.id, what: e.ps || '', objective: r ? r.objective : '', priority: r ? r.priority : '', angle: r ? r.angle : '' });
    await dbPut('items', it); S.items.push(it); toast(`Ajouté à ${DAYS[it.day].toLowerCase()}`); go('item/' + it.id);
  }));
} };

/* ---------- ajout manuel ---------- */
views.add = { back: true, noTabs: true, render(kind) {
  const isDeleg = kind === 'delegation';
  setTitle(isDeleg ? 'Ajouter une personne' : 'Ajouter un stand');
  $('#main').innerHTML = `<div class="card">
    <div class="field"><label>${isDeleg ? 'Organisation' : 'Entreprise'}</label><input id="n-company" placeholder="${isDeleg ? 'Nom de l’organisation' : 'Nom de l’exposant'}" autocapitalize="words"></div>
    ${isDeleg ? '<div class="field"><label>Personne</label><input id="n-contact" placeholder="Prénom Nom" autocapitalize="words"></div>' : '<div class="field"><label>Stand</label><input id="n-stand" placeholder="ex. B5/204" autocapitalize="characters"></div>'}
    ${isDeleg ? '' : `<div class="field"><label>Jour</label><div class="seg" id="n-day">${Object.keys(DAYS).map(k => `<button class="${k === S.day ? 'on' : ''}" data-v="${k}">${DAYS[k]}</button>`).join('')}</div></div>`}
    ${isDeleg ? '' : '<div class="field"><label>Heure (facultatif)</label><input id="n-time" placeholder="ex. 11:40" inputmode="numeric"></div>'}
    <div id="n-match" class="hint" style="padding:0 16px 10px"></div>
    </div><button class="btn" id="n-create">Créer la fiche</button>`;
  let day = S.day;
  if (!isDeleg) $$('#n-day button').forEach(b => b.addEventListener('click', () => { day = b.dataset.v; $$('#n-day button').forEach(x => x.classList.toggle('on', x === b)); }));
  let matched = null;
  if (!isDeleg) { const inp = $('#n-company'); inp.addEventListener('input', debounce(async () => { await loadCatalogue(); const n = norm(inp.value); matched = null; const box = $('#n-match'); if (n.length < 3) { box.innerHTML = ''; return; } const hits = S.catIndex.filter(x => x.n.includes(n)).slice(0, 5); box.innerHTML = hits.length ? 'Au catalogue : ' + hits.map(h => `<button class="linkbtn" data-pick="${h.e.id}" style="display:block;text-align:left;padding:4px 0">${esc(h.e.n)} · ${esc(h.e.s)}</button>`).join('') : ''; $$('[data-pick]', box).forEach(b => b.addEventListener('click', () => { matched = S.catById.get(b.dataset.pick); inp.value = matched.n; $('#n-stand').value = matched.s || ''; box.innerHTML = `<span class="ok-text">Lié au catalogue : ${esc(matched.n)}</span>`; })); }, 200)); }
  $('#n-create').addEventListener('click', async () => {
    const company = $('#n-company').value.trim(); if (!company) { toast('Nom requis'); return; }
    const it = isDeleg ? newItem({ kind: 'delegation', userAdded: true, day: '', order: 900 + S.items.length, company, contactPlanned: $('#n-contact').value.trim() })
      : newItem({ kind: 'ajout', userAdded: true, day, order: 900 + S.items.length, company, stand: $('#n-stand').value.trim(), time: $('#n-time').value.trim(), exhibitorId: matched ? matched.id : '', hall: matched ? matched.h : '', country: matched ? matched.c : '', what: matched ? matched.ps : '' });
    await dbPut('items', it); S.items.push(it); history.replaceState(null, '', '#item/' + it.id); route();
  });
  setTimeout(() => $('#n-company').focus(), 50);
} };

/* ---------- fiche d'un élément ---------- */
const segBtn = (cur, v, label, cls = '') => `<button class="${cur === v ? 'on ' + cls : ''}" data-v="${v}">${label}</button>`;
views.item = { back: true, noTabs: true, async render(id) {
  const it = byId(S.items, id); if (!it) { $('#main').innerHTML = '<div class="empty">Fiche introuvable.</div>'; setTitle('Fiche'); return; }
  const isDeleg = it.kind === 'delegation';
  setTitle(it.company, [it.day ? DAYS[it.day] + ' ' + (it.time || '') : it.time, it.stand].filter(Boolean).join(' · '));
  const contacts = S.contacts.filter(c => c.itemId === it.id).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  const ex = it.exhibitorId && S.catById ? S.catById.get(it.exhibitorId) : null;
  const html = `
  <div class="hero"><h2>${esc(it.company)}</h2><div class="meta"><span class="chip ${it.kind}">${KIND_LABEL[it.kind]}</span>${it.stand ? `<span>Stand <b>${esc(it.stand)}</b></span>` : ''}${it.time ? `<span><b>${esc(it.time)}</b>${it.duration ? ' · ' + esc(it.duration) : ''}</span>` : ''}${it.contactPlanned ? `<span>${esc(it.contactPlanned)}</span>` : ''}${it.country ? `<span>${esc(country(it.country))}</span>` : ''}${it.priority === '1' ? '<span class="chip p1">Priorité 1</span>' : ''}</div>
    ${it.what ? `<div class="info"><b>Activité</b>${esc(it.what)}</div>` : ''}
    ${it.angle ? `<div class="info"><b>Angle${it.objective ? ' · objectif ' + esc(it.objective) : ''}</b>${esc(it.angle)}</div>` : (it.objective ? `<div class="info"><b>Objectif</b>${esc(it.objective)}</div>` : '')}
    ${it.exhibitorId ? `<details class="more"><summary>Fiche catalogue</summary><div class="hint mt" id="exbox">…</div></details>` : ''}
  </div>
  <div class="section-title">État</div>
  <div class="card"><div class="field"><div class="seg" id="st">${segBtn(it.status, 'todo', 'À faire')}${segBtn(it.status, 'done', isDeleg ? 'Rencontré' : 'Fait', 'ok')}${segBtn(it.status, 'skipped', 'Sauté', 'warn')}</div>${it.doneAt ? `<div class="hint mt">${isDeleg ? 'Rencontré' : 'Fait'} le ${esc(fmtDate(it.doneAt))}</div>` : ''}</div></div>
  <div class="section-title">Évaluation</div>
  <div class="card">
    <div class="field inline"><label>Potentiel</label><div class="seg" id="rating">${segBtn(it.rating, 'A', 'A', 'ok')}${segBtn(it.rating, 'B', 'B')}${segBtn(it.rating, 'C', 'C', 'bad')}</div></div>
    <div class="field"><label>Intérêt confirmé</label></div><div class="toggles" style="padding-top:0"><button class="toggle ${it.intAgent ? 'on' : ''}" data-t="intAgent">Agent manufacturier</button><button class="toggle ${it.intMay ? 'on' : ''}" data-t="intMay">MAY</button><button class="toggle ${it.intQuad ? 'on' : ''}" data-t="intQuad">Quadralis</button></div>
    ${isDeleg ? '' : `<div class="field inline"><label>Présent au Canada</label><div class="seg" id="inCanada">${segBtn(it.inCanada, 'oui', 'Oui')}${segBtn(it.inCanada, 'non', 'Non')}${segBtn(it.inCanada, '?', '?')}</div></div>
    <div class="field inline"><label>Ouvert à un fixe</label><div class="seg" id="fixOk">${segBtn(it.fixOk, 'oui', 'Oui', 'ok')}${segBtn(it.fixOk, 'non', 'Non', 'bad')}${segBtn(it.fixOk, '?', '?')}</div></div>`}
    <div class="field"><label>Prochaine étape</label><input data-f="nextStep" value="${esc(it.nextStep)}" placeholder="ex. appel la semaine du 10 nov., envoyer NDA, visite Québec"></div>
    <div class="field"><label>Date du suivi</label><input data-f="nextDate" type="date" value="${esc(it.nextDate)}"></div>
    <div class="field"><label>Notes</label><textarea data-f="notes" placeholder="Ce qui a été dit, chiffres, qui décide, objections…">${esc(it.notes)}</textarea></div>
    <div class="saved" id="savedFlag"></div>
  </div>
  <div class="section-title">Contacts et cartes d’affaires</div>
  <div class="card">
    ${contacts.map(contactRow).join('') || '<div class="empty" style="padding:16px">Aucun contact. Scanne la carte : les champs se remplissent, tu corriges, c’est enregistré.</div>'}
    <div class="pad" style="padding-bottom:10px"><button class="btn" id="scanCam"><svg viewBox="0 0 24 24"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="12" cy="13.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>Scanner une carte d’affaires</button></div>
    <div style="padding:0 16px 14px" class="btnrow"><button class="btn secondary" id="scanGal">Photo existante</button><button class="btn ghost" id="addManual">Saisir à la main</button></div>
  </div>
  ${isDeleg ? '' : `<div class="section-title">Détails</div><div class="card">
    <div class="field"><label>Stand</label><input data-f="stand" value="${esc(it.stand)}" autocapitalize="characters"></div>
    <div class="field"><label>Heure</label><input data-f="time" value="${esc(it.time)}" placeholder="ex. 11:40" inputmode="numeric"></div>
    <div class="field"><label>Jour</label><div class="seg" id="dayseg">${Object.keys(DAYS).map(k => segBtn(it.day, k, DAYS[k])).join('')}</div></div>
    <div class="field"><label>Personne attendue</label><input data-f="contactPlanned" value="${esc(it.contactPlanned)}" autocapitalize="words"></div>
  </div>`}
  ${it.userAdded ? `<div class="card"><div class="pad"><button class="btn danger" id="delItem">Supprimer cette fiche</button></div></div>` : ''}`;
  const main = $('#main'); main.innerHTML = html;
  if (ex || it.exhibitorId) { loadCatalogue().then(() => { const e = S.catById.get(it.exhibitorId); const box = $('#exbox'); if (!e || !box) return; const sec = (e.sec || []).map(c => S.cat.sectors[c] || c); box.innerHTML = `${e.ps ? esc(e.ps) + (e.b ? ` <span class="muted">(${esc(e.b.toLowerCase())})</span>` : '') + '<br>' : ''}${sec.map(esc).join(' · ')}<br><button class="linkbtn" data-ex="${e.id}" style="padding-left:0">Ouvrir la fiche catalogue</button>`; $('[data-ex]', box).addEventListener('click', () => go('exhibitor/' + e.id)); }); }
  const seg = (sel, key, after) => $$(sel + ' button').forEach(b => b.addEventListener('click', () => { it[key] = it[key] === b.dataset.v && key !== 'status' && key !== 'day' ? '' : b.dataset.v; if (key === 'status') it.doneAt = it.status === 'done' ? nowIso() : ''; saveItem(it, true); if (after) after(); route(); }));
  seg('#st', 'status'); seg('#rating', 'rating'); if (!isDeleg) { seg('#inCanada', 'inCanada'); seg('#fixOk', 'fixOk'); seg('#dayseg', 'day'); }
  $$('[data-t]', main).forEach(b => b.addEventListener('click', () => { it[b.dataset.t] = !it[b.dataset.t]; b.classList.toggle('on', it[b.dataset.t]); saveItem(it, true); }));
  $$('[data-f]', main).forEach(inp => inp.addEventListener('input', () => { it[inp.dataset.f] = inp.value; saveItem(it); }));
  $$('[data-f]', main).forEach(inp => inp.addEventListener('change', () => { it[inp.dataset.f] = inp.value; saveItem(it, true); if (inp.dataset.f === 'time' || inp.dataset.f === 'stand') setTitle(it.company, [it.day ? DAYS[it.day] + ' ' + (it.time || '') : it.time, it.stand].filter(Boolean).join(' · ')); }));
  $('#scanCam').addEventListener('click', () => startScan(it, 'cam'));
  $('#scanGal').addEventListener('click', () => startScan(it, 'gal'));
  $('#addManual').addEventListener('click', async () => { const c = { id: uid(), itemId: it.id, name: '', title: '', company: it.company, email: '', phone: '', mobile: '', website: '', address: '', notes: '', photoId: '', source: 'manuel', createdAt: nowIso() }; await saveContact(c); go('contact/' + c.id); });
  main.addEventListener('click', e => { const ct = e.target.closest('[data-contact]'); if (ct) go('contact/' + ct.dataset.contact); });
  contacts.forEach(c => { if (c.photoId) loadPhotoUrl(c.photoId).then(u => { const img = $(`[data-thumb="${c.photoId}"]`); if (img && u) img.src = u; }); });
  const del = $('#delItem'); if (del) del.addEventListener('click', async () => { if (!confirm2('Supprimer cette fiche et ses contacts ?')) return; for (const c of contacts) { if (c.photoId) await dbDel('photos', c.photoId); await dbDel('contacts', c.id); } S.contacts = S.contacts.filter(c => c.itemId !== it.id); await dbDel('items', it.id); S.items = S.items.filter(x => x.id !== it.id); toast('Fiche supprimée'); go(isDeleg ? 'delegation' : 'plan/' + (it.day || S.day)); });
} };
function contactRow(c) {
  const initials = (c.name || c.company || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const vis = c.photoId ? `<img class="thumb" data-thumb="${c.photoId}" alt="">` : `<div class="avatar">${esc(initials)}</div>`;
  return `<div class="contact row tap" data-contact="${c.id}" style="border-top:1px solid var(--line)">${vis}<div class="main"><div class="t1">${esc(c.name || '(sans nom)')}</div><div class="t2">${esc([c.title, c.company].filter(Boolean).join(' · '))}</div><div class="t3">${esc([c.email, c.mobile || c.phone].filter(Boolean).join(' · '))}</div></div>${chevSvg}</div>`;
}

/* ---------- fiche contact ---------- */
views.contact = { back: true, noTabs: true, async render(id) {
  const c = byId(S.contacts, id); if (!c) { $('#main').innerHTML = '<div class="empty">Contact introuvable.</div>'; setTitle('Contact'); return; }
  const it = byId(S.items, c.itemId);
  setTitle(c.name || 'Contact', it ? it.company : c.company);
  const F = (k, label, ph, type = 'text', extra = '') => `<div class="field"><label>${label}</label><input data-c="${k}" type="${type}" value="${esc(c[k])}" placeholder="${ph}" ${extra}></div>`;
  $('#main').innerHTML = `
  ${c.photoId ? `<div class="card"><div class="pad"><img class="cardimg" id="cardimg" alt="Carte d’affaires"></div></div>` : ''}
  <div class="card">
    ${F('name', 'Nom', 'Prénom Nom', 'text', 'autocapitalize="words"')}
    ${F('title', 'Titre / fonction', 'ex. Export Manager')}
    ${F('company', 'Entreprise', 'Entreprise', 'text', 'autocapitalize="words"')}
    ${F('email', 'Courriel', 'nom@entreprise.com', 'email', 'autocapitalize="off" inputmode="email"')}
    ${F('mobile', 'Mobile', '+39 …', 'tel', 'inputmode="tel"')}
    ${F('phone', 'Téléphone', '+39 …', 'tel', 'inputmode="tel"')}
    ${F('website', 'Site web', 'www.entreprise.com', 'text', 'autocapitalize="off" inputmode="url"')}
    ${F('address', 'Adresse', 'Ville, pays')}
    <div class="field"><label>Notes sur la personne</label><textarea data-c="notes" placeholder="Rôle dans la décision, langue, ce qu’il attend…">${esc(c.notes)}</textarea></div>
    <div class="saved" id="savedFlag"></div>
  </div>
  ${c.ocrText ? `<details class="more card" style="padding:0 16px 12px"><summary>Texte lu sur la carte</summary><div class="ocr mt">${esc(c.ocrText)}</div></details>` : ''}
  <div class="card"><div class="pad" style="padding-bottom:10px"><button class="btn secondary" id="vcf">Enregistrer dans les contacts du téléphone</button></div>${it ? `<div style="padding:0 16px 10px"><button class="btn secondary" id="toItem">Retour à la fiche ${esc(it.company)}</button></div>` : ''}<div style="padding:0 16px 14px" class="btnrow"><button class="btn ghost" id="rescan">Re-scanner</button><button class="btn danger" id="delC">Supprimer</button></div></div>`;
  if (c.photoId) loadPhotoUrl(c.photoId).then(u => { const img = $('#cardimg'); if (img && u) img.src = u; });
  const save = debounce(() => saveContact(c), 500);
  $$('[data-c]').forEach(inp => inp.addEventListener('input', () => { c[inp.dataset.c] = inp.value; save(); if (inp.dataset.c === 'name') $('#title').textContent = c.name || 'Contact'; }));
  $$('[data-c]').forEach(inp => inp.addEventListener('change', () => { c[inp.dataset.c] = inp.value; saveContact(c); }));
  if (it) $('#toItem').addEventListener('click', () => go('item/' + it.id));
  $('#vcf').addEventListener('click', () => deliver(new Blob([vcard([c])], { type: 'text/vcard' }), (c.name || 'contact').replace(/[^\w\- ]/g, '') + '.vcf', 'text/vcard'));
  $('#rescan').addEventListener('click', () => startScan(it || { id: c.itemId, company: c.company }, 'cam', c));
  $('#delC').addEventListener('click', async () => { if (!confirm2('Supprimer ce contact ?')) return; if (c.photoId) { await dbDel('photos', c.photoId); S.urls.delete(c.photoId); } await dbDel('contacts', c.id); S.contacts = S.contacts.filter(x => x.id !== c.id); toast('Contact supprimé'); go(it ? 'item/' + it.id : 'contacts'); });
} };

/* ---------- vue Contacts ---------- */
views.contacts = { search: true, render() {
  const list = S.contacts.filter(c => !S.q || norm([c.name, c.company, c.title, c.email, c.notes].join(' ')).includes(norm(S.q))).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  setTitle('Contacts', `${S.contacts.length} contact${S.contacts.length > 1 ? 's' : ''} · ${S.contacts.filter(c => c.photoId).length} carte${S.contacts.filter(c => c.photoId).length > 1 ? 's' : ''}`);
  $('#main').innerHTML = `<div class="card" id="list">${list.map(contactRow).join('') || '<div class="empty">Aucun contact. Les cartes scannées dans les fiches apparaissent ici.</div>'}</div>${S.contacts.length ? `<div class="btnrow"><button class="btn secondary" id="allVcf">Exporter tous (vCard)</button><button class="btn secondary" id="allCsv">Exporter (CSV)</button></div>` : ''}`;
  bindRows($('#list'));
  list.forEach(c => { if (c.photoId) loadPhotoUrl(c.photoId).then(u => { const img = $(`[data-thumb="${c.photoId}"]`); if (img && u) img.src = u; }); });
  const v = $('#allVcf'); if (v) v.addEventListener('click', () => deliver(new Blob([vcard(S.contacts)], { type: 'text/vcard' }), 'Ecomondo-2026-contacts.vcf', 'text/vcard'));
  const cs = $('#allCsv'); if (cs) cs.addEventListener('click', () => deliver(new Blob(['\ufeff' + csv(contactsTable())], { type: 'text/csv' }), 'Ecomondo-2026-contacts.csv', 'text/csv'));
} };

/* ---------- vue Rapport ---------- */
views.rapport = { render() {
  dbAll('photos').then(p => { S.photoCache = p; }).catch(() => {});
  const it = S.items.filter(i => i.kind !== 'delegation'); const dl = S.items.filter(i => i.kind === 'delegation');
  const done = it.filter(i => i.status === 'done'); const A = done.filter(i => i.rating === 'A').length, B = done.filter(i => i.rating === 'B').length;
  const follow = S.items.filter(i => i.nextStep).sort((a, b) => (a.nextDate || '9').localeCompare(b.nextDate || '9'));
  const fixe = it.filter(i => i.fixOk === 'oui').length;
  setTitle('Rapport', `${done.length} stand${done.length > 1 ? 's' : ''} rencontré${done.length > 1 ? 's' : ''} · ${S.contacts.length} contact${S.contacts.length > 1 ? 's' : ''}`);
  const tile = (n, l) => `<div class="tile"><div class="n">${n}</div><div class="l">${l}</div></div>`;
  $('#main').innerHTML = `
  <div class="tiles">${tile(done.length + '/' + it.length, 'stands faits')}${tile(dl.filter(i => i.status === 'done').length + '/' + dl.length, 'délégation')}${tile(A, 'potentiel A')}${tile(B, 'potentiel B')}${tile(it.filter(i => i.intAgent).length, 'agent')}${tile(it.filter(i => i.intMay).length, 'MAY')}${tile(it.filter(i => i.intQuad).length, 'Quadralis')}${tile(fixe, 'ouverts au fixe')}${tile(S.contacts.length, 'contacts')}</div>
  <div class="section-title">Exporter</div>
  <div class="card"><div class="pad" style="display:grid;gap:10px">
    <button class="btn" id="xlsx">Rapport Excel (rencontres, contacts, suivis)</button>
    <button class="btn secondary" id="vcfAll">Contacts pour le téléphone (vCard)</button>
    <button class="btn secondary" id="backup">Sauvegarde complète (JSON avec photos)</button>
    <div class="hint">Les fichiers passent par la feuille de partage du téléphone : Mail, Fichiers, AirDrop, etc. La sauvegarde JSON se réimporte dans Réglages et peut m’être envoyée pour produire les rapports de suivi.</div>
  </div></div>
  <div class="section-title">Suivis à faire (${follow.length})</div>
  <div class="card" id="list1">${follow.map(i => `<div class="row tap" data-open="${i.id}"><div class="main"><div class="t1">${esc(i.company)}</div><div class="t2">${esc(i.nextStep)}</div><div class="t3">${i.nextDate ? 'Pour le ' + esc(i.nextDate) + ' · ' : ''}${i.rating ? `<span class="chip ${i.rating}">${i.rating}</span> ` : ''}${[i.intAgent ? 'Agent' : '', i.intMay ? 'MAY' : '', i.intQuad ? 'Quadralis' : ''].filter(Boolean).join(', ')}</div></div>${chevSvg}</div>`).join('') || '<div class="empty">Aucun suivi noté pour l’instant.</div>'}</div>
  <div class="section-title">Potentiel A et B (${done.filter(i => i.rating === 'A' || i.rating === 'B').length})</div>
  <div class="card" id="list2">${done.filter(i => i.rating === 'A' || i.rating === 'B').sort((a, b) => a.rating.localeCompare(b.rating)).map(i => itemRow(i)).join('') || '<div class="empty">Rien d’évalué A ou B pour l’instant.</div>'}</div>
  <div class="section-title">Pas encore faits (${it.filter(i => i.status === 'todo').length})</div>
  <div class="card" id="list3">${sortItems(it.filter(i => i.status === 'todo')).sort(dayCmp).slice(0, 60).map(i => `<div class="row tap" data-open="${i.id}"><div class="time">${esc(i.day ? DAYS[i.day].slice(0, 3) + '.' : '')}<small>${esc(i.time || '')}</small></div><div class="main"><div class="t1">${esc(i.company)}</div><div class="t2">${esc([i.stand, KIND_LABEL[i.kind]].filter(Boolean).join(' · '))}</div></div>${chevSvg}</div>`).join('') || '<div class="empty">Tout est fait.</div>'}</div>
  <div class="section-title">Infos pratiques</div><div class="card"><div class="pad"><button class="linkbtn" id="toInfo" style="padding:0">Horaires, lounges, repas, signature des rencontres, les 3 questions</button></div></div>`;
  ['#list1', '#list2', '#list3'].forEach(s => bindRows($(s)));
  $('#xlsx').addEventListener('click', exportXlsx);
  $('#vcfAll').addEventListener('click', () => deliver(new Blob([vcard(S.contacts)], { type: 'text/vcard' }), 'Ecomondo-2026-contacts.vcf', 'text/vcard'));
  $('#backup').addEventListener('click', exportBackup);
  $('#toInfo').addEventListener('click', () => go('info'));
} };

views.info = { back: true, tab: 'rapport', render() { setTitle('Infos pratiques', 'Buyers Program ECO26'); $('#main').innerHTML = `<div class="card">${INFO_BLOCKS.map(([k, v]) => `<div class="pad" style="border-top:1px solid var(--line)"><b style="display:block;margin-bottom:4px">${esc(k)}</b><div class="hint" style="color:var(--text)">${esc(v)}</div></div>`).join('')}</div><div class="hint" style="margin:4px">Source : Buyers Program ECO26 (IEG, International Buyers Community Dpt.) et plan de match du 1er novembre 2026.</div>`; } };

/* ---------- réglages ---------- */
views.settings = { back: true, noTabs: true, render() {
  dbAll('photos').then(p => { S.photoCache = p; }).catch(() => {});
  setTitle('Réglages', 'Version ' + APP_VERSION);
  const ai = setting('aiKey') || ''; const model = setting('aiModel') || 'claude-haiku-5-5';
  $('#main').innerHTML = `
  <div class="section-title">Lecture des cartes d’affaires</div>
  <div class="card">
    <div class="pad hint">Par défaut, la lecture se fait sur l’appareil (reconnaissance de texte intégrée, aucune donnée envoyée). Avec une clé API Anthropic, la carte est lue par Claude : extraction plus fiable des noms, titres et numéros. La clé reste sur cet appareil.</div>
    <div class="field"><label>Clé API Anthropic (facultatif)</label><input id="aiKey" type="password" value="${esc(ai)}" placeholder="sk-ant-…" autocapitalize="off" autocomplete="off"></div>
    <div class="field"><label>Modèle</label><input id="aiModel" value="${esc(model)}" autocapitalize="off"></div>
    <div class="pad"><button class="btn secondary" id="warm">Préparer la lecture hors ligne (télécharge le moteur, ~15 Mo)</button><div class="hint mt" id="warmStatus"></div></div>
  </div>
  <div class="section-title">Données</div>
  <div class="card"><div class="pad" style="display:grid;gap:10px">
    <button class="btn secondary" id="exp">Exporter la sauvegarde (JSON)</button>
    <button class="btn secondary" id="imp">Importer une sauvegarde</button>
    <div class="hint" id="storageInfo">…</div>
    <button class="btn danger" id="reset">Réinitialiser au plan initial (efface tout)</button>
  </div></div>
  <div class="section-title">Application</div>
  <div class="card"><div class="pad" style="display:grid;gap:10px">
    <button class="btn ghost" id="reload">Recharger (mise à jour)</button>
    <div class="hint">Mode : ${window.matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 'installée (plein écran)' : 'navigateur'} · ${navigator.onLine ? 'en ligne' : 'hors ligne'} · moteur de lecture ${setting('ocrReady') === '1' ? 'prêt' : 'pas encore téléchargé'}</div>
  </div></div>`;
  $('#aiKey').addEventListener('change', () => { setting('aiKey', $('#aiKey').value.trim()); toast('Clé enregistrée'); });
  $('#aiModel').addEventListener('change', () => setting('aiModel', $('#aiModel').value.trim()));
  $('#warm').addEventListener('click', async () => { const st = $('#warmStatus'); st.textContent = 'Téléchargement…'; try { await getOcrWorker(p => { st.textContent = p; }); st.textContent = 'Moteur prêt. La lecture fonctionne hors ligne.'; } catch (e) { st.textContent = 'Échec : ' + e.message; } });
  $('#exp').addEventListener('click', exportBackup);
  $('#imp').addEventListener('click', () => $('#jsonIn').click());
  $('#reset').addEventListener('click', async () => { if (!confirm2('Tout effacer : fiches, notes, contacts, photos. Continuer ?')) return; if (!confirm2('Dernière confirmation : effacer toutes les données ?')) return; for (const s of ['items', 'contacts', 'photos', 'meta']) await dbClear(s); S.urls.clear(); await seedIfNeeded(); await loadAll(); toast('Plan réinitialisé'); go('plan/' + S.day); });
  $('#reload').addEventListener('click', () => location.reload());
  if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { const el = $('#storageInfo'); if (el) el.textContent = `${S.items.length} fiches, ${S.contacts.length} contacts, ${S.contacts.filter(c => c.photoId).length} photos · ${(e.usage / 1048576).toFixed(1)} Mo utilisés`; }).catch(() => {});
} };
$('#jsonIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const data = JSON.parse(await f.text()); if (!data.items) throw new Error('format');
    if (!confirm2(`Importer ${data.items.length} fiches, ${(data.contacts || []).length} contacts et ${(data.photos || []).length} photos ? Les données actuelles seront remplacées.`)) return;
    for (const s of ['items', 'contacts', 'photos']) await dbClear(s);
    for (const it of data.items) await dbPut('items', it);
    for (const c of data.contacts || []) await dbPut('contacts', c);
    for (const p of data.photos || []) { const bin = atob(p.data); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); await dbPut('photos', { id: p.id, type: p.type, data: arr.buffer, createdAt: p.createdAt }); }
    await dbPut('meta', { k: 'seed', version: data.version || 1, at: nowIso() });
    S.urls.clear(); await loadAll(); toast('Sauvegarde importée'); go('plan/' + S.day);
  } catch (err) { toast('Fichier invalide'); console.error(err); }
});

/* ---------- scan de cartes ---------- */
let scanCtx = null;
function startScan(item, mode, existingContact) { scanCtx = { item, existingContact }; (mode === 'cam' ? $('#camIn') : $('#galIn')).click(); }
$('#camIn').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleCard(f); });
$('#galIn').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleCard(f); });
let cancelScan = false;
$('#overlayCancel').addEventListener('click', () => { cancelScan = true; hideOverlay(); });
function showOverlay(t, p) { $('#overlay').classList.remove('hidden'); $('#overlayText').textContent = t; $('#overlayBar').style.width = (p || 0) + '%'; }
function hideOverlay() { $('#overlay').classList.add('hidden'); }
async function handleCard(file) {
  const ctx = scanCtx; if (!ctx) return; cancelScan = false;
  showOverlay('Préparation de la photo…', 5);
  let photo, ocrCanvas;
  try { ({ photo, ocrCanvas } = await prepareImage(file)); } catch (e) { hideOverlay(); toast('Photo illisible'); console.error(e); return; }
  const photoId = uid();
  await dbPut('photos', { id: photoId, type: 'image/jpeg', data: await photo.arrayBuffer(), createdAt: nowIso() }); S.photoCache = null;
  if (cancelScan) return;
  let fields = {}, text = '';
  try {
    if (setting('aiKey')) { showOverlay('Lecture par Claude…', 30); fields = await aiExtract(photo); text = fields.raw || ''; }
    else { const w = await getOcrWorker(p => showOverlay(p, 20)); if (cancelScan) return; showOverlay('Lecture du texte…', 40); const res = await w.recognize(ocrCanvas); text = res.data.text || ''; fields = parseCard(text, ctx.item); }
  } catch (e) { console.error(e); toast('Lecture impossible : ' + (e.message || e)); fields = { raw: '' }; }
  if (cancelScan) return;
  hideOverlay();
  let c = ctx.existingContact;
  if (c) { if (c.photoId) { await dbDel('photos', c.photoId); S.urls.delete(c.photoId); } c.photoId = photoId; for (const k of ['name', 'title', 'company', 'email', 'phone', 'mobile', 'website', 'address']) if (fields[k] && !c[k]) c[k] = fields[k]; c.ocrText = text; }
  else c = { id: uid(), itemId: ctx.item.id, name: fields.name || '', title: fields.title || '', company: fields.company || ctx.item.company || '', email: fields.email || '', phone: fields.phone || '', mobile: fields.mobile || '', website: fields.website || '', address: fields.address || '', notes: '', photoId, ocrText: text, source: setting('aiKey') ? 'ia' : 'ocr', createdAt: nowIso() };
  await saveContact(c);
  if (fields.exhibitorId && ctx.item && !ctx.item.exhibitorId && byId(S.items, ctx.item.id)) { const it = byId(S.items, ctx.item.id); it.exhibitorId = fields.exhibitorId; saveItem(it, true); }
  toast(fields.name ? 'Carte lue : vérifie les champs' : 'Carte enregistrée : complète les champs');
  go('contact/' + c.id);
}
function loadImg(file) { return new Promise((res, rej) => { const u = URL.createObjectURL(file); const im = new Image(); im.onload = () => { res(im); }; im.onerror = rej; im.src = u; }); }
async function prepareImage(file) {
  let bmp = null;
  if (window.createImageBitmap) { try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { bmp = null; } }
  const src = bmp || await loadImg(file);
  const W = src.width, H = src.height;
  const draw = (maxW) => { const s = Math.min(1, maxW / Math.max(W, H)); const c = document.createElement('canvas'); c.width = Math.round(W * s); c.height = Math.round(H * s); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c; };
  const pc = draw(1600);
  const photo = await new Promise(r => pc.toBlob(r, 'image/jpeg', 0.82));
  const oc = draw(2000); const g = oc.getContext('2d'); const d = g.getImageData(0, 0, oc.width, oc.height); const px = d.data;
  let min = 255, max = 0; const hist = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) { const y = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000 | 0; px[i] = y; hist[y]++; }
  let acc = 0, n = px.length / 4; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.01) { min = v; break; } } acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.01) { max = v; break; } }
  const range = Math.max(1, max - min);
  for (let i = 0; i < px.length; i += 4) { let y = (px[i] - min) * 255 / range; y = y < 0 ? 0 : y > 255 ? 255 : y; px[i] = px[i + 1] = px[i + 2] = y; }
  g.putImageData(d, 0, 0);
  if (bmp && bmp.close) bmp.close();
  return { photo, ocrCanvas: oc };
}
let ocrWorker = null, ocrPromise = null;
function getOcrWorker(onProgress) {
  if (ocrWorker) return Promise.resolve(ocrWorker);
  if (ocrPromise) return ocrPromise;
  if (!window.Tesseract) return Promise.reject(new Error('Moteur de lecture non chargé'));
  const base = new URL('lib/', location.href).href;
  ocrPromise = (async () => {
    const w = await Tesseract.createWorker('eng', 1, { workerPath: base + 'worker.min.js', corePath: base + 'core', langPath: base + 'lang', gzip: true, cacheMethod: 'write', logger: m => { if (onProgress) { const map = { 'loading tesseract core': 'Chargement du moteur', 'initializing tesseract': 'Initialisation', 'loading language traineddata': 'Chargement du modèle (une seule fois)', 'initializing api': 'Préparation', 'recognizing text': 'Lecture du texte' }; const lbl = map[m.status] || m.status; onProgress(`${lbl}… ${m.progress ? Math.round(m.progress * 100) + ' %' : ''}`); } } });
    await w.setParameters({ tessedit_pageseg_mode: '3', preserve_interword_spaces: '1' });
    ocrWorker = w; setting('ocrReady', '1'); return w;
  })();
  ocrPromise.catch(() => { ocrPromise = null; });
  return ocrPromise;
}
const TITLE_RE = /\b(manager|director|direttore|direttrice|responsabile|head of|chief|ceo|cfo|coo|cto|president|presidente|vice|vp|sales|vendite|export|commerciale|business|development|sviluppo|marketing|engineer|ingegnere|ing\.|dott\.|dr\.|area|account|key|technical|tecnico|product|project|owner|titolare|founder|fondatore|amministratore|partner|consultant|consulente|international|estero|purchasing|acquisti|r&d|quality|qualità|operations|general|generale|manager|customer|service|specialist|coordinator|coordinatore|representative|agent|agente|chairman|managing|executive|officer|supervisor|leader)\b/i;
const ADDR_RE = /\b(via|viale|piazza|piazzale|corso|strada|str\.|localit|loc\.|zona|z\.i\.|street|st\.|road|rd\.|avenue|ave\.|boulevard|blvd|km\s?\d|s\.s\.|s\.p\.|fraz\.|frazione|c\.so|p\.zza|\d{5}\b|\b[A-Z]{2}\s?\d{5}\b|italy|italia|germany|deutschland|france|españa|spain|austria|switzerland|schweiz|nederland|belgium|belgique|p\.o\. box)\b/i;
const LEGAL_RE = /\b(s\.?r\.?l\.?|s\.?p\.?a\.?|s\.?a\.?s\.?|gmbh|ag|ltd|llc|inc\.?|s\.?a\.?|b\.?v\.?|a\.?s\.?|oy|ab|sp\. z o\.o\.|s\.r\.o\.|unipersonale|societ[àa]|group|gruppo|industrie|industries|impianti|technologies|technology|engineering|systems|solutions|machines|machinery|macchine)\b/i;
function parseCard(text, item) {
  const rawLines = text.split('\n').map(l => (/@|www|http/i.test(l) ? l.replace(/\|/g, 'l').replace(/[_~`]/g, '') : l.replace(/[|_~`]/g, ' ')).replace(/\s+/g, ' ').trim()).filter(l => l.length > 1);
  const out = { raw: text, name: '', title: '', company: '', email: '', phone: '', mobile: '', website: '', address: '' };
  const used = new Set();
  const emails = [], phones = [], mobiles = [], webs = [], addrs = [], titles = [], cands = [];
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i]; const low = l.toLowerCase();
    const wb0 = l.match(/\b(?:https?:\/\/)?www\.[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?/i); if (wb0) webs.push(wb0[0].replace(/^https?:\/\//i, '').toLowerCase());
    const em = l.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g); if (em) { emails.push(...em.map(x => x.toLowerCase())); used.add(i); continue; }
    const ph = Array.from(l.matchAll(/(?:\+|00)?\d[\d\s().\/-]{6,}\d/g));
    if (ph.some(m => m[0].replace(/\D/g, '').length >= 8) && !/\b(p\.?\s?iva|vat|c\.?f\.?|cap|iban|rea)\b/i.test(l)) {
      for (const m of ph) { const p = m[0]; if (p.replace(/\D/g, '').length < 8) continue; const clean = p.replace(/[^\d+()\s.-]/g, '').replace(/\s+/g, ' ').trim(); const before = l.slice(Math.max(0, m.index - 14), m.index).toLowerCase(); const digits = clean.replace(/\D/g, '');
        const isMob = /\b(mob|cell|mobile|cel|handy|gsm|portable)\b|(^|\s)m\.?\s*$/.test(before) || /^(39)?3\d{8,9}$/.test(digits) || /^(33)?[67]\d{8}$/.test(digits) || /^(49)?1[5-7]\d{8,9}$/.test(digits) || /^(34)?[67]\d{8}$/.test(digits);
        (isMob ? mobiles : phones).push(clean); }
      used.add(i); continue; }
    const wb = l.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|it|eu|net|org|de|fr|es|ch|at|nl|be|co|io|info|biz|ca|uk|se|dk|no|fi|pl|cz|pt|tr|cn|group|tech|energy|eco|solutions)\b(?:\/\S*)?/i);
    if (wb && !/@/.test(l)) { webs.push(wb[0].replace(/^https?:\/\//i, '').toLowerCase()); if (l.length - wb[0].length < 8) { used.add(i); continue; } }
    if (ADDR_RE.test(l) && /\d/.test(l) || /\b\d{5}\b/.test(l) && /[A-Za-z]{3,}/.test(l)) { addrs.push(l); used.add(i); continue; }
    if (TITLE_RE.test(l) && !LEGAL_RE.test(l) && l.length < 60) { titles.push(l); used.add(i); continue; }
    cands.push({ i, l });
  }
  out.email = emails[0] || ''; out.phone = phones[0] || ''; out.mobile = mobiles[0] || ''; out.website = webs[0] || ''; out.address = addrs.slice(0, 2).join(', '); out.title = titles[0] || '';
  // entreprise : correspondance avec le catalogue, sinon suffixe légal, sinon domaine du courriel
  let company = '', exhibitorId = '';
  const honorRe = /^(ing\.?|dott\.?|dott\.ssa|dr\.?|mr\.?|mrs\.?|ms\.?|sig\.?|sig\.ra|prof\.?|arch\.?|geom\.?|avv\.?)\s+/i;
  const domain = (out.email.split('@')[1] || out.website.replace(/^www\./, '').split('/')[0] || '').split('.')[0].replace(/[^a-z0-9]/gi, '');
  if (S.catIndex) {
    const companyCands = cands.filter(c => !honorRe.test(c.l));
    let best = null, bestScore = 0;
    for (const { i, l } of companyCands) { const n = norm(l); if (n.length < 4) continue; const toks = n.split(' ').filter(t => t.length > 1);
      for (const x of S.catIndex) { if (!x.n || x.n.length < 4) continue;
        let score = 0;
        if (x.n === n || (n.length >= 6 && (x.n.includes(n) || n.includes(x.n)) && Math.min(n.length, x.n.length) / Math.max(n.length, x.n.length) >= 0.5)) score = 1;
        else if (toks.length && x.toks.length) { const hits = x.toks.filter(t => toks.includes(t)); const strong = hits.filter(t => t.length >= 5 && (S.df.get(t) || 0) <= 3).length; const covX = hits.length / x.toks.length, covL = hits.length / toks.length;
          if (hits.length >= 2 && covX >= 0.6 && covL >= 0.6) score = 0.8 + 0.1 * (covX + covL) / 2;
          else if (hits.length === 1 && strong === 1 && x.toks.length === 1 && toks.length <= 2) score = 0.8; }
        if (score > bestScore) { bestScore = score; best = { x, i }; } } }
    if (best && bestScore >= 0.75) { company = best.x.e.n; exhibitorId = best.x.e.id; used.add(best.i); }
    if (!company && domain.length >= 5) { const hit = S.catIndex.find(x => x.n.replace(/\s/g, '') === domain.toUpperCase()) || S.catIndex.find(x => x.n.replace(/\s/g, '').startsWith(domain.toUpperCase())); if (hit) { company = hit.e.n; exhibitorId = hit.e.id; } }
  }
  if (!company) { const lc = cands.find(c => LEGAL_RE.test(c.l) && !TITLE_RE.test(c.l)); if (lc) { company = lc.l.replace(/[!?;:*#«»"]/g, '').replace(/\s+/g, ' ').trim(); used.add(lc.i); } }
  if (!company && item && item.company && item.kind !== 'delegation') company = item.company;
  if (!company && domain.length >= 3) company = domain.charAt(0).toUpperCase() + domain.slice(1);
  out.company = company; if (exhibitorId) out.exhibitorId = exhibitorId;
  // nom : ligne courte, 2 à 4 mots alphabétiques capitalisés, sans chiffres
  const honor = /^(ing\.?|dott\.?|dott\.ssa|dr\.?|mr\.?|mrs\.?|ms\.?|sig\.?|sig\.ra|prof\.?|arch\.?|geom\.?|avv\.?)\s+/i;
  const nameCands = cands.filter(c => !used.has(c.i)).map(c => ({ ...c, s: c.l.replace(honor, '').trim() })).filter(c => { const w = c.s.split(' '); return w.length >= 2 && w.length <= 4 && !/\d|@|www|\.com|\.it/i.test(c.s) && w.every(x => /^[A-ZÀ-Þ][a-zà-ÿA-ZÀ-Þ'’.-]+$/.test(x) || /^[A-ZÀ-Þ]{2,}$/.test(x)) && !LEGAL_RE.test(c.s) && c.s.length <= 40; });
  if (nameCands.length) { const titleIdx = titles.length ? rawLines.indexOf(titles[0]) : -1; let pick = nameCands.find(c => titleIdx >= 0 && Math.abs(c.i - titleIdx) === 1) || nameCands[0]; out.name = pick.s.split(' ').map(w => w === w.toUpperCase() && w.length > 2 ? w.charAt(0) + w.slice(1).toLowerCase() : w).join(' '); }
  if (!out.name && out.email) { const local = out.email.split('@')[0]; const parts = local.split(/[._-]/).filter(p => p.length > 1 && !/\d/.test(p)); if (parts.length >= 2) out.name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '); }
  return out;
}
async function aiExtract(photoBlob) {
  const key = setting('aiKey'); const model = setting('aiModel') || 'claude-haiku-5-5';
  const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(photoBlob); });
  const body = { model, max_tokens: 600, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }, { type: 'text', text: 'This is a business card. Extract the fields and answer with JSON only, no prose, keys: name, title, company, email, phone, mobile, website, address, raw (all visible text, one line per card line). Empty string when absent. Phone numbers in international format when the country is identifiable.' }] }] };
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify(body) });
  if (!r.ok) { const t = await r.text(); throw new Error('API ' + r.status + ' ' + t.slice(0, 120)); }
  const j = await r.json(); const txt = (j.content || []).map(c => c.text || '').join('');
  const m = txt.match(/\{[\s\S]*\}/); if (!m) throw new Error('Réponse inattendue');
  const f = JSON.parse(m[0]);
  if (S.catIndex && f.company) { const n = norm(f.company); const hit = S.catIndex.find(x => x.n === n) || S.catIndex.find(x => x.n.includes(n) || n.includes(x.n)); if (hit) { f.company = hit.e.n; f.exhibitorId = hit.e.id; } }
  return f;
}

/* ---------- exports ---------- */
function itemsTable() {
  const kinds = { rdv: 'Rendez-vous', visite: 'Visite planifiée', ajout: 'Ajout sur place', reserve: 'Réserve', delegation: 'Délégation' };
  return sortItems(S.items).sort(dayCmp).map(i => ({ 'Jour': i.day ? DAYS[i.day] : (i.kind === 'delegation' ? 'Soirées' : ''), 'Heure': i.time, 'Stand': i.stand, 'Entreprise': i.company, 'Pays': country(i.country), 'Type': kinds[i.kind] || i.kind, 'Statut': i.status === 'done' ? (i.kind === 'delegation' ? 'Rencontré' : 'Fait') : i.status === 'skipped' ? 'Sauté' : 'À faire', 'Potentiel': i.rating, 'Agent': i.intAgent ? 'Oui' : '', 'MAY': i.intMay ? 'Oui' : '', 'Quadralis': i.intQuad ? 'Oui' : '', 'Présent au Canada': i.inCanada, 'Ouvert à un fixe': i.fixOk, 'Prochaine étape': i.nextStep, 'Date de suivi': i.nextDate, 'Notes': i.notes, 'Contacts': S.contacts.filter(c => c.itemId === i.id).map(c => [c.name, c.title, c.email, c.mobile || c.phone].filter(Boolean).join(' · ')).join(' | '), 'Personne attendue': i.contactPlanned, 'Activité': i.what, 'Angle': i.angle, 'Objectif': i.objective, 'Priorité': i.priority, 'Fait le': fmtDate(i.doneAt) }));
}
function contactsTable() {
  return S.contacts.map(c => { const it = byId(S.items, c.itemId); return { 'Nom': c.name, 'Titre': c.title, 'Entreprise': c.company, 'Courriel': c.email, 'Mobile': c.mobile, 'Téléphone': c.phone, 'Site web': c.website, 'Adresse': c.address, 'Notes': c.notes, 'Fiche liée': it ? it.company : '', 'Jour': it && it.day ? DAYS[it.day] : '', 'Stand': it ? it.stand : '', 'Potentiel': it ? it.rating : '', 'Prochaine étape': it ? it.nextStep : '', 'Carte photographiée': c.photoId ? 'Oui' : '', 'Source': c.source || '', 'Créé le': fmtDate(c.createdAt) }; });
}
function csv(rows) { if (!rows.length) return ''; const keys = Object.keys(rows[0]); const q = v => { const s = String(v ?? ''); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }; return [keys.join(';'), ...rows.map(r => keys.map(k => q(r[k])).join(';'))].join('\r\n'); }
function vcard(list) {
  const e = s => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  return list.filter(c => c.name || c.email || c.company).map(c => { const parts = (c.name || '').trim().split(/\s+/); const last = parts.length > 1 ? parts.pop() : ''; const first = parts.join(' ');
    return ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(last)};${e(first)};;;`, `FN:${e(c.name || c.company)}`, c.company ? `ORG:${e(c.company)}` : '', c.title ? `TITLE:${e(c.title)}` : '', c.email ? `EMAIL;TYPE=INTERNET,WORK:${e(c.email)}` : '', c.mobile ? `TEL;TYPE=CELL:${e(c.mobile)}` : '', c.phone ? `TEL;TYPE=WORK:${e(c.phone)}` : '', c.website ? `URL:${e(/^https?:/i.test(c.website) ? c.website : 'https://' + c.website)}` : '', c.address ? `ADR;TYPE=WORK:;;${e(c.address)};;;;` : '', `NOTE:${e(['Ecomondo 2026', byId(S.items, c.itemId) ? byId(S.items, c.itemId).company : '', c.notes].filter(Boolean).join(' · '))}`, 'END:VCARD'].filter(Boolean).join('\r\n'); }).join('\r\n') + '\r\n';
}
async function exportXlsx() {
  if (!window.XLSX) { toast('Module Excel non chargé'); return; }
  const wb = XLSX.utils.book_new();
  const add = (name, rows, widths) => { const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ '(vide)': '' }]); ws['!cols'] = widths.map(w => ({ wch: w })); XLSX.utils.book_append_sheet(wb, ws, name); };
  const items = itemsTable();
  add('Rencontres', items, [10, 7, 12, 34, 12, 16, 10, 9, 7, 6, 10, 12, 12, 36, 12, 50, 50, 22, 40, 50, 9, 8, 16]);
  add('Contacts', contactsTable(), [26, 26, 34, 32, 18, 18, 26, 36, 40, 30, 10, 12, 9, 36, 10, 8, 16]);
  add('Suivis', items.filter(r => r['Prochaine étape'] || r['Potentiel'] === 'A' || r['Potentiel'] === 'B').map(r => ({ 'Entreprise': r['Entreprise'], 'Potentiel': r['Potentiel'], 'Agent': r['Agent'], 'MAY': r['MAY'], 'Quadralis': r['Quadralis'], 'Présent au Canada': r['Présent au Canada'], 'Ouvert à un fixe': r['Ouvert à un fixe'], 'Prochaine étape': r['Prochaine étape'], 'Date de suivi': r['Date de suivi'], 'Contacts': r['Contacts'], 'Notes': r['Notes'], 'Stand': r['Stand'], 'Jour': r['Jour'] })), [34, 9, 7, 6, 10, 12, 12, 40, 12, 50, 50, 12, 10]);
  add('Non faits', items.filter(r => r['Statut'] === 'À faire').map(r => ({ 'Jour': r['Jour'], 'Heure': r['Heure'], 'Stand': r['Stand'], 'Entreprise': r['Entreprise'], 'Type': r['Type'], 'Activité': r['Activité'], 'Angle': r['Angle'] })), [10, 7, 12, 34, 16, 50, 50]);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  await deliver(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Ecomondo-2026-rapport-${new Date().toISOString().slice(0, 10)}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
async function exportBackup() {
  try {
    const photos = S.photoCache || await dbAll('photos');
    const enc = photos.map(p => { const u8 = new Uint8Array(p.data); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return { id: p.id, type: p.type, createdAt: p.createdAt, data: btoa(s) }; });
    const data = { app: 'ecomondo2026', version: 1, exportedAt: nowIso(), items: S.items, contacts: S.contacts, photos: enc };
    await deliver(new Blob([JSON.stringify(data)], { type: 'application/json' }), `Ecomondo-2026-sauvegarde-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`, 'application/json');
  } catch (e) { toast('Échec de la sauvegarde'); console.error(e); }
}
async function deliver(blob, filename, type) {
  try {
    const file = new File([blob], filename, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; console.warn(e); }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  toast('Fichier téléchargé : ' + filename, 3000);
}

/* ---------- service worker / démarrage ---------- */
function registerSw() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => { const nw = reg.installing; if (!nw) return; nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) { const st = $('#status'); st.innerHTML = 'Nouvelle version prête — <b style="text-decoration:underline">toucher pour recharger</b>'; st.classList.remove('hidden'); st.onclick = () => { nw.postMessage('SKIP_WAITING'); setTimeout(() => location.reload(), 300); }; } }); });
  }).catch(e => console.warn('SW', e));
}
function netStatus() { const st = $('#status'); if (!navigator.onLine) { st.textContent = 'Hors ligne : tout fonctionne, les données restent sur l’appareil.'; st.classList.remove('hidden'); st.classList.remove('ok'); st.onclick = null; } else if (st.textContent.startsWith('Hors ligne')) { st.classList.add('hidden'); } }
window.addEventListener('online', netStatus); window.addEventListener('offline', netStatus);
(async function boot() {
  try {
    idb = await openDb();
    await seedIfNeeded();
    await loadAll();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    S.ready = true;
    if (!location.hash) history.replaceState(null, '', '#plan/' + S.day);
    route();
    registerSw(); netStatus();
    loadCatalogue().catch(() => {});
    if (navigator.onLine && setting('ocrReady') !== '1' && !setting('aiKey')) setTimeout(() => getOcrWorker().catch(() => {}), 4000);
  } catch (e) { console.error(e); $('#main').innerHTML = `<div class="empty">Erreur au démarrage : ${esc(e.message || e)}<br><button class="linkbtn" onclick="location.reload()">Recharger</button></div>`; }
})();
})();
