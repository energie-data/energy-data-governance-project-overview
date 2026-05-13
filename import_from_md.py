import argparse
import json
import re
from pathlib import Path
from typing import Any, Callable, Dict, List, Tuple


ROOT = Path(__file__).parent

ImportFn = Callable[[Path, Path], None]

_ID_LINE_PREFIX = "## id: "


def _id_from_block(block: List[str]) -> str:
    if not block:
        return ""
    first = block[0].strip()
    if first.startswith(_ID_LINE_PREFIX):
        return first[len(_ID_LINE_PREFIX) :].strip()
    return ""


def _parse_optional_json_number(header: Dict[str, str], key: str) -> Any:
    """Parse jaar_* fields; MD export uses Python None, not JSON null."""
    raw = header.get(key)
    if raw is None:
        return None
    s = raw.strip()
    if not s or s.lower() in ("none", "null"):
        return None
    return json.loads(s)


def _parse_header_block(lines: List[str]) -> Dict[str, str]:
    result: Dict[str, str] = {}
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        result[key.strip()] = value.strip()
    return result


def _read_blocks(md_text: str) -> List[List[str]]:
    lines = md_text.splitlines()
    blocks: List[List[str]] = []
    current: List[str] = []
    for line in lines:
        if line.startswith("## id: "):
            if current:
                blocks.append(current)
            current = [line]
        else:
            if current or line.startswith("## id: "):
                current.append(line)
    if current:
        blocks.append(current)
    return blocks


def import_data_sharing(md_path: Path, json_path: Path) -> None:
    text = md_path.read_text(encoding="utf-8")
    blocks = _read_blocks(text)
    out_items: List[Dict[str, Any]] = []

    for block in blocks:
        header_lines: List[str] = []
        idx = 0
        while idx < len(block) and not block[idx].startswith("### "):
            header_lines.append(block[idx])
            idx += 1
        header = _parse_header_block(header_lines)
        item: Dict[str, Any] = {
            "id": _id_from_block(block) or header.get("id", ""),
            "naam": header.get("naam", ""),
            "status": header.get("status", ""),
            "scope": header.get("scope", ""),
            "geografische_scope": header.get("geografische_scope", ""),
            "eigenaar": header.get("eigenaar", ""),
            "jaar_start": _parse_optional_json_number(header, "jaar_start"),
            "jaar_einde": _parse_optional_json_number(header, "jaar_einde"),
        }
        tags_str = header.get("tags", "")
        if tags_str:
            item["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]
        else:
            item["tags"] = []

        # sections
        section: str | None = None
        buffer: List[str] = []
        sections: Dict[str, List[str]] = {}

        for line in block[idx:]:
            if line.startswith("### "):
                if section is not None:
                    sections[section] = buffer
                section = line[4:].strip()
                buffer = []
            else:
                if section is not None:
                    buffer.append(line)
        if section is not None:
            sections[section] = buffer

        def get_text(name: str) -> str:
            return "\n".join(sections.get(name, [])).strip()

        link_lines = sections.get("links", [])
        links: List[Dict[str, str]] = []
        for ln in link_lines:
            ln = ln.strip()
            if not ln.startswith("-"):
                continue
            content = ln[1:].strip()
            parts = [p.strip() for p in content.split(";") if p.strip()]
            link_obj: Dict[str, str] = {}
            for part in parts:
                if "=" not in part:
                    continue
                k, v = part.split("=", 1)
                k, v = k.strip(), v.strip()
                if k == "label":
                    link_obj["label"] = v
                elif k == "url":
                    link_obj["url"] = v
            if link_obj.get("url"):
                links.append(link_obj)
        item["links"] = links

        item["samenvatting"] = get_text("samenvatting")

        kr: Dict[str, Any] = {}
        kr["primair_doel"] = get_text("korte_referentie.primair_doel")
        res_lines = sections.get("korte_referentie.belangrijkste_resultaten", [])
        kr["belangrijkste_resultaten"] = [ln[2:].strip() for ln in res_lines if ln.strip().startswith("-")]
        user_lines = sections.get("korte_referentie.doelgebruikers", [])
        kr["doelgebruikers"] = [ln[2:].strip() for ln in user_lines if ln.strip().startswith("-")]
        item["korte_referentie"] = kr

        dev: Dict[str, Any] = {}
        dev["referentiedatum"] = get_text("ontwikkelingen_2023_2026.referentiedatum")
        dev["samenvatting"] = get_text("ontwikkelingen_2023_2026.samenvatting")
        hl_lines = sections.get("ontwikkelingen_2023_2026.hoogtepunten", [])
        highlights: List[Dict[str, Any]] = []
        for ln in hl_lines:
            ln = ln.strip()
            if not ln.startswith("-"):
                continue
            content = ln[1:].strip()
            parts = [p.strip() for p in content.split(";") if p.strip()]
            h: Dict[str, Any] = {}
            for part in parts:
                if "=" not in part:
                    continue
                k, v = part.split("=", 1)
                k = k.strip()
                v = v.strip()
                if k == "datum":
                    h["datum"] = v
                elif k == "titel":
                    h["titel"] = v
                elif k == "detail":
                    h["detail"] = v
            if h:
                highlights.append(h)
        dev["hoogtepunten"] = highlights
        item["ontwikkelingen_2023_2026"] = dev

        out_items.append(item)

    json_path.write_text(json.dumps(out_items, ensure_ascii=False, indent=2), encoding="utf-8")


def _interop_parse_site_lines(lines: List[str]) -> List[Dict[str, str]]:
    """Parse `- label=…; url=…` regels (zelfde patroon als data-sharing links)."""
    out: List[Dict[str, str]] = []
    for ln in lines:
        ln = ln.strip()
        if not ln.startswith("-"):
            continue
        content = ln[1:].strip()
        parts = [p.strip() for p in content.split(";") if p.strip()]
        obj: Dict[str, str] = {}
        for part in parts:
            if "=" not in part:
                continue
            k, v = part.split("=", 1)
            k, v = k.strip(), v.strip()
            if k == "label":
                obj["label"] = v
            elif k == "url":
                obj["url"] = v
        if obj.get("url"):
            out.append(obj)
    return out


def _interop_bullet_strings(lines: List[str]) -> List[str]:
    out: List[str] = []
    for ln in lines:
        t = ln.strip()
        if not t.startswith("-"):
            continue
        s = t[1:].strip()
        if s:
            out.append(s)
    return out


_INTEROP_HEADER_KEYS = [
    "naam",
    "typologie",
    "typologie_label",
    "familie",
    "land_van_oorsprong",
    "regio",
    "organisatie_of_consortium",
    "website_official",
    "geografische_scope",
    "jaar_start",
    "jaar_einde",
    "volwassenheid_2026",
    "type_initiatief",
    "beheer_vorm",
    "inhoudelijke_focus",
    "regio_cluster",
    "relevantie_h61",
    "oorsprong_in_rapport",
    "bruikbaarheid_e_ontologie",
    "advies_toelichting",
]

_INTEROP_TEXT_SECTIONS = [
    "korte_omschrijving",
    "uitgebreide_omschrijving",
    "toepassing_in_praktijk",
    "status_2023",
    "status_2026",
    "relevantie_semantiek",
    "relevantie_interoperabiliteit",
    "relevantie_h61_toelichting",
    "bruikbaarheid_e_ontologie_toelichting",
    "opmerkingen",
]


def import_interoperability(md_path: Path, json_path: Path) -> None:
    """
    Leest Markdown (v11-formaat) en schrijft `initiatieven` terug naar JSON.
    Behoudt ongewijzigd: `meta`, `bronbijlage`, `filter_metadata_definities`.
    """
    original = json.loads(json_path.read_text(encoding="utf-8"))
    meta = original.get("meta") or {}
    bronbijlage = original.get("bronbijlage")
    filter_metadata_definities = original.get("filter_metadata_definities")

    text = md_path.read_text(encoding="utf-8")
    blocks = _read_blocks(text)
    initiatives: List[Dict[str, Any]] = []

    for block in blocks:
        header_lines: List[str] = []
        idx = 0
        while idx < len(block) and not block[idx].startswith("### "):
            header_lines.append(block[idx])
            idx += 1
        header = _parse_header_block(header_lines)

        section: str | None = None
        buffer: List[str] = []
        sections: Dict[str, List[str]] = {}
        for line in block[idx:]:
            if line.startswith("### "):
                if section is not None:
                    sections[section] = buffer
                section = line[4:].strip()
                buffer = []
            else:
                if section is not None:
                    buffer.append(line)
        if section is not None:
            sections[section] = buffer

        def get_text(name: str) -> str:
            return "\n".join(sections.get(name, [])).strip()

        it: Dict[str, Any] = {
            "id": (_id_from_block(block) or header.get("id", "")).strip(),
        }

        for k in _INTEROP_HEADER_KEYS:
            if k in ("jaar_start", "jaar_einde"):
                it[k] = _parse_optional_json_number(header, k)
            else:
                it[k] = header.get(k, "")

        it["alternatieve_namen"] = _interop_bullet_strings(sections.get("alternatieve_namen", []))
        it["opgeleverd"] = _interop_bullet_strings(sections.get("opgeleverd", []))
        it["verwante_initiatieven"] = _interop_bullet_strings(sections.get("verwante_initiatieven", []))
        it["aanvullende_websites"] = _interop_parse_site_lines(sections.get("aanvullende_websites", []))

        for sec in _INTEROP_TEXT_SECTIONS:
            it[sec] = get_text(sec)

        initiatives.append(it)

    new_root: Dict[str, Any] = {"meta": meta, "initiatieven": initiatives}
    if bronbijlage is not None:
        new_root["bronbijlage"] = bronbijlage
    if filter_metadata_definities is not None:
        new_root["filter_metadata_definities"] = filter_metadata_definities

    json_path.write_text(json.dumps(new_root, ensure_ascii=False, indent=2), encoding="utf-8")


_REC_SUB_SECTION_RE = re.compile(
    r"^sub\.(?P<subid>.+)\.(?P<field>title|quote|statusExplanation|statusKey|statusLabel)$"
)
_REC_LEGEND_SECTION_RE = re.compile(r"^legend\.(?P<key>.+)\.(?P<field>label|description)$")


def import_recommendations_2023(md_path: Path, json_path: Path) -> None:
    text = md_path.read_text(encoding="utf-8")
    blocks = _read_blocks(text)
    legend: List[Dict[str, Any]] = []
    recommendations: List[Dict[str, Any]] = []

    for block in blocks:
        bid = _id_from_block(block)
        header_lines: List[str] = []
        idx = 0
        while idx < len(block) and not block[idx].startswith("### "):
            header_lines.append(block[idx])
            idx += 1
        header = _parse_header_block(header_lines)

        section: str | None = None
        buffer: List[str] = []
        sections: Dict[str, List[str]] = {}
        for line in block[idx:]:
            if line.startswith("### "):
                if section is not None:
                    sections[section] = buffer
                section = line[4:].strip()
                buffer = []
            else:
                if section is not None:
                    buffer.append(line)
        if section is not None:
            sections[section] = buffer

        if bid == "__legend__":
            keys_order: List[str] = []
            by_key: Dict[str, Dict[str, str]] = {}
            for sec_name in sections:
                m = _REC_LEGEND_SECTION_RE.match(sec_name)
                if not m:
                    continue
                key, field = m.group("key"), m.group("field")
                if key not in by_key:
                    keys_order.append(key)
                    by_key[key] = {}
                by_key[key][field] = "\n".join(sections[sec_name]).strip()
            legend = [
                {
                    "key": k,
                    "label": by_key[k].get("label", ""),
                    "description": by_key[k].get("description", ""),
                }
                for k in keys_order
            ]
            continue

        sub_ids_order: List[str] = []
        sub_by_id: Dict[str, Dict[str, str]] = {}
        for sec_name in sections:
            m = _REC_SUB_SECTION_RE.match(sec_name)
            if not m:
                continue
            sub_id, field = m.group("subid"), m.group("field")
            if sub_id not in sub_by_id:
                sub_ids_order.append(sub_id)
                sub_by_id[sub_id] = {}
            sub_by_id[sub_id][field] = "\n".join(sections[sec_name]).strip()

        recommendations.append(
            {
                "id": bid,
                "header": header.get("header", ""),
                "overallStatusKey": header.get("overallStatusKey", ""),
                "overallStatusLabel": header.get("overallStatusLabel", ""),
                "subRecommendations": [
                    {
                        "id": sid,
                        "title": sub_by_id[sid].get("title", ""),
                        "quote": sub_by_id[sid].get("quote", ""),
                        "statusExplanation": sub_by_id[sid].get("statusExplanation", ""),
                        "statusKey": sub_by_id[sid].get("statusKey", ""),
                        "statusLabel": sub_by_id[sid].get("statusLabel", ""),
                    }
                    for sid in sub_ids_order
                ],
            }
        )

    root = {"legend": legend, "recommendations": recommendations}
    json_path.write_text(json.dumps(root, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    jobs: Dict[str, Tuple[ImportFn, Path, Path]] = {
        "data_sharing_2023": (
            import_data_sharing,
            ROOT / "data" / "projects_data_sharing_2023.md",
            ROOT / "data" / "projects_data_sharing_2023.json",
        ),
        "data_sharing_2026": (
            import_data_sharing,
            ROOT / "data" / "projects_data_sharing_2026.md",
            ROOT / "data" / "projects_data_sharing_2026.json",
        ),
        "interoperability": (
            import_interoperability,
            ROOT / "data" / "projects_interoperability.md",
            ROOT / "data" / "projects_interoperability.json",
        ),
        "recommendations_2023": (
            import_recommendations_2023,
            ROOT / "data" / "recommendations_2023.md",
            ROOT / "data" / "recommendations_2023.json",
        ),
    }
    order = list(jobs.keys())
    parser = argparse.ArgumentParser(
        description="Read Markdown under data/ and write JSON consumed by the static site."
    )
    parser.add_argument(
        "--source",
        action="append",
        choices=order,
        metavar="NAME",
        dest="sources",
        help=(
            "Dataset to import (repeat for several). "
            f"Choices: {', '.join(order)}. Default: all."
        ),
    )
    args = parser.parse_args()
    selected = args.sources if args.sources else order
    for name in selected:
        fn, md_path, json_path = jobs[name]
        fn(md_path, json_path)


if __name__ == "__main__":
    main()

