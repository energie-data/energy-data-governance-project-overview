/* Statisch printoverzicht voor overzicht-use-cases-print.html */

function textBlock(label, value) {
  const t = value != null && String(value).trim() ? String(value) : '';
  if (!t) return '';
  return `<p class="printBlockLabel">${escapeHtml(label)}</p><div class="printBlock">${escapeHtml(t)}</div>`;
}

function listBlock(label, items) {
  if (!Array.isArray(items) || !items.length) return '';
  return `<p class="printBlockLabel">${escapeHtml(label)}</p><ul class="printList">${items.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
}

function normalizeLinks(useCase) {
  return Array.isArray(useCase?.links)
    ? useCase.links
      .filter(link => typeof link === 'string' && link.trim())
      .map(link => link.trim())
    : [];
}

function sectionAnchorId(useCase, index) {
  const raw = String(useCase?.project_id ?? '').trim().toLowerCase();
  const safe = raw.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `use-case-${safe || index + 1}`;
}

function tocHtml(useCases) {
  if (!Array.isArray(useCases) || !useCases.length) return '';
  const items = useCases.map((u, idx) => {
    const id = sectionAnchorId(u, idx);
    const label = u?.projectnaam ?? u?.project_id ?? `Use case ${idx + 1}`;
    return `<li><a href="#${escapeHtml(id)}">${escapeHtml(label)}</a></li>`;
  }).join('');
  return `
    <nav class="printToc" aria-label="Inhoudsopgave use cases">
      <h2>Inhoudsopgave</h2>
      <ol class="printTocList">${items}</ol>
    </nav>
  `;
}

function useCaseSection(u, index) {
  const anchorId = sectionAnchorId(u, index);
  const links = normalizeLinks(u);
  const metaParts = [u.MD1_status, u.oorsprong].filter(x => x && String(x).trim());
  const metaHtml = metaParts.length
    ? `<div class="printOverall"><span>${escapeHtml(metaParts.join(' • '))}</span></div>`
    : '';

  const body = [
    textBlock('Beschrijving', u.beschrijving),
    textBlock('Gebruik van energiedata', u.gebruik_energiedata),
    textBlock('Organisaties', u.organisaties),
    listBlock('Projectdoel', u.MD2_projectdoel),
    listBlock('Type energiedata', u.MD3_type_energiedata),
    listBlock('Databron', u.MD4_databron),
    listBlock('Data consument', u.data_consumer),
    listBlock('Governance / toegang', u.MD6_governance),
    listBlock('Toepassing', u.MD7_toepassing),
    listBlock('Granulariteit niveau', u.MD8_granulariteit_niveau),
    listBlock('Granulariteit frequentie', u.MD9_granulariteit_frequentie),
    listBlock('Links', links)
  ].join('');

  return `
    <section class="printRecSection" id="${escapeHtml(anchorId)}">
      <div class="printRecHeader">
        <h2>${escapeHtml(u.projectnaam ?? '')}</h2>
        ${metaHtml}
      </div>
      ${body}
      <p class="printIdFoot">Project ID: ${escapeHtml(u.project_id ?? '')}</p>
    </section>
  `;
}

async function loadUseCasesPrint() {
  const root = document.getElementById('useCasesPrintRoot');
  if (!root) return;

  const dataUrl = './data/use_cases_2026.json';
  const res = await fetch(dataUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${dataUrl}`);

  const data = await res.json();
  if (!data || !Array.isArray(data.use_cases)) {
    throw new Error('Unexpected data format');
  }

  root.innerHTML = `
    ${tocHtml(data.use_cases)}
    ${data.use_cases.map((u, i) => useCaseSection(u, i)).join('')}
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadUseCasesPrint().catch(err => {
    console.error(err);
    const root = document.getElementById('useCasesPrintRoot');
    if (root) {
      root.innerHTML = '<p class="printError">Kon het overzicht niet laden. Controleer of dit bestand via een webserver wordt geopend.</p>';
    }
  });
});

