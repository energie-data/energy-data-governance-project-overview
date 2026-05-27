/**
 * Statisch printoverzicht voor initiatieven-interoperabiliteit-print.html
 * (geen klikbare links in de gegenereerde inhoud)
 * Data: projects_interoperability.json (zelfde bron als de overzichtspagina).
 */
function textBlock(label, value, options = {}) {
  const raw = value != null && String(value).trim() ? String(value) : '';
  const t = options.compactWhitespace ? raw.replace(/\s+/g, ' ').trim() : raw;
  if (!t) return '';
  return `<p class="printBlockLabel">${escapeHtml(label)}</p><div class="printBlock">${escapeHtml(t)}</div>`;
}

function listBlock(label, items) {
  if (!Array.isArray(items) || !items.length) return '';
  return `<p class="printBlockLabel">${escapeHtml(label)}</p><ul class="printList">${items.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
}

function labelFor(defs, defKey, code) {
  if (!code) return '';
  const def = defs[defKey];
  const categories = def && Array.isArray(def.categorieen) ? def.categorieen : [];
  const hit = categories.find(x => x.code === code);
  return hit ? hit.label : code;
}

function buildIdToName(initiatives) {
  const map = new Map();
  if (!Array.isArray(initiatives)) return map;
  for (const item of initiatives) {
    if (item && item.id) map.set(item.id, item.naam || item.id);
  }
  return map;
}

function resolveRelatedIds(ids, idToName) {
  return (Array.isArray(ids) ? ids : []).map((id) => {
    const naam = idToName.get(id);
    return naam && naam !== id ? `${naam} (${id})` : id;
  });
}

/** Bronregels als platte tekst (geen <a>-tags). */
function referenceLines(initiative) {
  const lines = [];
  if (initiative.website_official && String(initiative.website_official).trim()) {
    lines.push(`Officiële website: ${String(initiative.website_official).trim()}`);
  }
  const extra = Array.isArray(initiative.aanvullende_websites) ? initiative.aanvullende_websites : [];
  for (const site of extra) {
    if (!site || !site.url) continue;
    const label = (site.label && String(site.label).trim()) ? String(site.label).trim() : String(site.url).trim();
    lines.push(`${label}: ${String(site.url).trim()}`);
  }
  return lines;
}

function sectionAnchorId(initiative, index) {
  const raw = String(initiative?.id ?? '').trim().toLowerCase();
  const safe = raw.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `initiative-${safe || index + 1}`;
}

function tocHtml(initiatives) {
  if (!Array.isArray(initiatives) || !initiatives.length) return '';

  const liAt = (globalIdx) => {
    const i = initiatives[globalIdx];
    const id = sectionAnchorId(i, globalIdx);
    const label = i?.naam ?? i?.id ?? `Initiatief ${globalIdx + 1}`;
    return `<li><a href="#${escapeHtml(id)}">${escapeHtml(label)}</a></li>`;
  };

  const mid = Math.ceil(initiatives.length / 2);
  const leftItems = initiatives.slice(0, mid).map((_, j) => liAt(j)).join('');
  const rightItems = initiatives.slice(mid).map((_, j) => liAt(mid + j)).join('');

  const listBody = rightItems
    ? `
      <div class="printTocColumns">
        <ol class="printTocList">${leftItems}</ol>
        <ol class="printTocList" start="${mid + 1}">${rightItems}</ol>
      </div>
    `
    : `<ol class="printTocList">${leftItems}</ol>`;

  return `
    <nav class="printToc" aria-label="Inhoudsopgave initiatieven interoperabiliteit">
      <h2>Inhoudsopgave</h2>
      ${listBody}
    </nav>
  `;
}

function initiativeSection(i, defs, idToName, index) {
  const anchorId = sectionAnchorId(i, index);
  const naam = i.naam ?? '';

  const related = resolveRelatedIds(i.verwante_initiatieven, idToName);
  const refs = referenceLines(i);
  const opgeleverd = Array.isArray(i.opgeleverd) ? i.opgeleverd : [];

  const filterSummary = [
    textBlock('Type initiatief', labelFor(defs, 'type_initiatief', i.type_initiatief)),
    textBlock('Inhoudelijke focus', labelFor(defs, 'inhoudelijke_focus', i.inhoudelijke_focus)),
    textBlock('Volwassenheid 2026', labelFor(defs, 'volwassenheid_2026', i.volwassenheid_2026)),
    textBlock('Regio-cluster', labelFor(defs, 'regio_cluster', i.regio_cluster)),
    textBlock('Beheervorm', labelFor(defs, 'beheer_vorm', i.beheer_vorm)),
    textBlock('Oorsprong in rapport', labelFor(defs, 'oorsprong_in_rapport', i.oorsprong_in_rapport)),
    textBlock('Relevantie H6.1', labelFor(defs, 'relevantie_h61', i.relevantie_h61))
  ].join('');

  const body = [
    textBlock('Organisatie / consortium', i.organisatie_of_consortium),
    textBlock('Korte omschrijving', i.korte_omschrijving),
    textBlock('Uitgebreide omschrijving', i.uitgebreide_omschrijving, { compactWhitespace: true }),
    textBlock('Toepassing in praktijk', i.toepassing_in_praktijk),
    textBlock('Relevantie semantiek', i.relevantie_semantiek),
    textBlock('Relevantie interoperabiliteit', i.relevantie_interoperabiliteit),
    textBlock('Status 2023', i.status_2023),
    textBlock('Status 2026', i.status_2026),
    filterSummary,
    textBlock('Toelichting relevantie H6.1', i.relevantie_h61_toelichting),
    textBlock('Advies (toelichting)', i.advies_toelichting),
    listBlock('Opgeleverd', opgeleverd),
    listBlock('Verwante initiatieven', related),
    listBlock('Referenties en websites (tekst)', refs)
  ].join('');

  return `
    <section class="printRecSection" id="${escapeHtml(anchorId)}">
      <div class="printRecHeader">
        <h2>${escapeHtml(naam)}</h2>
      </div>
      ${body}
      <p class="printIdFoot">ID: ${escapeHtml(i.id ?? '')}</p>
    </section>
  `;
}

async function loadInteroperabilityPrint() {
  const root = document.getElementById('interopPrintRoot');
  if (!root) return;

  const dataUrl = './data/projects_interoperability.json';
  const res = await fetch(dataUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${dataUrl}`);

  const data = await res.json();
  if (!data || !Array.isArray(data.initiatieven)) {
    throw new Error('Unexpected data format');
  }

  const defs = data.filter_metadata_definities || {};
  const list = data.initiatieven;
  const idToName = buildIdToName(list);

  root.innerHTML = `
    ${tocHtml(list)}
    ${list.map((i, idx) => initiativeSection(i, defs, idToName, idx)).join('')}
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadInteroperabilityPrint().catch(err => {
    console.error(err);
    const root = document.getElementById('interopPrintRoot');
    if (root) {
      root.innerHTML =
        '<p class="printError">Kon het overzicht niet laden (./data/projects_interoperability.json). Controleer of dit bestand via een webserver wordt geopend.</p>';
    }
  });
});
