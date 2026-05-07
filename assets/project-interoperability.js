/* assets/project-interoperability.js */
function getSlug(){
  const url = new URL(window.location.href);
  return url.searchParams.get('slug') || '';
}

function labelFor(defs, defKey, code) {
  if (!code) return '';
  const def = defs[defKey];
  const categories = def && Array.isArray(def.categorieen) ? def.categorieen : [];
  const hit = categories.find(x => x.code === code);
  return hit ? hit.label : code;
}


async function init(){
  const slug = getSlug();
  const dataUrl = './data/projects_interoperability_2.json';
  const res = await fetch(dataUrl, {cache:'no-store'});
  if (!res.ok) throw new Error(`Failed to load ${dataUrl}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.initiatieven)) {
    throw new Error(`Unexpected data format in ${dataUrl}`);
  }

  const initiatives = data.initiatieven;
  const p = initiatives.find(x => x.id === slug);

  const pTitle = document.getElementById('pTitle');
  const pSub = document.getElementById('pSub');
  const pSummary = document.getElementById('pSummary');
  const pKv = document.getElementById('pKv');
  const pDevelopmentsSection = document.getElementById('pDevelopmentsSection');
  const pDevelopments = document.getElementById('pDevelopments');
  const pAdviceSection = document.getElementById('pAdviceSection');
  const pAdvice = document.getElementById('pAdvice');
  const pRelatedSection = document.getElementById('pRelatedSection');
  const pRelated = document.getElementById('pRelated');
  const pSources = document.getElementById('pSources');
  const pMeta = document.getElementById('pMeta');

  if (!p){
    document.title = 'Initiatief niet gevonden';
    pTitle.textContent = 'Initiatief niet gevonden';
    pSub.textContent = 'Controleer de URL (slug).';
    pSummary.textContent = '';
    return;
  }

  const defs = data.filter_metadata_definities || {};

  document.title = `${p.naam} — Initiatief interoperabiliteit`;
  pTitle.textContent = p.naam;
  const subParts = [];
  if (p.type_initiatief) subParts.push(labelFor(defs, 'type_initiatief', p.type_initiatief));
  if (p.inhoudelijke_focus) subParts.push(labelFor(defs, 'inhoudelijke_focus', p.inhoudelijke_focus));
  if (p.geografische_scope) subParts.push(p.geografische_scope);
  pSub.textContent = subParts.join(' • ');

  pSummary.textContent = p.korte_omschrijving || '';

  const yearsLabel = p.jaar_start
    ? `${p.jaar_start}${p.jaar_einde ? `–${p.jaar_einde}` : '–heden'}`
    : '—';

  pKv.innerHTML = `
    <div class="k">Type initiatief</div><div class="v">${escapeHtml(labelFor(defs, 'type_initiatief', p.type_initiatief) || '—')}</div>
    <div class="k">Inhoudelijke focus</div><div class="v">${escapeHtml(labelFor(defs, 'inhoudelijke_focus', p.inhoudelijke_focus) || '—')}</div>
    <div class="k">Volwassenheid 2026</div><div class="v">${escapeHtml(labelFor(defs, 'volwassenheid_2026', p.volwassenheid_2026) || '—')}</div>
    <div class="k">Regio-cluster</div><div class="v">${escapeHtml(labelFor(defs, 'regio_cluster', p.regio_cluster) || '—')}</div>
    <div class="k">Bruikbaarheid e-ontologie</div><div class="v">${escapeHtml(labelFor(defs, 'bruikbaarheid_e_ontologie', p.bruikbaarheid_e_ontologie) || '—')}</div>
    <div class="k">Beheervorm</div><div class="v">${escapeHtml(labelFor(defs, 'beheer_vorm', p.beheer_vorm) || '—')}</div>
    <div class="k">Oorsprong in rapport</div><div class="v">${escapeHtml(labelFor(defs, 'oorsprong_in_rapport', p.oorsprong_in_rapport) || '—')}</div>
    <div class="k">Organisatie / consortium</div><div class="v">${escapeHtml(p.organisatie_of_consortium || '—')}</div>
    <div class="k">Status 2023</div><div class="v">${escapeHtml(p.status_2023 || '—')}</div>
    <div class="k">Status 2026</div><div class="v">${escapeHtml(p.status_2026 || '—')}</div>
    <div class="k">Geografische scope</div><div class="v">${escapeHtml(p.geografische_scope || '—')}</div>
    <div class="k">Looptijd</div><div class="v">${escapeHtml(yearsLabel)}</div>
  `;

  if (p.uitgebreide_omschrijving){
    pDevelopmentsSection.style.display = '';
    pDevelopments.textContent = p.uitgebreide_omschrijving;
  } else {
    pDevelopmentsSection.style.display = 'none';
    pDevelopments.textContent = '';
  }

  if (p.toepassing_in_praktijk){
    pAdviceSection.style.display = '';
    pAdvice.textContent = p.toepassing_in_praktijk;
  } else {
    pAdviceSection.style.display = 'none';
    pAdvice.textContent = '';
  }

  const relatedList = Array.isArray(p.verwante_initiatieven) ? p.verwante_initiatieven : [];
  if (relatedList.length){
    pRelatedSection.style.display = '';
    pRelated.innerHTML = relatedList.map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  } else {
    pRelatedSection.style.display = 'none';
    pRelated.innerHTML = '';
  }

  pSources.innerHTML = '';
  const links = [];
  if (p.website_official) links.push({ label: 'Officiële website', url: p.website_official });
  const additional = Array.isArray(p.aanvullende_websites) ? p.aanvullende_websites : [];
  for (const site of additional) {
    if (site && site.url) links.push({ label: site.label || site.url, url: site.url });
  }
  if (!links.length){
    pSources.innerHTML = '<li class="small">Geen bronnen opgegeven.</li>';
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
      pSources.appendChild(li);
    }
  }

  const opgeleverd = Array.isArray(p.opgeleverd) ? p.opgeleverd : [];

  pMeta.innerHTML = `
    <div class="k">ID</div><div class="v">${escapeHtml(p.id || '')}</div>
    <div class="k">Alternatieve namen</div><div class="v">${escapeHtml((p.alternatieve_namen || []).join(', ') || '—')}</div>
    <div class="k">Opgeleverd</div><div class="v">${escapeHtml(opgeleverd.join(' • ') || '—')}</div>
    <div class="k">Toelichting bruikbaarheid e-ontologie</div><div class="v">${escapeHtml(p.bruikbaarheid_e_ontologie_toelichting || '—')}</div>
  `;
}

init().catch(err=>{
  console.error(err);
  document.getElementById('pTitle').textContent = 'Fout bij laden';
  document.getElementById('pSub').textContent = 'Kon ./data/projects_interoperability_2.json niet laden.';
});

