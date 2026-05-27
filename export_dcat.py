import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin


ROOT = Path(__file__).parent
DATA_DIR = ROOT / "data"
OUT_DIR = DATA_DIR / "dcat"

DATASETS = [
    {
        "id": "projects-data-sharing-2026",
        "source": DATA_DIR / "projects_data_sharing_2026.json",
        "title_nl": "Initiatieven data delen 2026",
        "description_nl": "Overzicht van initiatieven rond data delen in het energiedomein (2026).",
        "landing_page": "initiatieven-data-delen.html",
        "distribution_path": "data/projects_data_sharing_2026.json",
        "keywords": ["energiedata", "data delen", "governance", "initiatieven", "Nederland"],
        "theme": "https://data.overheid.nl/ondersteuning/dcat#Energie",
    },
    {
        "id": "projects-interoperability-2026",
        "source": DATA_DIR / "projects_interoperability.json",
        "title_nl": "Initiatieven semantiek en interoperabiliteit 2026",
        "description_nl": "Overzicht van semantiek- en interoperabiliteitsinitiatieven in het energiedomein.",
        "landing_page": "initiatieven-interoperabiliteit.html",
        "distribution_path": "data/projects_interoperability.json",
        "keywords": ["interoperabiliteit", "semantiek", "ontologie", "standaarden", "energiedata"],
        "theme": "https://data.overheid.nl/ondersteuning/dcat#Energie",
    },
    {
        "id": "use-cases-2026",
        "source": DATA_DIR / "use_cases_2026.json",
        "title_nl": "Use cases energiedata 2026",
        "description_nl": "Database met use cases en projecten rond energiedatatoepassingen in Nederland.",
        "landing_page": "overzicht-use-cases.html",
        "distribution_path": "data/use_cases_2026.json",
        "keywords": ["use cases", "energiedata", "projecten", "metadata", "Nederland"],
        "theme": "https://data.overheid.nl/ondersteuning/dcat#Energie",
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Exporteer DCAT-AP-NL metadata (JSON-LD en Turtle) voor de 3 JSON-kennisproducten."
    )
    parser.add_argument(
        "--base-url",
        required=True,
        help="Publieke basis-URL van de site, bijvoorbeeld https://example.github.io/energy-data-governance-project-overview/",
    )
    parser.add_argument(
        "--catalog-id",
        default="energiedata-governance-catalogus",
        help="ID-segment voor de catalogus URI.",
    )
    parser.add_argument(
        "--publisher-name",
        default="Energie Data Governance Project",
        help="Naam van de catalogusbeheerder.",
    )
    parser.add_argument(
        "--publisher-uri",
        default="https://example.org/id/organization/energy-data-governance-project",
        help="URI van de publisher organisatie.",
    )
    parser.add_argument(
        "--contact-name",
        default="Beheerteam Energiedata",
        help="Contactnaam voor catalogus en datasets.",
    )
    parser.add_argument(
        "--contact-email",
        default="mailto:info@example.org",
        help="Contact e-mail (mailto:).",
    )
    parser.add_argument(
        "--license-uri",
        default="http://creativecommons.org/licenses/by/4.0/",
        help="Licentie URI voor catalogus en datasets.",
    )
    parser.add_argument(
        "--language",
        default="nl",
        help="Taalcode voor teksten in de catalogus.",
    )
    return parser.parse_args()


def ensure_mailto(email: str) -> str:
    if email.startswith("mailto:"):
        return email
    return f"mailto:{email}"


def strip_trailing_slash(url: str) -> str:
    return url.rstrip("/") + "/"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "item"


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def normalize_date(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not value:
        return None
    try:
        if len(value) == 10:
            return datetime.strptime(value, "%Y-%m-%d").date().isoformat()
        if len(value) == 4 and value.isdigit():
            return f"{value}-01-01"
    except ValueError:
        return None
    return None


def file_modified_iso(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).replace(microsecond=0).isoformat()


def json_distribution_size(path: Path) -> int:
    return path.stat().st_size


def extract_dataset_summary(dataset_id: str, payload: Any) -> Dict[str, Any]:
    summary: Dict[str, Any] = {}
    if dataset_id == "projects-data-sharing-2026" and isinstance(payload, list):
        summary["record_count"] = len(payload)
        statuses = sorted({item.get("status", "").strip() for item in payload if isinstance(item, dict) and isinstance(item.get("status"), str) and item.get("status").strip()})
        if statuses:
            summary["statuses"] = statuses
    elif dataset_id == "projects-interoperability-2026" and isinstance(payload, dict):
        initiatives = payload.get("initiatieven")
        if isinstance(initiatives, list):
            summary["record_count"] = len(initiatives)
        defs = payload.get("filter_metadata_definities")
        if isinstance(defs, dict):
            summary["filter_dimensions"] = sorted(defs.keys())
    elif dataset_id == "use-cases-2026" and isinstance(payload, dict):
        use_cases = payload.get("use_cases")
        if isinstance(use_cases, list):
            summary["record_count"] = len(use_cases)
        schema = payload.get("metadata_schema")
        if isinstance(schema, dict):
            summary["metadata_dimensions"] = sorted(schema.keys())
    return summary


def make_catalog_node(base_url: str, args: argparse.Namespace, dataset_uris: List[str]) -> Dict[str, Any]:
    catalog_uri = urljoin(base_url, f"id/catalog/{slugify(args.catalog_id)}")
    return {
        "@id": catalog_uri,
        "@type": "dcat:Catalog",
        "dct:title": {"@value": "Catalogus energiedata governance kennisproducten", "@language": args.language},
        "dct:description": {
            "@value": "DCAT-AP-NL catalogus voor drie JSON-kennisproducten van het energiedata-governance overzicht.",
            "@language": args.language,
        },
        "dct:publisher": {"@id": args.publisher_uri},
        "dct:language": args.language,
        "dct:license": {"@id": args.license_uri},
        "dct:modified": iso_now(),
        "dcat:dataset": [{"@id": uri} for uri in dataset_uris],
        "dcat:themeTaxonomy": [
            {"@id": urljoin(base_url, "id/conceptscheme/interoperability-filters")},
            {"@id": urljoin(base_url, "id/conceptscheme/use-case-metadata-schema")},
        ],
        "dcat:contactPoint": {"@id": urljoin(base_url, "id/contact/main")},
        "foaf:homepage": {"@id": base_url},
    }


def make_publisher_node(args: argparse.Namespace) -> Dict[str, Any]:
    return {
        "@id": args.publisher_uri,
        "@type": "foaf:Organization",
        "foaf:name": args.publisher_name,
    }


def make_contact_node(base_url: str, args: argparse.Namespace) -> Dict[str, Any]:
    return {
        "@id": urljoin(base_url, "id/contact/main"),
        "@type": "vcard:Kind",
        "vcard:fn": args.contact_name,
        "vcard:hasEmail": {"@id": ensure_mailto(args.contact_email)},
    }


def make_dataset_and_distribution(
    base_url: str,
    args: argparse.Namespace,
    cfg: Dict[str, Any],
    payload: Any,
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    dataset_uri = urljoin(base_url, f"id/dataset/{cfg['id']}")
    distribution_uri = urljoin(base_url, f"id/distribution/{cfg['id']}-json")
    source_path = cfg["source"]
    source_meta = payload.get("meta", {}) if isinstance(payload, dict) else {}

    title = source_meta.get("titel") if isinstance(source_meta, dict) else None
    description = source_meta.get("beschrijving") if isinstance(source_meta, dict) else None
    modified = normalize_date(source_meta.get("datum")) if isinstance(source_meta, dict) else None
    if not modified:
        modified = file_modified_iso(source_path)

    landing_page = urljoin(base_url, cfg["landing_page"])
    download_url = urljoin(base_url, cfg["distribution_path"])
    dist_size = json_distribution_size(source_path)

    dataset_node: Dict[str, Any] = {
        "@id": dataset_uri,
        "@type": "dcat:Dataset",
        "dct:identifier": cfg["id"],
        "dct:title": {"@value": title or cfg["title_nl"], "@language": args.language},
        "dct:description": {"@value": description or cfg["description_nl"], "@language": args.language},
        "dct:language": args.language,
        "dct:publisher": {"@id": args.publisher_uri},
        "dct:license": {"@id": args.license_uri},
        "dct:modified": modified,
        "dcat:keyword": [{"@value": keyword, "@language": args.language} for keyword in cfg["keywords"]],
        "dcat:theme": {"@id": cfg["theme"]},
        "dcat:landingPage": {"@id": landing_page},
        "dcat:contactPoint": {"@id": urljoin(base_url, "id/contact/main")},
        "dcat:distribution": {"@id": distribution_uri},
    }

    summary = extract_dataset_summary(cfg["id"], payload)
    if summary:
        dataset_node["adms:versionNotes"] = {
            "@value": "Automatisch afgeleid: " + json.dumps(summary, ensure_ascii=False),
            "@language": args.language,
        }

    distribution_node: Dict[str, Any] = {
        "@id": distribution_uri,
        "@type": "dcat:Distribution",
        "dct:title": {"@value": f"JSON distributie van {cfg['title_nl']}", "@language": args.language},
        "dct:description": {"@value": "Machineleesbare bron in JSON-formaat.", "@language": args.language},
        "dct:license": {"@id": args.license_uri},
        "dct:format": {"@id": "http://publications.europa.eu/resource/authority/file-type/JSON"},
        "dcat:mediaType": {"@id": "https://www.iana.org/assignments/media-types/application/json"},
        "dcat:downloadURL": {"@id": download_url},
        "dcat:accessURL": {"@id": download_url},
        "dcat:byteSize": dist_size,
    }

    return dataset_node, distribution_node


def build_interoperability_skos(base_url: str, payload: Dict[str, Any], language: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    scheme_uri = urljoin(base_url, "id/conceptscheme/interoperability-filters")
    out.append(
        {
            "@id": scheme_uri,
            "@type": "skos:ConceptScheme",
            "dct:title": {"@value": "Interoperabiliteit filtermetadata", "@language": language},
            "dct:description": {"@value": "SKOS conceptscheme afgeleid uit filter_metadata_definities.", "@language": language},
        }
    )
    defs = payload.get("filter_metadata_definities", {})
    if not isinstance(defs, dict):
        return out

    top_concepts: List[Dict[str, str]] = []
    for dimension_key, dimension in defs.items():
        if not isinstance(dimension, dict):
            continue
        dimension_uri = urljoin(base_url, f"id/concept/interoperability/{slugify(dimension_key)}")
        top_concepts.append({"@id": dimension_uri})
        out.append(
            {
                "@id": dimension_uri,
                "@type": "skos:Concept",
                "skos:inScheme": {"@id": scheme_uri},
                "skos:prefLabel": {"@value": str(dimension.get("label", dimension_key)), "@language": language},
                "skos:definition": {"@value": str(dimension.get("omschrijving", "")), "@language": language},
                "skos:topConceptOf": {"@id": scheme_uri},
            }
        )
        cats = dimension.get("categorieen")
        if not isinstance(cats, list):
            continue
        for cat in cats:
            if not isinstance(cat, dict):
                continue
            code = str(cat.get("code", "")).strip()
            if not code:
                continue
            cat_uri = urljoin(base_url, f"id/concept/interoperability/{slugify(dimension_key)}/{slugify(code)}")
            out.append(
                {
                    "@id": cat_uri,
                    "@type": "skos:Concept",
                    "skos:inScheme": {"@id": scheme_uri},
                    "skos:broader": {"@id": dimension_uri},
                    "skos:prefLabel": {"@value": str(cat.get("label", code)), "@language": language},
                    "skos:notation": code,
                }
            )
    if top_concepts:
        out[0]["skos:hasTopConcept"] = top_concepts
    return out


def build_use_case_schema_skos(base_url: str, payload: Dict[str, Any], language: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    scheme_uri = urljoin(base_url, "id/conceptscheme/use-case-metadata-schema")
    out.append(
        {
            "@id": scheme_uri,
            "@type": "skos:ConceptScheme",
            "dct:title": {"@value": "Use-case metadata schema", "@language": language},
            "dct:description": {"@value": "SKOS conceptscheme afgeleid uit metadata_schema.", "@language": language},
        }
    )
    schema = payload.get("metadata_schema", {})
    if not isinstance(schema, dict):
        return out

    top_concepts: List[Dict[str, str]] = []
    for key, dim in schema.items():
        if not isinstance(dim, dict):
            continue
        dim_uri = urljoin(base_url, f"id/concept/use-case-schema/{slugify(key)}")
        top_concepts.append({"@id": dim_uri})
        out.append(
            {
                "@id": dim_uri,
                "@type": "skos:Concept",
                "skos:inScheme": {"@id": scheme_uri},
                "skos:prefLabel": {"@value": str(dim.get("label", key)), "@language": language},
                "skos:definition": {"@value": str(dim.get("beschrijving", "")), "@language": language},
                "skos:topConceptOf": {"@id": scheme_uri},
            }
        )
        values = dim.get("waarden")
        if not isinstance(values, list):
            continue
        for idx, raw_value in enumerate(values, start=1):
            val = str(raw_value).strip()
            if not val:
                continue
            child_uri = urljoin(base_url, f"id/concept/use-case-schema/{slugify(key)}/{idx:02d}-{slugify(val)[:40]}")
            out.append(
                {
                    "@id": child_uri,
                    "@type": "skos:Concept",
                    "skos:inScheme": {"@id": scheme_uri},
                    "skos:broader": {"@id": dim_uri},
                    "skos:prefLabel": {"@value": val, "@language": language},
                }
            )
    if top_concepts:
        out[0]["skos:hasTopConcept"] = top_concepts
    return out


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def lit(value: str, language: Optional[str] = None, datatype: Optional[str] = None) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
    if language:
        return f"\"{escaped}\"@{language}"
    if datatype:
        return f"\"{escaped}\"^^<{datatype}>"
    return f"\"{escaped}\""


def obj_to_ttl(value: Any) -> str:
    if isinstance(value, dict):
        if "@id" in value:
            return f"<{value['@id']}>"
        if "@value" in value:
            lang = value.get("@language")
            dtype = value.get("@type")
            return lit(str(value["@value"]), language=lang, datatype=dtype)
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return str(value)
    return lit(str(value))


def node_to_ttl(node: Dict[str, Any]) -> str:
    subject = f"<{node['@id']}>"
    predicates: List[str] = []
    for key, val in node.items():
        if key == "@id":
            continue
        predicate = "a" if key == "@type" else key
        values = val if isinstance(val, list) else [val]
        objects = ", ".join(obj_to_ttl(v) for v in values)
        predicates.append(f"  {predicate} {objects}")
    return subject + "\n" + " ;\n".join(predicates) + " .\n"


def write_ttl(path: Path, nodes: List[Dict[str, Any]]) -> None:
    prefixes = """@prefix dcat: <http://www.w3.org/ns/dcat#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
@prefix adms: <http://www.w3.org/ns/adms#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

"""
    body = "".join(node_to_ttl(n) for n in nodes)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(prefixes + body, encoding="utf-8")


def main() -> None:
    args = parse_args()
    base_url = strip_trailing_slash(args.base_url)

    payloads: Dict[str, Any] = {}
    for cfg in DATASETS:
        with cfg["source"].open("r", encoding="utf-8") as fh:
            payloads[cfg["id"]] = json.load(fh)

    dataset_nodes: List[Dict[str, Any]] = []
    distribution_nodes: List[Dict[str, Any]] = []
    for cfg in DATASETS:
        dataset_node, distribution_node = make_dataset_and_distribution(base_url, args, cfg, payloads[cfg["id"]])
        dataset_nodes.append(dataset_node)
        distribution_nodes.append(distribution_node)

    catalog_node = make_catalog_node(base_url, args, [d["@id"] for d in dataset_nodes])
    publisher_node = make_publisher_node(args)
    contact_node = make_contact_node(base_url, args)

    graph_nodes = [catalog_node, publisher_node, contact_node, *dataset_nodes, *distribution_nodes]
    context = {
        "dcat": "http://www.w3.org/ns/dcat#",
        "dct": "http://purl.org/dc/terms/",
        "foaf": "http://xmlns.com/foaf/0.1/",
        "vcard": "http://www.w3.org/2006/vcard/ns#",
        "adms": "http://www.w3.org/ns/adms#",
        "skos": "http://www.w3.org/2004/02/skos/core#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
    }

    catalog_jsonld = {"@context": context, "@graph": graph_nodes}
    write_json(OUT_DIR / "catalog.jsonld", catalog_jsonld)
    write_ttl(OUT_DIR / "catalog.ttl", graph_nodes)

    for cfg, dataset_node, distribution_node in zip(DATASETS, dataset_nodes, distribution_nodes):
        dataset_graph = {"@context": context, "@graph": [dataset_node, distribution_node, publisher_node, contact_node]}
        write_json(OUT_DIR / f"{cfg['id']}.jsonld", dataset_graph)
        write_ttl(OUT_DIR / f"{cfg['id']}.ttl", [dataset_node, distribution_node, publisher_node, contact_node])

    interoperability_payload = payloads["projects-interoperability-2026"]
    interoperability_skos = build_interoperability_skos(base_url, interoperability_payload, args.language)
    use_case_skos = build_use_case_schema_skos(base_url, payloads["use-cases-2026"], args.language)
    write_json(OUT_DIR / "interoperability-filters-skos.jsonld", {"@context": context, "@graph": interoperability_skos})
    write_ttl(OUT_DIR / "interoperability-filters-skos.ttl", interoperability_skos)
    write_json(OUT_DIR / "use-case-metadata-skos.jsonld", {"@context": context, "@graph": use_case_skos})
    write_ttl(OUT_DIR / "use-case-metadata-skos.ttl", use_case_skos)

    print(f"DCAT export klaar in: {OUT_DIR}")
    print("Bestanden:")
    for path in sorted(OUT_DIR.glob("*")):
        print(f"- {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
