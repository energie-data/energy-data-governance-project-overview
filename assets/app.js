/* assets/app.js */
let selectedYear = 2026;
let allProjects = [];
let fuse = null;
let ids2023Cache = null;
let ids2023Promise = null;

function getDataUrl(){ return `./data/projects_data_sharing_${selectedYear}.json`; }

async function get2023Ids(){
  if (ids2023Cache) return ids2023Cache;
  if (ids2023Promise) return ids2023Promise;

  ids2023Promise = (async () => {
    const res = await fetch('./data/projects_data_sharing_2023.json', {cache:'no-store'});
    if (!res.ok) throw new Error('Failed to load ./data/projects_data_sharing_2023.json');
    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected data format in ./data/projects_data_sharing_2023.json');
    }
    ids2023Cache = new Set(data.map(p => p && p.id).filter(Boolean));
    return ids2023Cache;
  })();

  return ids2023Promise;
}

const elQ = document.getElementById('q');
const elStatus = document.getElementById('status');
const elScope = document.getElementById('scope');
const elGrid = document.getElementById('grid');
const elDiagram = document.getElementById('radialDiagram');
const elEmpty = document.getElementById('empty');
const elCount = document.getElementById('countLabel');
const elChips = document.getElementById('activeChips');
const elLegendNew2026 = document.getElementById('legendNew2026');
const elLegendInactive2026 = document.getElementById('legendInactive2026');
const elRemovedIn2026Section = document.getElementById('removedIn2026Section');
const elRemovedIn2026List = document.getElementById('removedIn2026List');
const yearBtns = document.querySelectorAll('.yearBtn');
let legendFilter = '';

const overlay = document.getElementById('overlay');
const drawer = document.getElementById('drawer');
const closeBtn = document.getElementById('closeBtn');
const drawerCtl = createDrawerController({ overlay, drawer, closeBtn });

const dTitle = document.getElementById('dTitle');
const dSub = document.getElementById('dSub');
const dKv = document.getElementById('dKv');
const dLists = document.getElementById('dLists');
const dSummary = document.getElementById('dSummary');
const dDevelopmentsSection = document.getElementById('dDevelopmentsSection');
const dDevelopments = document.getElementById('dDevelopments');
const dLinks = document.getElementById('dLinks');
const dDetail = document.getElementById('dDetail');
const dMeta = document.getElementById('dMeta');

const removedIn2026Items = [
  {
    id: 'removed-dutch-blockchain-coalition',
    naam: 'Dutch Blockchain Coalition',
    reden: 'Dit initiatief bestaat niet meer en de relatie met het onderwerp Energie data governance en data delen werd toch te beperkt gevonden.'
  },
  {
    id: 'removed-ds4ssc',
    naam: 'Data Space for Smart and Sustainable Cities and Communities (DS4SSC)',
    reden: 'Dit initiatief leek toch te weinig relevant ten opzichte van het onderwerp van het rapport.'
  }
];


function renderChips(){
  const chips = [];
  const q = elQ.value.trim();
  const st = elStatus.value;
  const sc = elScope.value;

  if (q) chips.push({label:`Zoek: ${q}`, clear: ()=>{ elQ.value=''; apply(); }});
  if (st) chips.push({label:`Status: ${st}`, clear: ()=>{ elStatus.value=''; apply(); }});
  if (sc) chips.push({label:`Scope: ${sc}`, clear: ()=>{ elScope.value=''; apply(); }});
  if (legendFilter === 'new2026') chips.push({label:'Legenda: Lichtblauw', clear: ()=>{ legendFilter=''; syncLegendFiltersUI(); apply(); }});
  if (legendFilter === 'inactive2026') chips.push({label:'Legenda: Lichtgrijs', clear: ()=>{ legendFilter=''; syncLegendFiltersUI(); apply(); }});

  elChips.innerHTML = '';
  for (const c of chips){
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.textContent = `${c.label} ✕`;
    btn.onclick = c.clear;
    elChips.appendChild(btn);
  }
}

function syncLegendFiltersUI(){
  const enabled = selectedYear === 2026;
  if (!enabled) legendFilter = '';
  if (elLegendNew2026) {
    elLegendNew2026.disabled = !enabled;
    elLegendNew2026.setAttribute('aria-pressed', enabled && legendFilter === 'new2026' ? 'true' : 'false');
  }
  if (elLegendInactive2026) {
    elLegendInactive2026.disabled = !enabled;
    elLegendInactive2026.setAttribute('aria-pressed', enabled && legendFilter === 'inactive2026' ? 'true' : 'false');
  }
}

function cardHtml(p){
  const tags = (p.tags || []).slice(0,3).map(t=>`<span class="badge">${escapeHtml(t)}</span>`).join('');
  const titleClass = p._isNewIn2026
    ? 'cardTitle cardTitle--new2026'
    : (p._isInactiveIn2026 ? 'cardTitle cardTitle--inactive2026' : 'cardTitle');
  const meta = `
    ${statusBadgeHtml(p.status)}
    <span class="badge">${escapeHtml(p.scope)}</span>
    ${tags}
  `;
  const summarySrc = p.samenvatting || '';
  const summary = escapeHtml(summarySrc).slice(0, 170) + (summarySrc.length > 170 ? '…' : '');
  return `
    <div class="card" data-slug="${escapeHtml(p.id)}" role="button" tabindex="0" aria-label="Open quick reference: ${escapeHtml(p.naam)}">
      <div>
        <h3 class="${titleClass}">${escapeHtml(p.naam)}</h3>
        <div class="meta">${meta}</div>
      </div>
      <p class="summary">${summary}</p>
      <div class="footerRow">
        <span class="small">Quick reference →</span>
        <a class="link" href="project.html?slug=${encodeURIComponent(p.id)}&year=${selectedYear}" onclick="event.stopPropagation()">Detail</a>
      </div>
    </div>
  `;
}

function renderGrid(list){
  elGrid.innerHTML = list.map(cardHtml).join('');
  elEmpty.style.display = list.length ? 'none' : 'block';
  elCount.textContent = `${list.length} initiatief${list.length === 1 ? '' : 'en'}`;

  // click handlers
  for (const card of elGrid.querySelectorAll('.card')){
    const slug = card.getAttribute('data-slug');
    card.addEventListener('click', ()=> openDrawer(slug));
    card.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDrawer(slug);
      }
    });
  }
}

function renderRemovedIn2026Section(){
  if (!elRemovedIn2026Section || !elRemovedIn2026List) return;

  elRemovedIn2026List.innerHTML = removedIn2026Items.map(item => `
    <article class="removedInitiativeItem">
      <span class="removedInitiativeTitle">${escapeHtml(item.naam)}</span>
      <span class="removedInitiativeReason">${escapeHtml(item.reden)}</span>
    </article>
  `).join('');
}

function apply(){
  renderChips();

  const q = elQ.value.trim();
  const st = elStatus.value;
  const sc = elScope.value;

  let list = allProjects;

  if (q && fuse){
    list = fuse.search(q).map(r => r.item);
  }

  if (st){
    list = list.filter(p => (p.status || '') === st);
  }
  if (sc){
    list = list.filter(p => (p.scope || '') === sc);
  }
  if (legendFilter === 'new2026'){
    list = list.filter(p => Boolean(p._isNewIn2026));
  } else if (legendFilter === 'inactive2026'){
    list = list.filter(p => Boolean(p._isInactiveIn2026));
  }

  renderGrid(list);
  renderDiagram(list, elDiagram, openDrawer, {
    isNewIn2026: (p) => Boolean(p && p._isNewIn2026),
    isInactiveIn2026: (p) => Boolean(p && p._isInactiveIn2026)
  });
  renderRemovedIn2026Section();
}


function openDrawer(slug){
  const p = allProjects.find(x => x.id === slug);
  if (!p) return;

  dTitle.textContent = p.naam;
  const subParts = [];
  if (p.status) subParts.push(p.status);
  if (p.scope) subParts.push(p.scope);
  if (p.geografische_scope) subParts.push(p.geografische_scope);
  if (p.jaar_start || p.jaar_einde) {
    subParts.push(`${p.jaar_start ?? '—'}–${p.jaar_einde ?? '—'}`);
  }
  if (p.eigenaar) subParts.push(p.eigenaar);
  dSub.textContent = subParts.join(' • ');
  dSummary.textContent = p.samenvatting || '';

  // key/values
  const qr = p.korte_referentie || {};
  const startYear = p.jaar_start;
  const endYear = p.jaar_einde;
  const yearsLabel = (startYear || endYear)
    ? `${startYear ?? '—'}–${endYear ?? '—'}`
    : '—';
  dKv.innerHTML = `
    <div class="k">Doel</div><div class="v">${escapeHtml(qr.primair_doel || '—')}</div>
    <div class="k">Status</div><div class="v">${statusBadgeHtml(p.status)}</div>
    <div class="k">Scope</div><div class="v">${escapeHtml(p.scope || '—')}</div>
    <div class="k">Geografische scope</div><div class="v">${escapeHtml(p.geografische_scope || '—')}</div>
    <div class="k">Looptijd</div><div class="v">${escapeHtml(yearsLabel)}</div>
    <div class="k">Eigenaar</div><div class="v">${escapeHtml(p.eigenaar || '—')}</div>
  `;

  // lists
  const outputs = (qr.belangrijkste_resultaten || []);
  const users = (qr.doelgebruikers || []);
  dLists.innerHTML = `
    ${outputs.length ? `<div class="drawerSubheading">Belangrijkste resultaten</div><ul class="drawerList">${outputs.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>` : ''}
    ${users.length ? `<div class="drawerSubheading">Doelgebruikers</div><ul class="drawerList">${users.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>` : ''}
  `;

  // links
  dLinks.innerHTML = '';
  const linkDefs = (Array.isArray(p.links) ? p.links : []).filter(
    x => x && x.url && String(x.url).trim().length
  );

  if (!linkDefs.length){
    dLinks.innerHTML = `<span class="small">Geen links opgegeven.</span>`;
  } else {
    for (const l of linkDefs){
      const a = document.createElement('a');
      a.className = 'button';
      a.href = l.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = l.label || l.url;
      dLinks.appendChild(a);
    }
  }

  dDetail.href = `project.html?slug=${encodeURIComponent(p.id)}&year=${selectedYear}`;
  dDetail.style.display = '';
  const tagText = (p.tags || []).join(', ');
  dMeta.textContent = tagText ? `Tags: ${tagText}` : '';

  // Ontwikkelingen 2023–2026
  const dev = p.ontwikkelingen_2023_2026;
  if (dev && (dev.samenvatting || (Array.isArray(dev.hoogtepunten) && dev.hoogtepunten.length))) {
    dDevelopmentsSection.style.display = '';
    let html = '';
    if (dev.referentiedatum) {
      html += `<p class="summary" style="margin:0 0 8px;"><span class="drawerReferentie-label">Referentiedatum:</span> ${escapeHtml(dev.referentiedatum)}</p>`;
    }
    if (dev.samenvatting) {
      html += `<p class="summary" style="margin:0 0 10px;">${escapeHtml(dev.samenvatting)}</p>`;
    }
    if (Array.isArray(dev.hoogtepunten) && dev.hoogtepunten.length) {
      html += '<ul class="drawerList developmentHighlights">';
      for (const h of dev.hoogtepunten) {
        const datePart = h.datum ? `<span class="developmentDate">${escapeHtml(h.datum)}</span> ` : '';
        html += `<li>${datePart}<strong>${escapeHtml(h.titel || '')}</strong>${h.detail ? ` — ${escapeHtml(h.detail)}` : ''}</li>`;
      }
      html += '</ul>';
    }
    dDevelopments.innerHTML = html;
  } else {
    dDevelopmentsSection.style.display = 'none';
    dDevelopments.innerHTML = '';
  }

  drawerCtl.open();
}

function updateDataDelenPrintLink() {
  const a = document.getElementById('dataDelenPrintLink');
  if (a) {
    a.href = `initiatieven-data-delen-print.html?year=${selectedYear}`;
  }
}

function setYearUI(year){
  selectedYear = year;
  syncLegendFiltersUI();
  yearBtns.forEach(btn => {
    const y = parseInt(btn.dataset.year, 10);
    btn.classList.toggle('active', y === selectedYear);
  });
  const url = new URL(window.location.href);
  url.searchParams.set('year', String(selectedYear));
  window.history.replaceState(null, '', url);
  updateDataDelenPrintLink();
}

async function loadProjects(year){
  setYearUI(year);
  const dataUrl = getDataUrl();
  const [res, ids2023] = await Promise.all([
    fetch(dataUrl, {cache:'no-store'}),
    get2023Ids()
  ]);
  if (!res.ok) throw new Error(`Failed to load ${dataUrl}`);
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected data format in ${dataUrl}`);
  }

  allProjects = data.map(p => {
    const isNewIn2026 = selectedYear === 2026 && p && p.id && !ids2023.has(p.id);
    const isInactiveIn2026 = selectedYear === 2026
      && p
      && typeof p.status === 'string'
      && p.status.trim().toLowerCase() === 'afgerond';
    return {
      ...p,
      _isNewIn2026: Boolean(isNewIn2026),
      _isInactiveIn2026: Boolean(isInactiveIn2026)
    };
  });

  fuse = new Fuse(allProjects, {
    includeScore: true,
    threshold: 0.32,
    keys: [
      {name:'naam', weight: 0.5},
      {name:'samenvatting', weight: 0.35},
      {name:'tags', weight: 0.15},
      {name:'status', weight: 0.08},
      {name:'scope', weight: 0.08}
    ]
  });

  elStatus.innerHTML = '<option value="">Status (alle)</option>';
  elScope.innerHTML = '<option value="">Scope (alle)</option>';
  buildSelectOptions(elStatus, uniqSorted(allProjects.map(p=>p.status)));
  buildSelectOptions(elScope, uniqSorted(allProjects.map(p=>p.scope)));

  apply();
}

function init(){
  const url = new URL(window.location.href);
  const yearParam = url.searchParams.get('year');
  if (yearParam === '2023' || yearParam === '2026') {
    selectedYear = parseInt(yearParam, 10);
    yearBtns.forEach(btn => {
      const y = parseInt(btn.dataset.year, 10);
      btn.classList.toggle('active', y === selectedYear);
    });
  }

  yearBtns.forEach(btn => {
    btn.addEventListener('click', ()=>{
      const y = parseInt(btn.dataset.year, 10);
      loadProjects(y).catch(err=>{
        console.error(err);
        elGrid.innerHTML = `<div class="empty">Kon ${getDataUrl()} niet laden.</div>`;
      });
    });
  });

  elQ.addEventListener('input', apply);
  elStatus.addEventListener('change', apply);
  elScope.addEventListener('change', apply);
  if (elLegendNew2026) {
    elLegendNew2026.addEventListener('click', () => {
      legendFilter = legendFilter === 'new2026' ? '' : 'new2026';
      syncLegendFiltersUI();
      apply();
    });
  }
  if (elLegendInactive2026) {
    elLegendInactive2026.addEventListener('click', () => {
      legendFilter = legendFilter === 'inactive2026' ? '' : 'inactive2026';
      syncLegendFiltersUI();
      apply();
    });
  }
  syncLegendFiltersUI();

  loadProjects(selectedYear).catch(err=>{
    console.error(err);
    elGrid.innerHTML = `<div class="empty">Kon ${getDataUrl()} niet laden. Check of alle bestanden op GitHub Pages staan.</div>`;
  });
}

init();