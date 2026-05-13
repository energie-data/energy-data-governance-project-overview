/* assets/use-cases.js */
let allUseCases = [];
let fuse = null;

const elQ = document.getElementById('q');
const elStatus = document.getElementById('status');
const elEnergyType = document.getElementById('energyType');
const elGranularityLevel = document.getElementById('granularityLevel');
const elGranularityFrequency = document.getElementById('granularityFrequency');
const elGrid = document.getElementById('grid');
const elEmpty = document.getElementById('empty');
const elCount = document.getElementById('countLabel');
const elChips = document.getElementById('activeChips');
const elEnergyTypeBars = document.getElementById('energyTypeBars');

const overlay = document.getElementById('overlay');
const drawer = document.getElementById('drawer');
const closeBtn = document.getElementById('closeBtn');
const drawerCtl = createDrawerController({ overlay, drawer, closeBtn });

const dTitle = document.getElementById('dTitle');
const dSub = document.getElementById('dSub');
const dDescription = document.getElementById('dDescription');
const dDataUse = document.getElementById('dDataUse');
const dKv = document.getElementById('dKv');
const dLists = document.getElementById('dLists');
const dLinks = document.getElementById('dLinks');
const dMeta = document.getElementById('dMeta');

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function normalizeLinks(raw) {
  return Array.isArray(raw.links)
    ? raw.links.filter(isNonEmptyString).map(link => link.trim())
    : [];
}

function normalizeUseCase(raw) {
  return {
    project_id: raw.project_id || '',
    projectnaam: raw.projectnaam || '',
    oorsprong: raw.oorsprong || '',
    organisaties: raw.organisaties || '',
    beschrijving: raw.beschrijving || '',
    gebruik_energiedata: raw.gebruik_energiedata || '',
    links: normalizeLinks(raw),
    MD1_status: raw.MD1_status || '',
    MD2_projectdoel: Array.isArray(raw.MD2_projectdoel) ? raw.MD2_projectdoel : [],
    MD3_type_energiedata: Array.isArray(raw.MD3_type_energiedata) ? raw.MD3_type_energiedata : [],
    MD4_databron: Array.isArray(raw.MD4_databron) ? raw.MD4_databron : [],
    data_consumer: Array.isArray(raw.data_consumer) ? raw.data_consumer : [],
    MD6_governance: Array.isArray(raw.MD6_governance) ? raw.MD6_governance : [],
    MD7_toepassing: Array.isArray(raw.MD7_toepassing) ? raw.MD7_toepassing : [],
    MD8_granulariteit_niveau: Array.isArray(raw.MD8_granulariteit_niveau) ? raw.MD8_granulariteit_niveau : [],
    MD9_granulariteit_frequentie: Array.isArray(raw.MD9_granulariteit_frequentie) ? raw.MD9_granulariteit_frequentie : []
  };
}

function statusClassForUseCase(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('lopend')) return 'badgeStatus--active';
  if (s.includes('afgerond')) return 'badgeStatus--completed';
  return 'badgeStatus--default';
}

function statusBadgeForUseCase(status) {
  const text = isNonEmptyString(status) ? escapeHtml(status) : 'Onbekend';
  return `<span class="badge badgeStatus ${statusClassForUseCase(status)}">${text}</span>`;
}

function listToBadges(values, maxItems = 2) {
  return values
    .slice(0, maxItems)
    .map(v => `<span class="badge">${escapeHtml(v)}</span>`)
    .join('');
}

function buildEnergyTypeStats(list) {
  const totalProjects = list.length || 1;
  const counts = new Map();

  for (const item of list) {
    const uniqueTypes = new Set(
      (Array.isArray(item.MD3_type_energiedata) ? item.MD3_type_energiedata : [])
        .filter(isNonEmptyString)
    );
    for (const type of uniqueTypes) {
      counts.set(type, (counts.get(type) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / totalProjects) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function renderEnergyTypeBars() {
  if (!elEnergyTypeBars) return;

  const stats = buildEnergyTypeStats(allUseCases);
  const activeType = elEnergyType.value;

  if (!stats.length) {
    elEnergyTypeBars.innerHTML = '<div class="small">Geen data beschikbaar.</div>';
    return;
  }

  elEnergyTypeBars.innerHTML = stats.map(item => {
    const isActive = activeType === item.label;
    return `
      <button
        type="button"
        class="barRow${isActive ? ' is-active' : ''}"
        data-energy-type="${escapeHtml(item.label)}"
        aria-pressed="${isActive ? 'true' : 'false'}"
      >
        <span class="barRowTop">
          <span class="barLabel">${escapeHtml(item.label)}</span>
          <span class="barValue">${item.percentage.toFixed(1)}%</span>
        </span>
        <span class="barTrack">
          <span class="barFill" style="width:${Math.min(100, item.percentage)}%"></span>
        </span>
      </button>
    `;
  }).join('');

  for (const button of elEnergyTypeBars.querySelectorAll('.barRow')) {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-energy-type') || '';
      elEnergyType.value = elEnergyType.value === value ? '' : value;
      apply();
    });
  }
}

function cardHtml(item) {
  const meta = `
    ${statusBadgeForUseCase(item.MD1_status)}
  `;
  const summarySrc = item.beschrijving || '';
  const summary = escapeHtml(summarySrc).slice(0, 180) + (summarySrc.length > 180 ? '…' : '');

  return `
    <div class="card" data-id="${escapeHtml(item.project_id)}" role="button" tabindex="0" aria-label="Open use case: ${escapeHtml(item.projectnaam)}">
      <div>
        <h3>${escapeHtml(item.projectnaam || 'Onbekende use case')}</h3>
        <div class="meta">${meta}</div>
      </div>
      <p class="summary">${summary}</p>
      <div class="footerRow">
        <span class="small">Use case details →</span>
      </div>
    </div>
  `;
}

function renderGrid(list) {
  elGrid.innerHTML = list.map(cardHtml).join('');
  elEmpty.style.display = list.length ? 'none' : 'block';
  elCount.textContent = `${list.length} use case${list.length === 1 ? '' : 's'}`;

  for (const card of elGrid.querySelectorAll('.card')) {
    const id = card.getAttribute('data-id');
    card.addEventListener('click', () => openDrawer(id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDrawer(id);
      }
    });
  }
}

function renderChips() {
  const chips = [];
  const q = elQ.value.trim();
  const status = elStatus.value;
  const energyType = elEnergyType.value;
  const granularityLevel = elGranularityLevel.value;
  const granularityFrequency = elGranularityFrequency.value;

  if (q) chips.push({ label: `Zoek: ${q}`, clear: () => { elQ.value = ''; apply(); } });
  if (status) chips.push({ label: `Status: ${status}`, clear: () => { elStatus.value = ''; apply(); } });
  if (energyType) chips.push({ label: `Type energiedata: ${energyType}`, clear: () => { elEnergyType.value = ''; apply(); } });
  if (granularityLevel) chips.push({ label: `Granulariteit niveau: ${granularityLevel}`, clear: () => { elGranularityLevel.value = ''; apply(); } });
  if (granularityFrequency) chips.push({ label: `Granulariteit frequentie: ${granularityFrequency}`, clear: () => { elGranularityFrequency.value = ''; apply(); } });

  elChips.innerHTML = '';
  for (const chip of chips) {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.textContent = `${chip.label} ✕`;
    btn.onclick = chip.clear;
    elChips.appendChild(btn);
  }
}

function apply() {
  renderChips();

  const q = elQ.value.trim();
  const status = elStatus.value;
  const energyType = elEnergyType.value;
  const granularityLevel = elGranularityLevel.value;
  const granularityFrequency = elGranularityFrequency.value;

  let list = allUseCases;
  if (q && fuse) list = fuse.search(q).map(r => r.item);
  if (status) list = list.filter(x => (x.MD1_status || '') === status);
  if (energyType) list = list.filter(x => x.MD3_type_energiedata.includes(energyType));
  if (granularityLevel) list = list.filter(x => x.MD8_granulariteit_niveau.includes(granularityLevel));
  if (granularityFrequency) list = list.filter(x => x.MD9_granulariteit_frequentie.includes(granularityFrequency));

  renderGrid(list);
  renderEnergyTypeBars();
}

function kvRow(label, value) {
  return `<div class="k">${escapeHtml(label)}</div><div class="v">${escapeHtml(value || '—')}</div>`;
}

function listSection(title, values) {
  if (!values.length) return '';
  return `<div class="small" style="margin-top:10px;">${escapeHtml(title)}</div><ul class="list">${values.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>`;
}

function openDrawer(id) {
  const item = allUseCases.find(x => x.project_id === id);
  if (!item) return;

  dTitle.textContent = item.projectnaam || 'Onbekende use case';
  const subParts = [];
  if (item.MD1_status) subParts.push(item.MD1_status);
  dSub.textContent = subParts.join(' • ');

  dDescription.textContent = item.beschrijving || '—';
  dDataUse.textContent = item.gebruik_energiedata || '—';

  dKv.innerHTML = `
    ${kvRow('Status', item.MD1_status)}
    ${kvRow('Organisaties', item.organisaties)}
  `;

  dLists.innerHTML = `
    ${listSection('Projectdoel', item.MD2_projectdoel)}
    ${listSection('Type energiedata', item.MD3_type_energiedata)}
    ${listSection('Databron', item.MD4_databron)}
    ${listSection('Data consument', item.data_consumer)}
    ${listSection('Governance', item.MD6_governance)}
    ${listSection('Toepassing', item.MD7_toepassing)}
    ${listSection('Granulariteit niveau', item.MD8_granulariteit_niveau)}
    ${listSection('Granulariteit frequentie', item.MD9_granulariteit_frequentie)}
  `;

  dLinks.innerHTML = '';
  if (Array.isArray(item.links) && item.links.length) {
    const linksHtml = item.links
      .map(link => `<li><a class="link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link)}</a></li>`)
      .join('');
    dLinks.innerHTML = `<ul class="list">${linksHtml}</ul>`;
  } else {
    dLinks.innerHTML = '<span class="small">Geen links beschikbaar.</span>';
  }

  dMeta.textContent = '';
  drawerCtl.open();
}

function uniqueValues(values) {
  return Array.from(new Set(values.filter(isNonEmptyString))).sort((a, b) => a.localeCompare(b));
}

function sortByPreferredOrder(values, preferredOrder) {
  const rank = new Map(preferredOrder.map((value, index) => [value, index]));
  return [...values].sort((a, b) => {
    const aRank = rank.has(a) ? rank.get(a) : Number.POSITIVE_INFINITY;
    const bRank = rank.has(b) ? rank.get(b) : Number.POSITIVE_INFINITY;
    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b);
  });
}

async function loadUseCases() {
  const dataUrl = './data/use_cases_2026.json';
  const res = await fetch(dataUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${dataUrl}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.use_cases)) {
    throw new Error(`Unexpected data format in ${dataUrl}`);
  }

  allUseCases = data.use_cases.map(normalizeUseCase);

  fuse = new Fuse(allUseCases, {
    includeScore: true,
    threshold: 0.32,
    keys: [
      { name: 'projectnaam', weight: 0.45 },
      { name: 'beschrijving', weight: 0.28 },
      { name: 'gebruik_energiedata', weight: 0.24 },
      { name: 'organisaties', weight: 0.18 },
      { name: 'oorsprong', weight: 0.12 },
      { name: 'MD2_projectdoel', weight: 0.15 },
      { name: 'MD3_type_energiedata', weight: 0.15 },
      { name: 'MD7_toepassing', weight: 0.12 }
    ]
  });

  elStatus.innerHTML = '<option value="">Status (alle)</option>';
  elEnergyType.innerHTML = '<option value="">Type energiedata (alle)</option>';
  elGranularityLevel.innerHTML = '<option value="">Granulariteit niveau (alle)</option>';
  elGranularityFrequency.innerHTML = '<option value="">Granulariteit frequentie (alle)</option>';

  buildSelectOptions(elStatus, uniqueValues(allUseCases.map(x => x.MD1_status)));
  buildSelectOptions(elEnergyType, uniqueValues(allUseCases.flatMap(x => x.MD3_type_energiedata)));
  buildSelectOptions(
    elGranularityLevel,
    sortByPreferredOrder(
      uniqueValues(allUseCases.flatMap(x => x.MD8_granulariteit_niveau)),
      [
        'Land',
        'Provincie',
        'Gemeente',
        'Wijk',
        'Postcode 6',
        'Straat',
        'Bedrijventerrein',
        'Aansluiting',
        'Allocatiepunt: als onderdeel van de aansluiting',
        'Fase: een verzameling van apparaten aansgesloten op 1 fase in het huis',
        'Groep: een groep van apparaten',
        'Apparaat: 1 apparaat dat energie verbruikt'
      ]
    )
  );
  buildSelectOptions(
    elGranularityFrequency,
    sortByPreferredOrder(
      uniqueValues(allUseCases.flatMap(x => x.MD9_granulariteit_frequentie)),
      ['5 Jaar', 'Jaar', 'Maand', 'Week', 'Dag', 'Uur', 'Kwartier', 'Minuut', 'Seconde']
    )
  );

  renderEnergyTypeBars();
  apply();
}

function init() {
  elQ.addEventListener('input', apply);
  elStatus.addEventListener('change', apply);
  elEnergyType.addEventListener('change', apply);
  elGranularityLevel.addEventListener('change', apply);
  elGranularityFrequency.addEventListener('change', apply);

  loadUseCases().catch(err => {
    console.error(err);
    elGrid.innerHTML = '<div class="empty">Kon ./data/use_cases_2026.json niet laden.</div>';
  });
}

init();

