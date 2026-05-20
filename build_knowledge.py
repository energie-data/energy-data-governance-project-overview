"""
Build knowledge_chunks.json from site JSON sources for the RAG chatbot API.
Run from repo root: python build_knowledge.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).parent
DATA = ROOT / "data"
OUT = DATA / "knowledge_chunks.json"

MAX_CHUNK_CHARS = 6000


def _scalar(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "ja" if value else "nee"
    return str(value).strip()


def _field(label: str, value: Any) -> Optional[str]:
    """Eén eigenschap: 'Label: waarde'."""
    if value is None:
        return None
    if isinstance(value, list):
        return _join_list(label, value)
    text = _scalar(value)
    if not text:
        return None
    return f"{label}: {text}"


def _join_list(label: str, values: Any) -> Optional[str]:
    if not isinstance(values, list) or not values:
        return None
    items = [_scalar(v) for v in values]
    items = [v for v in items if v]
    if not items:
        return None
    return f"{label}: " + "; ".join(items)


def _format_links(links: Any) -> Optional[str]:
    if not isinstance(links, list) or not links:
        return None
    lines: List[str] = []
    for item in links:
        if isinstance(item, str) and item.strip():
            lines.append(f"- {item.strip()}")
        elif isinstance(item, dict):
            url = _scalar(item.get("url"))
            label = _scalar(item.get("label")) or url
            if url:
                lines.append(f"- {label}: {url}")
    if not lines:
        return None
    return "Externe links:\n" + "\n".join(lines)


def _years(start: Any, end: Any) -> Optional[str]:
    if start is None and end is None:
        return None
    end_s = _scalar(end) if end is not None else "heden"
    start_s = _scalar(start) if start is not None else "—"
    return f"Looptijd: {start_s}–{end_s}"


def _lines(*parts: Optional[str]) -> str:
    return "\n".join(p.strip() for p in parts if p and str(p).strip())


def _split_text(text: str, max_len: int = MAX_CHUNK_CHARS) -> List[str]:
    text = text.strip()
    if len(text) <= max_len:
        return [text]
    parts: List[str] = []
    start = 0
    while start < len(text):
        end = min(start + max_len, len(text))
        if end < len(text):
            break_at = text.rfind("\n\n", start, end)
            if break_at <= start:
                break_at = text.rfind(". ", start, end)
            if break_at > start:
                end = break_at + 1
        parts.append(text[start:end].strip())
        start = end
    return [p for p in parts if p]


def _emit(
    chunks: List[Dict[str, Any]],
    *,
    id: str,
    type: str,
    title: str,
    text: str,
    url: str,
    part: int = 0,
    total: int = 1,
) -> None:
    body = text.strip()
    if not body:
        return
    chunk_id = id if total == 1 else f"{id}:part{part + 1}"
    chunk_title = title if total == 1 else f"{title} ({part + 1}/{total})"
    chunks.append(
        {
            "id": chunk_id,
            "type": type,
            "title": chunk_title,
            "text": body,
            "url": url,
        }
    )


def _emit_split(
    chunks: List[Dict[str, Any]],
    *,
    id: str,
    type: str,
    title: str,
    text: str,
    url: str,
) -> None:
    parts = _split_text(text)
    total = len(parts)
    for i, part in enumerate(parts):
        _emit(chunks, id=id, type=type, title=title, text=part, url=url, part=i, total=total)


def _interop_label(defs: Dict[str, Any], def_key: str, code: Any) -> str:
    if not code:
        return ""
    code_s = _scalar(code)
    categories = (defs.get(def_key) or {}).get("categorieen") or []
    if isinstance(categories, list):
        for cat in categories:
            if isinstance(cat, dict) and cat.get("code") == code_s:
                return _scalar(cat.get("label")) or code_s
    return code_s


def build_use_case_glossary(chunks: List[Dict[str, Any]], schema: Dict[str, Any]) -> Dict[str, str]:
    """Legenda MD-velden + mapping veldnaam → label voor use cases."""
    lines = [
        "Legenda metadata use cases (velden MD1–MD9 en MD5 data_consumer).",
        "Gebruik deze definities bij het interpreteren van use-case kenmerken.",
    ]
    field_labels: Dict[str, str] = {}

    for key, defn in schema.items():
        if not isinstance(defn, dict):
            continue
        label = defn.get("label") or key
        field_labels[key] = label
        desc = defn.get("beschrijving") or ""
        lines.append(f"\n{label}")
        if desc:
            lines.append(f"  Omschrijving: {desc}")
        waarden = defn.get("waarden")
        if isinstance(waarden, list) and waarden:
            lines.append("  Mogelijke waarden: " + "; ".join(str(w) for w in waarden))

    _emit(
        chunks,
        id="glossary:use_case_metadata",
        type="glossary",
        title="Legenda use-case metadata (MD1–MD9)",
        text=_lines(*lines),
        url="overzicht-use-cases.html",
    )
    return field_labels


def build_use_cases(chunks: List[Dict[str, Any]]) -> None:
    path = DATA / "use_cases_2026.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    schema = data.get("metadata_schema") or {}
    labels = build_use_case_glossary(chunks, schema)

    for uc in data.get("use_cases") or []:
        pid = (uc.get("project_id") or "").strip()
        naam = (uc.get("projectnaam") or pid or "Use case").strip()

        text = _lines(
            f"# Use case: {naam}",
            _field("Project-ID", pid),
            _field("Projectnaam", naam),
            _field("Oorsprong", uc.get("oorsprong")),
            _field("Organisaties", uc.get("organisaties")),
            "",
            "## Beschrijving",
            _field("Beschrijving", uc.get("beschrijving")),
            _field("Gebruik energiedata", uc.get("gebruik_energiedata")),
            "",
            "## Metadata (gestructureerde kenmerken)",
            _field(labels.get("MD1_status", "MD1 Status"), uc.get("MD1_status")),
            _join_list(labels.get("MD2_projectdoel", "MD2 Projectdoel"), uc.get("MD2_projectdoel")),
            _join_list(labels.get("MD3_type_energiedata", "MD3 Type energiedata"), uc.get("MD3_type_energiedata")),
            _join_list(labels.get("MD4_databron", "MD4 Databron"), uc.get("MD4_databron")),
            _join_list(labels.get("data_consumer", "MD5 Data consument"), uc.get("data_consumer")),
            _join_list(labels.get("MD6_governance", "MD6 Governance"), uc.get("MD6_governance")),
            _join_list(labels.get("MD7_toepassing", "MD7 Toepassing"), uc.get("MD7_toepassing")),
            _join_list(
                labels.get("MD8_granulariteit_niveau", "MD8 Granulariteit niveau"),
                uc.get("MD8_granulariteit_niveau"),
            ),
            _join_list(
                labels.get("MD9_granulariteit_frequentie", "MD9 Granulariteit frequentie"),
                uc.get("MD9_granulariteit_frequentie"),
            ),
            "",
            _format_links(uc.get("links")),
        )

        _emit_split(
            chunks,
            id=f"use_case:{pid}",
            type="use_case",
            title=naam,
            text=text,
            url=f"overzicht-use-cases.html?id={pid}",
        )


def build_interop_glossary(chunks: List[Dict[str, Any]], defs: Dict[str, Any]) -> None:
    lines = [
        "Legenda filtermetadata initiatieven interoperabiliteit.",
        "Codes in de JSON worden op de website getoond met deze labels.",
    ]
    for key, defn in defs.items():
        if not isinstance(defn, dict):
            continue
        label = defn.get("label") or key
        desc = defn.get("omschrijving") or ""
        lines.append(f"\n{label} (veld: {key})")
        if desc:
            lines.append(f"  Omschrijving: {desc}")
        cats = defn.get("categorieen")
        if isinstance(cats, list):
            for cat in cats:
                if isinstance(cat, dict):
                    lines.append(f"  - {cat.get('code', '')}: {cat.get('label', '')}")

    _emit(
        chunks,
        id="glossary:interoperability_metadata",
        type="glossary",
        title="Legenda interoperabiliteit filtermetadata",
        text=_lines(*lines),
        url="initiatieven-interoperabiliteit.html",
    )


def build_data_sharing(chunks: List[Dict[str, Any]], year: int) -> None:
    path = DATA / f"projects_data_sharing_{year}.json"
    projects = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(projects, list):
        return
    for p in projects:
        slug = (p.get("id") or "").strip()
        naam = (p.get("naam") or slug or "Initiatief").strip()
        korte = (p.get("korte_referentie") or {}) if isinstance(p.get("korte_referentie"), dict) else {}
        ontw = (p.get("ontwikkelingen_2023_2026") or {}) if isinstance(p.get("ontwikkelingen_2023_2026"), dict) else {}
        highlights = ontw.get("hoogtepunten") or []

        hl_lines: List[str] = []
        if isinstance(highlights, list):
            for h in highlights:
                if isinstance(h, dict):
                    hl_lines.append(
                        f"- {_scalar(h.get('datum'))}: {_scalar(h.get('titel'))} — {_scalar(h.get('detail'))}"
                    )

        text = _lines(
            f"# Initiatief data delen (inventarisatie {year})",
            _field("ID", slug),
            _field("Naam", naam),
            _field("Status", p.get("status")),
            _field("Scope", p.get("scope")),
            _field("Geografische scope", p.get("geografische_scope")),
            _field("Eigenaar", p.get("eigenaar")),
            _years(p.get("jaar_start"), p.get("jaar_einde")),
            _join_list("Tags", p.get("tags")),
            "",
            "## Samenvatting",
            _field("Samenvatting", p.get("samenvatting")),
            "",
            "## Korte referentie",
            _field("Primair doel", korte.get("primair_doel")),
            _join_list("Belangrijkste resultaten", korte.get("belangrijkste_resultaten")),
            _join_list("Doelgebruikers", korte.get("doelgebruikers")),
            "",
            "## Ontwikkelingen 2023–2026" if year == 2026 or ontw else None,
            _field("Referentiedatum ontwikkelingen", ontw.get("referentiedatum")) if ontw else None,
            _field("Samenvatting ontwikkelingen", ontw.get("samenvatting")) if ontw else None,
            "Hoogtepunten:\n" + "\n".join(hl_lines) if hl_lines else None,
            "",
            _format_links(p.get("links")),
        )

        _emit_split(
            chunks,
            id=f"data_sharing_{year}:{slug}",
            type="data_sharing",
            title=f"{naam} (data delen {year})",
            text=text,
            url=f"project.html?slug={slug}&year={year}",
        )


def build_interoperability(chunks: List[Dict[str, Any]]) -> None:
    path = DATA / "projects_interoperability.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    defs = data.get("filter_metadata_definities") or {}
    build_interop_glossary(chunks, defs)

    for i in data.get("initiatieven") or []:
        slug = (i.get("id") or "").strip()
        naam = (i.get("naam") or slug or "Initiatief").strip()

        text = _lines(
            f"# Initiatief interoperabiliteit: {naam}",
            _field("ID", slug),
            _field("Naam", naam),
            _field("Typologie", i.get("typologie_label") or i.get("typologie")),
            _field("Typologie (code)", i.get("typologie")),
            _field("Familie", i.get("familie")),
            _field("Land van oorsprong", i.get("land_van_oorsprong")),
            _field("Regio", i.get("regio")),
            _field("Geografische scope", i.get("geografische_scope")),
            _field("Organisatie / consortium", i.get("organisatie_of_consortium")),
            _years(i.get("jaar_start"), i.get("jaar_einde")),
            "",
            "## Filtermetadata (gestructureerde kenmerken)",
            _field(
                "Type initiatief",
                _interop_label(defs, "type_initiatief", i.get("type_initiatief")),
            ),
            _field("Beheervorm", _interop_label(defs, "beheer_vorm", i.get("beheer_vorm"))),
            _field(
                "Inhoudelijke focus",
                _interop_label(defs, "inhoudelijke_focus", i.get("inhoudelijke_focus")),
            ),
            _field("Regio-cluster", _interop_label(defs, "regio_cluster", i.get("regio_cluster"))),
            _field(
                "Volwassenheid 2026",
                _interop_label(defs, "volwassenheid_2026", i.get("volwassenheid_2026")),
            ),
            _field(
                "Relevantie H6.1",
                _interop_label(defs, "relevantie_h61", i.get("relevantie_h61")),
            ),
            _field(
                "Oorsprong in rapport",
                _interop_label(defs, "oorsprong_in_rapport", i.get("oorsprong_in_rapport")),
            ),
            _field(
                "Bruikbaarheid e-ontologie",
                _interop_label(defs, "bruikbaarheid_e_ontologie", i.get("bruikbaarheid_e_ontologie")),
            ),
            _field("Advies/toelichting (rapport)", i.get("advies_toelichting")),
            "",
            "## Omschrijvingen",
            _field("Korte omschrijving", i.get("korte_omschrijving")),
            _field("Uitgebreide omschrijving", i.get("uitgebreide_omschrijving")),
            _field("Toepassing in praktijk", i.get("toepassing_in_praktijk")),
            "",
            "## Status en relevantie",
            _field("Status 2023", i.get("status_2023")),
            _field("Status 2026", i.get("status_2026")),
            _field("Relevantie semantiek", i.get("relevantie_semantiek")),
            _field("Relevantie interoperabiliteit", i.get("relevantie_interoperabiliteit")),
            _field("Relevantie H6.1 (toelichting)", i.get("relevantie_h61_toelichting")),
            _field(
                "Bruikbaarheid e-ontologie (toelichting)",
                i.get("bruikbaarheid_e_ontologie_toelichting"),
            ),
            _field("Opmerkingen", i.get("opmerkingen")),
            "",
            _join_list("Alternatieve namen", i.get("alternatieve_namen")),
            _join_list("Opgeleverd", i.get("opgeleverd")),
            _join_list("Verwante initiatieven (ID's)", i.get("verwante_initiatieven")),
            "",
            _field("Officiële website", i.get("website_official")),
            _format_links(i.get("aanvullende_websites")),
        )

        _emit_split(
            chunks,
            id=f"interoperability:{slug}",
            type="interoperability",
            title=naam,
            text=text,
            url=f"project-interoperabiliteit.html?slug={slug}",
        )


def build_recommendations(chunks: List[Dict[str, Any]]) -> None:
    path = DATA / "recommendations_2023.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    for rec in data.get("recommendations") or []:
        rec_id = (rec.get("id") or "").strip()
        header = (rec.get("header") or f"Aanbeveling {rec_id}").strip()
        overall = rec.get("overallStatusLabel") or rec.get("overallStatusKey") or ""
        subs = rec.get("subRecommendations") or []
        for sub in subs:
            sub_id = (sub.get("id") or "").strip()
            title = (sub.get("title") or sub_id).strip()
            text = _lines(
                f"# Reflectie aanbeveling 2023",
                _field("Hoofdaanbeveling", header),
                _field("Deelaanbeveling", title),
                _field("ID deelaanbeveling", sub_id),
                _field("Voortgang hoofdaanbeveling (totaal)", overall),
                _field("Status deelaanbeveling", sub.get("statusLabel")),
                _field("Statuscode", sub.get("statusKey")),
                "",
                "## Tekst aanbeveling 2023",
                _field("Citaat", sub.get("quote")),
                "",
                "## Voortgang 2023–2026",
                _field("Toelichting status", sub.get("statusExplanation")),
            )
            _emit(
                chunks,
                id=f"recommendation:{sub_id}",
                type="recommendation",
                title=title,
                text=text,
                url="reflectie-aanbevelingen-2023.html",
            )


def build_intro(chunks: List[Dict[str, Any]]) -> None:
    intro_text = _lines(
        "# Rapport: Data governance en data delen in het energiedomein",
        "Stand van zaken 2026. Actualisatie van het onderzoek van maart 2023.",
        "",
        "## Onderdelen op de website",
        "- index.html — introductie",
        "- reflectie-aanbevelingen-2023.html — voortgang aanbevelingen 2023",
        "- initiatieven-interoperabiliteit.html — semantiek en interoperabiliteit",
        "- initiatieven-data-delen.html — initiatieven data delen (2023 en 2026)",
        "- overzicht-use-cases.html — 69 use cases met metadata MD1–MD9",
        "- aanbevelingen.html — nieuwe aanbevelingen",
        "",
        "Use cases hebben gestructureerde metadata (status, projectdoel, type energiedata, "
        "databron, data consument, governance, toepassing, granulariteit). "
        "Initiatieven interoperabiliteit hebben filtermetadata (type, beheervorm, focus, regio, volwassenheid, relevantie).",
    )
    _emit(
        chunks,
        id="intro:rapport",
        type="intro",
        title="Introductie rapport",
        text=intro_text,
        url="index.html",
    )


def main() -> None:
    chunks: List[Dict[str, Any]] = []
    build_intro(chunks)
    build_use_cases(chunks)
    build_data_sharing(chunks, 2023)
    build_data_sharing(chunks, 2026)
    build_interoperability(chunks)
    build_recommendations(chunks)

    payload = {
        "meta": {
            "version": 2,
            "chunk_count": len(chunks),
            "sources": [
                "use_cases_2026.json",
                "projects_data_sharing_2023.json",
                "projects_data_sharing_2026.json",
                "projects_interoperability.json",
                "recommendations_2023.json",
            ],
        },
        "chunks": chunks,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(chunks)} chunks to {OUT}")


if __name__ == "__main__":
    main()
