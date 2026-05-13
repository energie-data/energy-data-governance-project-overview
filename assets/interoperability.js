/* assets/interoperability.js */
let allInitiatives = [];
let fuse = null;
let filterDefs = {};

const elQ = document.getElementById('q');
const elType = document.getElementById('type');
const elFocus = document.getElementById('focus');
const elMaturity = document.getElementById('maturity');
const elRegion = document.getElementById('region');
const elOrigin = document.getElementById('origin');
const elGrid = document.getElementById('grid');
const elEmpty = document.getElementById('empty');
const elCount = document.getElementById('countLabel');
const elChips = document.getElementById('activeChips');

const overlay = document.getElementById('overlay');
const drawer = document.getElementById('drawer');
const closeBtn = document.getElementById('closeBtn');
const drawerCtl = createDrawerController({ overlay, drawer, closeBtn });

const dTitle = document.getElementById('dTitle');
const dSub = document.getElementById('dSub');
const dKv = document.getElementById('dKv');
const dSummary = document.getElementById('dSummary');
const dDevelopmentsSection = document.getElementById('dDevelopmentsSection');
const dDevelopments = document.getElementById('dDevelopments');
const dAdviceSection = document.getElementById('dAdviceSection');
const dAdvice = document.getElementById('dAdvice');
const dRelatedSection = document.getElementById('dRelatedSection');
const dRelated = document.getElementById('dRelated');
const dSources = document.getElementById('dSources');
const dDetail = document.getElementById('dDetail');
const dMeta = document.getElementById('dMeta');

function labelFor(defKey, code) {
  if (!code) return '';
  const def = filterDefs[defKey];
  const categories = def && Array.isArray(def.categorieen) ? def.categorieen : [];
  const hit = categories.find(x => x.code === code);
  return hit ? hit.label : code;
}

function fillSelect(selectEl, values, defKey) {
  for (const code of values) {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = labelFor(defKey, code);
    selectEl.appendChild(opt);
  }
}

function renderChips(){
  const chips = [];
  const q = elQ.value.trim();
  const type = elType.value;
  const focus = elFocus.value;
  const maturity = elMaturity.value;
  const region = elRegion.value;
  const origin = elOrigin.value;

  if (q) chips.push({label:`Zoek: ${q}`, clear: ()=>{ elQ.value=''; apply(); }});
  if (type) chips.push({label:`Type: ${labelFor('type_initiatief', type)}`, clear: ()=>{ elType.value=''; apply(); }});
  if (focus) chips.push({label:`Focus: ${labelFor('inhoudelijke_focus', focus)}`, clear: ()=>{ elFocus.value=''; apply(); }});
  if (maturity) chips.push({label:`Volwassenheid: ${labelFor('volwassenheid_2026', maturity)}`, clear: ()=>{ elMaturity.value=''; apply(); }});
  if (region) chips.push({label:`Regio: ${labelFor('regio_cluster', region)}`, clear: ()=>{ elRegion.value=''; apply(); }});
  if (origin) chips.push({label:`Oorsprong: ${labelFor('oorsprong_in_rapport', origin)}`, clear: ()=>{ elOrigin.value=''; apply(); }});

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

function mapInitiatives(raw){
  return raw.map(i => {
    return {
      slug: i.id,
      id: i.id,
      name: i.naam,
      alternatieve_namen: Array.isArray(i.alternatieve_namen) ? i.alternatieve_namen : [],
      organisatie: i.organisatie_of_consortium || '',
      korte_omschrijving: i.korte_omschrijving || '',
      uitgebreide_omschrijving: i.uitgebreide_omschrijving || '',
      toepassing_in_praktijk: i.toepassing_in_praktijk || '',
      opgeleverd: Array.isArray(i.opgeleverd) ? i.opgeleverd : [],
      status_2023: i.status_2023 || '',
      status_2026: i.status_2026 || '',
      jaar_start: i.jaar_start ?? null,
      jaar_einde: i.jaar_einde ?? null,
      geografische_scope: i.geografische_scope || '',
      type_initiatief: i.type_initiatief || '',
      inhoudelijke_focus: i.inhoudelijke_focus || '',
      volwassenheid_2026: i.volwassenheid_2026 || '',
      regio_cluster: i.regio_cluster || '',
      oorsprong_in_rapport: i.oorsprong_in_rapport || '',
      beheer_vorm: i.beheer_vorm || '',
      website_official: i.website_official || '',
      aanvullende_websites: Array.isArray(i.aanvullende_websites) ? i.aanvullende_websites : [],
      verwante_initiatieven: Array.isArray(i.verwante_initiatieven) ? i.verwante_initiatieven : []
    };
  });
}

function cardHtml(p){
  const meta = `
    ${p.type_initiatief ? `<span class="badge">${escapeHtml(labelFor('type_initiatief', p.type_initiatief))}</span>` : ''}
    ${p.inhoudelijke_focus ? `<span class="badge">${escapeHtml(labelFor('inhoudelijke_focus', p.inhoudelijke_focus))}</span>` : ''}
    ${p.volwassenheid_2026 ? `<span class="badge">${escapeHtml(labelFor('volwassenheid_2026', p.volwassenheid_2026))}</span>` : ''}
  `;
  const baseSummary = p.korte_omschrijving || '';
  const summary = escapeHtml(baseSummary).slice(0, 190) + (baseSummary.length > 190 ? '…' : '');
  return `
    <div class="card" data-slug="${escapeHtml(p.slug)}" role="button" tabindex="0" aria-label="Open quick reference: ${escapeHtml(p.name)}">
      <div>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="meta">${meta}</div>
      </div>
      <p class="summary">${summary}</p>
      <div class="footerRow">
        <span class="small">Quick reference →</span>
        <a class="link" href="project-interoperabiliteit.html?slug=${encodeURIComponent(p.slug)}" onclick="event.stopPropagation()">Detail</a>
      </div>
    </div>
  `;
}

function renderGrid(list){
  elGrid.innerHTML = list.map(cardHtml).join('');
  elEmpty.style.display = list.length ? 'none' : 'block';
  elCount.textContent = `${list.length} initiatief${list.length === 1 ? '' : 'en'}`;

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

function apply(){
  renderChips();

  const q = elQ.value.trim();
  const type = elType.value;
  const focus = elFocus.value;
  const maturity = elMaturity.value;
  const region = elRegion.value;
  const origin = elOrigin.value;

  let list = allInitiatives;

  if (q && fuse){
    list = fuse.search(q).map(r => r.item);
  }

  if (type) list = list.filter(p => p.type_initiatief === type);
  if (focus) list = list.filter(p => p.inhoudelijke_focus === focus);
  if (maturity) list = list.filter(p => p.volwassenheid_2026 === maturity);
  if (region) list = list.filter(p => p.regio_cluster === region);
  if (origin) list = list.filter(p => p.oorsprong_in_rapport === origin);

  renderGrid(list);
}

function openDrawer(slug){
  const p = allInitiatives.find(x => x.slug === slug);
  if (!p) return;

  dTitle.textContent = p.name;
  const subParts = [];
  if (p.type_initiatief) subParts.push(labelFor('type_initiatief', p.type_initiatief));
  if (p.inhoudelijke_focus) subParts.push(labelFor('inhoudelijke_focus', p.inhoudelijke_focus));
  if (p.geografische_scope) subParts.push(p.geografische_scope);
  dSub.textContent = subParts.join(' • ');

  dSummary.textContent = p.korte_omschrijving || '';

  const yearsLabel = p.jaar_start
    ? `${p.jaar_start}${p.jaar_einde ? `–${p.jaar_einde}` : '–heden'}`
    : '—';
  dKv.innerHTML = `
    <div class="k">Type initiatief</div><div class="v">${escapeHtml(labelFor('type_initiatief', p.type_initiatief) || '—')}</div>
    <div class="k">Inhoudelijke focus</div><div class="v">${escapeHtml(labelFor('inhoudelijke_focus', p.inhoudelijke_focus) || '—')}</div>
    <div class="k">Volwassenheid 2026</div><div class="v">${escapeHtml(labelFor('volwassenheid_2026', p.volwassenheid_2026) || '—')}</div>
    <div class="k">Regio-cluster</div><div class="v">${escapeHtml(labelFor('regio_cluster', p.regio_cluster) || '—')}</div>
    <div class="k">Oorsprong in rapport</div><div class="v">${escapeHtml(labelFor('oorsprong_in_rapport', p.oorsprong_in_rapport) || '—')}</div>
    <div class="k">Beheervorm</div><div class="v">${escapeHtml(labelFor('beheer_vorm', p.beheer_vorm) || '—')}</div>
    <div class="k">Organisatie / consortium</div><div class="v">${escapeHtml(p.organisatie || '—')}</div>
    <div class="k">Status 2023</div><div class="v">${escapeHtml(p.status_2023 || '—')}</div>
    <div class="k">Status 2026</div><div class="v">${escapeHtml(p.status_2026 || '—')}</div>
    <div class="k">Geografische scope</div><div class="v">${escapeHtml(p.geografische_scope || '—')}</div>
    <div class="k">Looptijd</div><div class="v">${escapeHtml(yearsLabel)}</div>
  `;

  if (p.uitgebreide_omschrijving) {
    dDevelopmentsSection.style.display = '';
    dDevelopments.textContent = p.uitgebreide_omschrijving;
  } else {
    dDevelopmentsSection.style.display = 'none';
    dDevelopments.textContent = '';
  }

  if (p.toepassing_in_praktijk) {
    dAdviceSection.style.display = '';
    dAdvice.textContent = p.toepassing_in_praktijk;
  } else {
    dAdviceSection.style.display = 'none';
    dAdvice.textContent = '';
  }

  if (p.verwante_initiatieven && p.verwante_initiatieven.length){
    dRelatedSection.style.display = '';
    dRelated.innerHTML = p.verwante_initiatieven.map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  } else {
    dRelatedSection.style.display = 'none';
    dRelated.innerHTML = '';
  }

  dSources.innerHTML = '';
  const links = [];
  if (p.website_official) links.push({ label: 'Officiële website', url: p.website_official });
  for (const site of p.aanvullende_websites) {
    if (site && site.url) {
      links.push({ label: site.label || site.url, url: site.url });
    }
  }
  if (!links.length){
    dSources.innerHTML = '<li class="small">Geen bronnen opgegeven.</li>';
  } else {
    for (const link of links){
      const li = document.createElement('li');
      if (/^https?:\/\//.test(link.url)){
        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = link.label;
        li.appendChild(a);
      } else {
        li.textContent = link.label;
      }
      dSources.appendChild(li);
    }
  }

  dDetail.href = `project-interoperabiliteit.html?slug=${encodeURIComponent(p.slug)}`;
  dMeta.textContent = `ID: ${p.id}${p.alternatieve_namen.length ? ` • Alternatieve namen: ${p.alternatieve_namen.join(', ')}` : ''}`;

  drawerCtl.open();
}

async function loadData(){
  const dataUrl = './data/projects_interoperability.json';
  const res = await fetch(dataUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${dataUrl}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.initiatieven)) {
    throw new Error(`Unexpected data format in ${dataUrl}`);
  }
  filterDefs = data.filter_metadata_definities || {};
  allInitiatives = mapInitiatives(data.initiatieven);

  fuse = new Fuse(allInitiatives, {
    includeScore: true,
    threshold: 0.32,
    keys: [
      {name:'name', weight: 0.5},
      {name:'korte_omschrijving', weight: 0.35},
      {name:'uitgebreide_omschrijving', weight: 0.15},
      {name:'organisatie', weight: 0.2},
      {name:'geografische_scope', weight: 0.15},
      {name:'type_initiatief', weight: 0.1},
      {name:'inhoudelijke_focus', weight: 0.1}
    ]
  });

  elType.innerHTML = '<option value="">Type initiatief (alle)</option>';
  elFocus.innerHTML = '<option value="">Inhoudelijke focus (alle)</option>';
  elMaturity.innerHTML = '<option value="">Volwassenheid (alle)</option>';
  elRegion.innerHTML = '<option value="">Regio (alle)</option>';
  elOrigin.innerHTML = '<option value="">Oorsprong in rapport (alle)</option>';
  fillSelect(elType, uniqSorted(allInitiatives.map(p => p.type_initiatief)), 'type_initiatief');
  fillSelect(elFocus, uniqSorted(allInitiatives.map(p => p.inhoudelijke_focus)), 'inhoudelijke_focus');
  fillSelect(elMaturity, uniqSorted(allInitiatives.map(p => p.volwassenheid_2026)), 'volwassenheid_2026');
  fillSelect(elRegion, uniqSorted(allInitiatives.map(p => p.regio_cluster)), 'regio_cluster');
  fillSelect(elOrigin, uniqSorted(allInitiatives.map(p => p.oorsprong_in_rapport)), 'oorsprong_in_rapport');

  apply();
}

async function init(){
  elQ.addEventListener('input', apply);
  elType.addEventListener('change', apply);
  elFocus.addEventListener('change', apply);
  elMaturity.addEventListener('change', apply);
  elRegion.addEventListener('change', apply);
  elOrigin.addEventListener('change', apply);

  try{
    await loadData();
  } catch (err){
    console.error(err);
    elGrid.innerHTML = `<div class="empty">Kon ./data/projects_interoperability.json niet laden. Check of het bestand beschikbaar is.</div>`;
  }
}

init();

