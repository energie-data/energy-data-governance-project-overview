/* assets/diagram.js — radiaal diagram voor initiatieven per scope */

const DIAGRAM_DOT_R = 3.2;
const DIAGRAM_LABEL_MAX_LEN = 42;
const DIAGRAM_LABEL_GAP = 8;          // afstand rand dot → tekst (px in viewBox)
const DIAGRAM_LABEL_COLLISION_PAD = 1.4;
const DIAGRAM_LABEL_MAX_NUDGE = 20;

function truncateDiagramLabel(name, maxLen = DIAGRAM_LABEL_MAX_LEN) {
  const s = String(name || '');
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

/**
 * Rendert een radiaal SVG-diagram in `container`.
 *
 * Structuur:
 *   Binnenste ring  → 'Energiedomein'
 *   Middelste ring  → 'Gerelateerde sector'
 *   Buitenste ring  → 'Generiek initiatief'
 *
 * Elk initiatief verschijnt als een klikbaar punt met een kort label.
 *
 * @param {Array}       projects    - Gefilterde projecten (met .id, .naam, .scope)
 * @param {HTMLElement} container   - Element waarin het SVG wordt geplaatst
 * @param {Function}    onItemClick - Callback(slug) bij klik op een diagram-item
 * @param {Object}      options     - Optionele render opties
 */
function renderDiagram(projects, container, onItemClick, options = {}) {
  if (!container) return;
  const isNewIn2026 = typeof options.isNewIn2026 === 'function'
    ? options.isNewIn2026
    : () => false;
  const isInactiveIn2026 = typeof options.isInactiveIn2026 === 'function'
    ? options.isInactiveIn2026
    : () => false;
  const labelFontSize = Number.isFinite(options.labelFontSize) ? options.labelFontSize : 6;
  const labelBackground = Boolean(options.labelBackground);
  const labelBackgroundColor = typeof options.labelBackgroundColor === 'string'
    ? options.labelBackgroundColor
    : '#ffffff';
  const labelBackgroundOpacity = Number.isFinite(options.labelBackgroundOpacity)
    ? options.labelBackgroundOpacity
    : 0.4;
  const labelColor = typeof options.labelColor === 'function'
    ? options.labelColor
    : (p) => (isNewIn2026(p)
      ? 'rgb(147, 214, 255)'
      : (isInactiveIn2026(p) ? 'rgba(170, 177, 191, .96)' : 'rgba(255,255,255,.9)'));

  const list = Array.isArray(projects) ? projects : [];
  if (!list.length) {
    container.innerHTML = '<p class="small">Geen initiatieven om weer te geven.</p>';
    return;
  }

  // --- Groepeer per scope -------------------------------------------------
  const byScope = {
    'Energiedomein': [],
    'Gerelateerde sector': [],
    'Generiek initiatief': []
  };
  for (const p of list) {
    if (byScope[p.scope]) byScope[p.scope].push(p);
  }

  // --- Geometrie -----------------------------------------------------------
  const size = 420;
  const center = size / 2;

  // Stralen van de zichtbare ringen (achtergrondcirkels)
  const ringRadii = { inner: 72, middle: 102, outer: 130 };

  // Stralen waarop de datapunten worden geplaatst (midden van elke ring)
  const dotRadii = {
    inner: ringRadii.inner * 0.68,
    middle: (ringRadii.inner + ringRadii.middle) / 2,
    outer: (ringRadii.middle + ringRadii.outer) / 2
  };

  /**
   * Berekent (x, y) voor elk item op een cirkel met de gegeven straal.
   * Starthoek is boven (-π/2) zodat het eerste item bovenaan staat.
   * Geeft ook de label-positie (lx, ly) en tekst-anchor terug.
   */
  function pointsFor(items, radius) {
    const n = items.length;
    if (!n) return [];
    return items.map((p, i) => {
      const angle = (2 * Math.PI * i / n) - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const isRight = cos >= 0;
      const labelDistance = DIAGRAM_DOT_R + DIAGRAM_LABEL_GAP;
      const lx = x + (cos * labelDistance);
      const ly = y + (sin * labelDistance);
      const anchor = cos > 0.22 ? 'start' : (cos < -0.22 ? 'end' : 'middle');
      return {
        p,
        x, y,
        lx, ly,
        anchor,
        side: isRight ? 'right' : 'left',
        isRight,
        cos, sin
      };
    });
  }

  const innerPts  = pointsFor(byScope['Energiedomein'],      dotRadii.inner);
  const middlePts = pointsFor(byScope['Gerelateerde sector'], dotRadii.middle);
  const outerPts  = pointsFor(byScope['Generiek initiatief'], dotRadii.outer);

  function prepareLabel(pt) {
    pt.fullName = String(pt.p.naam || '');
    pt.label = truncateDiagramLabel(pt.fullName);
    pt.labelW = Math.max(8, pt.label.length * labelFontSize * 0.56);
    pt.labelH = labelFontSize + 2;
    pt.nudge = 0;
    return pt;
  }

  function labelRect(pt) {
    const x = pt.anchor === 'middle'
      ? pt.lx - (pt.labelW / 2)
      : (pt.anchor === 'start' ? pt.lx : pt.lx - pt.labelW);
    return {
      x1: x - DIAGRAM_LABEL_COLLISION_PAD,
      y1: pt.ly - (pt.labelH / 2) - DIAGRAM_LABEL_COLLISION_PAD,
      x2: x + pt.labelW + DIAGRAM_LABEL_COLLISION_PAD,
      y2: pt.ly + (pt.labelH / 2) + DIAGRAM_LABEL_COLLISION_PAD
    };
  }

  function rectsOverlap(a, b) {
    return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
  }

  function nudgeLabelOutward(pt, amount) {
    if (pt.nudge >= DIAGRAM_LABEL_MAX_NUDGE) return false;
    const dx = pt.x - center;
    const dy = pt.y - center;
    const len = Math.hypot(dx, dy) || 1;
    const step = Math.min(amount, DIAGRAM_LABEL_MAX_NUDGE - pt.nudge);
    pt.lx += (dx / len) * step;
    pt.ly += (dy / len) * step;
    pt.nudge += step;
    return true;
  }

  function reduceLabelOverlap(points) {
    const pts = points.map(prepareLabel);
    for (let pass = 0; pass < 16; pass++) {
      let changed = false;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          if (!rectsOverlap(labelRect(pts[i]), labelRect(pts[j]))) continue;

          // Verplaats vooral het label dat al het verst buiten staat; dat houdt labels bij hun eigen bolletje.
          const ri = Math.hypot(pts[i].x - center, pts[i].y - center) + pts[i].nudge;
          const rj = Math.hypot(pts[j].x - center, pts[j].y - center) + pts[j].nudge;
          changed = nudgeLabelOutward(ri >= rj ? pts[i] : pts[j], 2.5) || changed;
        }
      }
      if (!changed) break;
    }
  }

  reduceLabelOverlap([...innerPts, ...middlePts, ...outerPts]);

  // --- SVG opbouwen -------------------------------------------------------
  // viewBox snoeit de lege ruimte boven en onder het diagram af
  const viewBoxY = 70;
  const viewBoxH = size - 140;
  let svg = `<svg viewBox="0 ${viewBoxY} ${size} ${viewBoxH}" role="img" aria-label="Overzicht initiatieven per scope">`;

  // Achtergrondringen (iets lichter + rand voor betere laagafbakening)
  svg += `
    <circle cx="${center}" cy="${center}" r="${ringRadii.outer}" fill="rgba(30,52,84,.55)" stroke="rgba(255,255,255,.18)" stroke-width="0.8"/>
    <circle cx="${center}" cy="${center}" r="${ringRadii.middle}" fill="rgba(24,42,72,.70)" stroke="rgba(255,255,255,.20)" stroke-width="0.8"/>
    <circle cx="${center}" cy="${center}" r="${ringRadii.inner}" fill="rgba(16,30,56,.88)" stroke="rgba(255,255,255,.22)" stroke-width="0.8"/>
  `;

  /**
   * Rendert een reeks punten als klikbare SVG-groepen met label.
   * Kleur van punt en tekst volgt statusbetekenis:
   * - lichtblauw: nieuw in 2026
   * - lichtgrijs: niet meer actief in 2026 (afgerond)
   * - wit: overige initiatieven
   */
  function renderLayer(points) {
    return points.map(pt => {
      const dotFill = isNewIn2026(pt.p)
        ? 'rgb(147, 214, 255)'
        : (isInactiveIn2026(pt.p) ? 'rgba(170, 177, 191, .96)' : 'rgba(255,255,255,.9)');
      const titleEl = pt.fullName !== pt.label
        ? `<title>${escapeHtml(pt.fullName)}</title>`
        : '';
      // Bereken leader line na nudge: start op rand van dot richting huidig labelanker, eind op labelanker
      const ldx = pt.lx - pt.x;
      const ldy = pt.ly - pt.y;
      const ldist = Math.hypot(ldx, ldy) || 1;
      const ll1x = (pt.x + (ldx / ldist) * (DIAGRAM_DOT_R + 0.5)).toFixed(2);
      const ll1y = (pt.y + (ldy / ldist) * (DIAGRAM_DOT_R + 0.5)).toFixed(2);
      // Eindpunt: de kant van de tekst die het dichtst bij de dot zit
      const ll2x = (pt.anchor === 'end'   ? pt.lx :
                    pt.anchor === 'start' ? pt.lx :
                    pt.lx).toFixed(2);
      const ll2y = pt.ly.toFixed(2);
      return `
      <g class="diagramItem" data-slug="${escapeHtml(pt.p.id)}" aria-label="${escapeHtml(pt.fullName)}">
        ${titleEl}
        <line class="diagramLeader" x1="${ll1x}" y1="${ll1y}" x2="${ll2x}" y2="${ll2y}" stroke="${dotFill}" stroke-width="0.5" stroke-opacity="0.45" stroke-linecap="round"/>
        <circle class="diagramDot" cx="${pt.x}" cy="${pt.y}" r="${DIAGRAM_DOT_R}" fill="${dotFill}"/>
        ${labelBackground ? (() => {
          const textW = pt.labelW;
          const padX = 2.4;
          const padY = 1.4;
          const boxW = textW + (padX * 2);
          const boxH = labelFontSize + (padY * 2);
          const boxX = pt.anchor === 'middle'
            ? pt.lx - (boxW / 2)
            : (pt.anchor === 'start' ? pt.lx - padX : pt.lx - boxW + padX);
          const boxY = pt.ly - (boxH / 2);
          return `<rect class="diagramLabelBg" x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="1.8" ry="1.8" fill="${labelBackgroundColor}" fill-opacity="${labelBackgroundOpacity}"/>`;
        })() : ''}
        <text class="diagramLabel" x="${pt.lx}" y="${pt.ly}" fill="${labelColor(pt.p)}" font-size="${labelFontSize}"
              text-anchor="${pt.anchor}" dominant-baseline="middle" xml:space="preserve">
          ${escapeHtml(pt.label)}
        </text>
      </g>
    `;
    }).join('');
  }

  svg += renderLayer(innerPts);
  svg += renderLayer(middlePts);
  svg += renderLayer(outerPts);

  svg += '</svg>';
  container.innerHTML = svg;

  // --- Klik-, hover- en toetsenbordafhandeling ----------------------------
  const items = container.querySelectorAll('.diagramItem');

  function clearHighlights() {
    for (const item of items) {
      item.classList.remove('is-highlighted');
    }
  }

  function setHighlighted(el, on) {
    if (!on) {
      el.classList.remove('is-highlighted');
      return;
    }

    clearHighlights();
    el.classList.add('is-highlighted');
    if (el.parentNode) {
      el.parentNode.appendChild(el);
    }
  }

  container.addEventListener('mouseleave', clearHighlights);
  container.addEventListener('blur', clearHighlights, true);

  for (const el of items) {
    const slug = el.getAttribute('data-slug');
    if (!slug) continue;
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('mouseenter', () => setHighlighted(el, true));
    el.addEventListener('mouseleave', () => setHighlighted(el, false));
    el.addEventListener('focus', () => setHighlighted(el, true));
    el.addEventListener('blur', () => setHighlighted(el, false));
    el.addEventListener('click', () => onItemClick(slug));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onItemClick(slug);
      }
    });
  }
}
