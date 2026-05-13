/**
 * Statisch printoverzicht voor reflectie-aanbevelingen-2023-print.html
 * (geen knoppen of links in de gegenereerde inhoud)
 */
const STATUS_KEYS_PRINT = new Set(['realized', 'partial', 'none']);

function coerceStatusKeyPrint(key) {
  const k = String(key ?? '').trim();
  return STATUS_KEYS_PRINT.has(k) ? k : 'none';
}

function printDotHtml(statusKey) {
  const kind = coerceStatusKeyPrint(statusKey);
  return `<span class="printDot printDot--${escapeHtml(kind)}" aria-hidden="true"></span>`;
}

function renderInlineAsterisksEmPrint(text) {
  const escaped = escapeHtml(text ?? '');
  return escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function legendItemHtml(row) {
  const key = coerceStatusKeyPrint(row?.key);
  const label = row?.label ?? '';
  const description = row?.description ?? '';
  return `
    <div class="printLegendItem">
      <div class="printLegendPill printLegendPill--${escapeHtml(key)}">
        ${printDotHtml(key)}
        <span>${escapeHtml(label)}</span>
      </div>
      <div class="printLegendDesc">${escapeHtml(description)}</div>
    </div>
  `;
}

function subBlockHtml(sub) {
  const sk = coerceStatusKeyPrint(sub?.statusKey);
  const title = sub?.title ?? '';
  const label = sub?.statusLabel ?? '';
  const quote = sub?.quote ?? '';
  const explanation = sub?.statusExplanation ?? '';

  return `
    <article class="printSub">
      <div class="printSubTitleRow">
        <h3>${printDotHtml(sk)} ${escapeHtml(title)}</h3>
      </div>
      <p class="printStatusLine">Status: ${escapeHtml(label)}</p>
      <p class="printBlockLabel">Oorspronkelijke aanbeveling (rapport 2023)</p>
      <div class="printBlock">${renderInlineAsterisksEmPrint(quote)}</div>
      <p class="printBlockLabel">Toelichting op de status</p>
      <div class="printBlock">${renderInlineAsterisksEmPrint(explanation)}</div>
    </article>
  `;
}

function sectionAnchorId(rec, index) {
  const raw = String(rec?.id ?? '').trim().toLowerCase();
  const safe = raw.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `recommendation-${safe || index + 1}`;
}

function tocHtml(recommendations) {
  if (!Array.isArray(recommendations) || !recommendations.length) return '';
  const items = recommendations.map((rec, idx) => {
    const id = sectionAnchorId(rec, idx);
    const label = rec?.header ?? rec?.id ?? `Aanbeveling ${idx + 1}`;
    return `<li><a href="#${escapeHtml(id)}">${escapeHtml(label)}</a></li>`;
  }).join('');
  return `
    <nav class="printToc" aria-label="Inhoudsopgave aanbevelingen">
      <h2>Inhoudsopgave</h2>
      <ol class="printTocList">${items}</ol>
    </nav>
  `;
}

function sectionHtml(rec, index) {
  const anchorId = sectionAnchorId(rec, index);
  const header = rec?.header ?? '';
  const subs = Array.isArray(rec.subRecommendations) ? rec.subRecommendations : [];

  return `
    <section class="printRecSection" id="${escapeHtml(anchorId)}">
      <div class="printRecHeader">
        <h2>${escapeHtml(header)}</h2>
      </div>
      ${subs.map(subBlockHtml).join('')}
    </section>
  `;
}

async function loadRecommendations2023Print() {
  const root = document.getElementById('recommendations2023PrintRoot');
  if (!root) return;

  const res = await fetch('./data/recommendations_2023.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load recommendations JSON');

  const data = await res.json();
  if (!data || typeof data !== 'object') throw new Error('Unexpected data format');

  const legend = Array.isArray(data.legend) ? data.legend : [];
  const recs = Array.isArray(data.recommendations) ? data.recommendations : [];

  const legendHtml = legend.length
    ? `<div class="printLegend" role="note">${legend.map(legendItemHtml).join('')}</div>`
    : '';

  root.innerHTML = `
    ${legendHtml}
    ${tocHtml(recs)}
    ${recs.map((rec, idx) => sectionHtml(rec, idx)).join('')}
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadRecommendations2023Print().catch(err => {
    console.error(err);
    const root = document.getElementById('recommendations2023PrintRoot');
    if (root) {
      root.innerHTML = '<p class="printError">Kon het overzicht niet laden. Controleer of dit bestand via een webserver wordt geopend.</p>';
    }
  });
});
