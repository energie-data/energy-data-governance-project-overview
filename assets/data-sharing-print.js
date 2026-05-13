/**
 * Statisch printoverzicht voor initiatieven-data-delen-print.html
 * Jaar via query: ?year=2023 of ?year=2026 (standaard 2026)
 */
function textBlock(label, value) {
  const t = value != null && String(value).trim() ? String(value) : '';
  if (!t) return '';
  return `<p class="printBlockLabel">${escapeHtml(label)}</p><div class="printBlock">${escapeHtml(t)}</div>`;
}

function listBlock(label, items) {
  if (!Array.isArray(items) || !items.length) return '';
  return `<p class="printBlockLabel">${escapeHtml(label)}</p><ul class="printList">${items.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
}

function linksAsTextLines(links) {
  const defs = (Array.isArray(links) ? links : []).filter(
    x => x && x.url && String(x.url).trim().length
  );
  return defs.map(l => {
    const label = (l.label && String(l.label).trim()) ? String(l.label).trim() : l.url;
    return `${label} — ${l.url}`;
  });
}

function developmentsHtml(dev) {
  if (!dev || (!dev.samenvatting && !(Array.isArray(dev.hoogtepunten) && dev.hoogtepunten.length))) {
    return '';
  }
  let inner = '';
  if (dev.referentiedatum) {
    inner += `<p class="printStatusLine">Referentiedatum: ${escapeHtml(dev.referentiedatum)}</p>`;
  }
  if (dev.samenvatting) {
    inner += `<div class="printBlock">${escapeHtml(dev.samenvatting)}</div>`;
  }
  if (Array.isArray(dev.hoogtepunten) && dev.hoogtepunten.length) {
    inner += '<ul class="printList">';
    for (const h of dev.hoogtepunten) {
      const datePart = h.datum ? `${escapeHtml(h.datum)} — ` : '';
      const titel = escapeHtml(h.titel || '');
      const detail = h.detail ? ` — ${escapeHtml(h.detail)}` : '';
      inner += `<li>${datePart}<strong>${titel}</strong>${detail}</li>`;
    }
    inner += '</ul>';
  }
  return `<p class="printBlockLabel">Ontwikkelingen 2023–2026</p>${inner}`;
}

function sectionAnchorId(project, index) {
  const raw = String(project?.id ?? '').trim().toLowerCase();
  const safe = raw.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `initiative-${safe || index + 1}`;
}

function tocHtml(projects) {
  if (!Array.isArray(projects) || !projects.length) return '';
  const items = projects.map((p, i) => {
    const id = sectionAnchorId(p, i);
    const label = p?.naam ?? p?.id ?? `Initiatief ${i + 1}`;
    return `<li><a href="#${escapeHtml(id)}">${escapeHtml(label)}</a></li>`;
  }).join('');
  return `
    <nav class="printToc" aria-label="Inhoudsopgave initiatieven">
      <h2>Inhoudsopgave</h2>
      <ol class="printTocList">${items}</ol>
    </nav>
  `;
}

function radarSectionHtml() {
  return `
    <section class="printRadarSection" aria-label="Radar initiatieven per scope">
      <h2>Radar initiatieven per scope</h2>
      <div id="dataDelenPrintRadar" class="printRadar"></div>
    </section>
  `;
}

function projectSection(p, index) {
  const anchorId = sectionAnchorId(p, index);
  const qr = p.korte_referentie || {};

  const outputs = qr.belangrijkste_resultaten || [];
  const users = qr.doelgebruikers || [];
  const tags = Array.isArray(p.tags) ? p.tags.filter(Boolean) : [];
  const tagLine = tags.length ? tags.join(', ') : '';

  const body = [
    textBlock('Samenvatting', p.samenvatting),
    textBlock('Primair doel', qr.primair_doel),
    listBlock('Belangrijkste resultaten', outputs),
    listBlock('Doelgebruikers', users),
    developmentsHtml(p.ontwikkelingen_2023_2026),
    listBlock('Links (tekst)', linksAsTextLines(p.links)),
    textBlock('Eigenaar', p.eigenaar),
    textBlock('Tags', tagLine),
  ].join('');

  return `
    <section class="printRecSection" id="${escapeHtml(anchorId)}">
      <div class="printRecHeader">
        <h2>${escapeHtml(p.naam ?? '')}</h2>
      </div>
      ${body}
      <p class="printIdFoot">ID: ${escapeHtml(p.id ?? '')}</p>
    </section>
  `;
}

function parseYear() {
  const y = new URLSearchParams(window.location.search).get('year');
  if (y === '2023' || y === '2026') return parseInt(y, 10);
  return 2026;
}

async function loadDataSharingPrint() {
  const root = document.getElementById('dataDelenPrintRoot');
  if (!root) return;

  const year = parseYear();
  const dataUrl = `./data/projects_data_sharing_${year}.json`;
  const res = await fetch(dataUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${dataUrl}`);

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('Unexpected data format');
  }
  let ids2023 = new Set();
  if (year === 2026) {
    const prevRes = await fetch('./data/projects_data_sharing_2023.json', { cache: 'no-store' });
    if (!prevRes.ok) throw new Error('Failed to load ./data/projects_data_sharing_2023.json');
    const prevData = await prevRes.json();
    if (!Array.isArray(prevData)) throw new Error('Unexpected data format in 2023 data');
    ids2023 = new Set(prevData.map(p => p && p.id).filter(Boolean));
  }

  const titleEl = document.getElementById('dataDelenPrintYearLabel');
  if (titleEl) titleEl.textContent = String(year);

  root.innerHTML = `
    ${tocHtml(data)}
    ${radarSectionHtml()}
    ${data.map((p, i) => projectSection(p, i)).join('')}
  `;

  const radarEl = document.getElementById('dataDelenPrintRadar');
  if (radarEl && typeof renderDiagram === 'function') {
    renderDiagram(data, radarEl, () => {}, {
      labelFontSize: 5,
      labelBackground: true,
      labelBackgroundColor: '#ffffff',
      labelBackgroundOpacity: 0.4,
      labelColor: (p) => {
        if (year === 2026 && p && p.id && !ids2023.has(p.id)) return '#075985';
        if (year === 2026 && p && typeof p.status === 'string' && p.status.trim().toLowerCase() === 'afgerond') return '#475569';
        return '#111827';
      },
      isNewIn2026: (p) => year === 2026 && p && p.id && !ids2023.has(p.id),
      isInactiveIn2026: (p) => year === 2026
        && p
        && typeof p.status === 'string'
        && p.status.trim().toLowerCase() === 'afgerond'
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDataSharingPrint().catch(err => {
    console.error(err);
    const root = document.getElementById('dataDelenPrintRoot');
    if (root) {
      root.innerHTML =
        '<p class="printError">Kon het overzicht niet laden. Controleer of dit bestand via een webserver wordt geopend.</p>';
    }
  });
});
