from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from anthropic import Anthropic

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GUIDE_ROOT = REPO_ROOT / "website" / "_guides"
ENV_FILE = REPO_ROOT / ".env"
PROMPT_TEMPLATE_FILE = Path(__file__).with_name("prompt_instructions.txt")
DEFAULT_MODEL = "claude-sonnet-4-6"
DEFAULT_MAX_OUTPUT_TOKENS = 16000

LANGUAGE_CONFIG: dict[str, dict[str, Any]] = {
    "en": {
        "code": "en",
        "name": "English",
        "folder": "default",
        "filename_suffix": "",
        "prompt_name": "English",
        "style_note": (
            "Write natural, idiomatic English for internationally minded high school students "
            "and recent graduates. Avoid calques from Chinese. The result should feel like a "
            "thoughtful, candid alum speaking directly to younger students, not like generic "
            "AI-polished prose."
        ),
        "sort": 1,
    },
    "zh-CN": {
        "code": "zh-CN",
        "name": "简体中文",
        "folder": "chinese",
        "filename_suffix": "-CN",
        "prompt_name": "Simplified Chinese written for readers in mainland China",
        "style_note": (
            "Write fluent, contemporary Simplified Chinese that preserves the original voice, "
            "including any intentional code-switching or informal spoken cadence."
        ),
        "sort": 2,
    },
    "zh-TW": {
        "code": "zh-TW",
        "name": "台灣繁體",
        "folder": "chinese",
        "filename_suffix": "-TW",
        "prompt_name": "Taiwan Traditional Chinese written for readers in Taiwan",
        "style_note": (
            "Use Traditional Chinese characters and Taiwan-preferred wording when it improves "
            "readability, but do not relocate the setting or alter mainland-specific facts, "
            "institutions, apps, or cultural references."
        ),
        "sort": 3,
    },
}

LANGUAGE_ORDER = tuple(LANGUAGE_CONFIG.keys())
KNOWN_FOLDERS = {config["folder"] for config in LANGUAGE_CONFIG.values()}
PREFERRED_SOURCES: dict[str, tuple[str, ...]] = {
    "en": ("zh-CN", "zh-TW"),
    "zh-CN": ("en", "zh-TW"),
    "zh-TW": ("zh-CN", "en"),
}
PREFERRED_FRONT_MATTER_ORDER = [
    "title",
    "category",
    "description",
    "order",
    "author",
    "author_id",
    "guide_id",
    "language_code",
    "language_name",
    "language_folder",
    "language_sort",
]
FRONT_MATTER_PATTERN = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n?", re.DOTALL)
VARIANT_SUFFIX_PATTERN = re.compile(r"-(?:CN|TW)$")
LIQUID_OPEN = re.escape("{{")
LIQUID_CLOSE = re.escape("}}")
SUPPORTED_FOLDERS_PATTERN = "|".join(
    re.escape(folder)
    for folder in sorted(KNOWN_FOLDERS | {"default", "chinese", "简体中文", "台湾繁体"})
)
GUIDE_URL_PATTERN = re.compile(
    rf"(?P<prefix>{LIQUID_OPEN}\s*['\"])/guides/(?:(?:{SUPPORTED_FOLDERS_PATTERN})/)?(?P<slug>[a-z0-9-]+(?:-(?:CN|TW))?)/(?P<suffix>['\"]\s*\|\s*relative_url\s*{LIQUID_CLOSE})"
)
TRANSLATION_TOOL = {
    "name": "guide_translation",
    "description": "Return the translated guide fields.",
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "category": {"type": "string"},
            "description": {"type": "string"},
            "body": {"type": "string"},
        },
        "required": ["title", "category", "description", "body"],
        "additionalProperties": False,
    },
}
SYSTEM_PROMPT = (
    "You are the lead translation editor for the UWC Changshu China Survival Guide. "
    "Produce publication-ready translations that preserve the original author's voice, "
    "tone, pacing, and meaning. You MUST call the guide_translation tool with the "
    "translated fields. Do not return plain text."
)


@dataclass
class GuideDocument:
    path: Path
    guide_id: str
    language_code: str
    language_folder: str
    metadata: dict[str, Any]
    key_order: list[str]
    body: str


@dataclass
class TranslationJob:
    source: GuideDocument
    target_language_code: str
    guide_root: Path

    @property
    def target_path(self) -> Path:
        target_config = LANGUAGE_CONFIG[self.target_language_code]
        filename = f"{self.source.guide_id}{target_config['filename_suffix']}.md"
        return self.guide_root / target_config["folder"] / filename


def parse_scalar(raw_value: str) -> Any:
    value = raw_value.strip()
    if not value:
        return ""

    if value.startswith(("\"", "'")) and value.endswith(("\"", "'")) and len(value) >= 2:
        quote = value[0]
        inner = value[1:-1]
        inner = inner.replace(f"\\{quote}", quote)
        inner = inner.replace("\\n", "\n")
        return inner

    if re.fullmatch(r"-?\d+", value):
        return int(value)

    return value


def parse_front_matter(block: str) -> tuple[dict[str, Any], list[str]]:
    metadata: dict[str, Any] = {}
    key_order: list[str] = []

    for raw_line in block.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if ":" not in line:
            raise ValueError(f"Unsupported front matter line: {raw_line}")

        key, raw_value = line.split(":", 1)
        key = key.strip()
        metadata[key] = parse_scalar(raw_value)
        key_order.append(key)

    return metadata, key_order


def parse_document(path: Path) -> tuple[dict[str, Any], list[str], str]:
    text = path.read_text(encoding="utf-8")
    match = FRONT_MATTER_PATTERN.match(text)
    if match is None:
        raise ValueError(f"{path} is missing YAML front matter")

    metadata, key_order = parse_front_matter(match.group(1))
    body = text[match.end() :]
    return metadata, key_order, body


def render_scalar(value: Any) -> str:
    if isinstance(value, int):
        return str(value)
    return json.dumps(str(value), ensure_ascii=False)


def build_key_order(metadata: dict[str, Any], original_order: list[str]) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()

    for key in PREFERRED_FRONT_MATTER_ORDER + original_order + sorted(metadata):
        if key in metadata and key not in seen:
            ordered.append(key)
            seen.add(key)

    return ordered


def render_document(metadata: dict[str, Any], original_order: list[str], body: str) -> str:
    lines = ["---"]
    for key in build_key_order(metadata, original_order):
        lines.append(f"{key}: {render_scalar(metadata[key])}")
    lines.append("---")
    lines.append("")

    rendered_body = body.rstrip()
    if rendered_body:
        lines.append(rendered_body)
        lines.append("")

    return "\n".join(lines)


def normalize_guide_id(path: Path, metadata: dict[str, Any]) -> str:
    guide_id = str(metadata.get("guide_id") or VARIANT_SUFFIX_PATTERN.sub("", path.stem)).strip()
    if not re.fullmatch(r"[a-z0-9-]+", guide_id):
        raise ValueError(
            f"{path} must use a kebab-case guide_id or filename stem. Got {guide_id!r}."
        )
    return guide_id


def infer_language_code(path: Path, metadata: dict[str, Any]) -> str:
    explicit = str(metadata.get("language_code") or "").strip()
    if explicit in LANGUAGE_CONFIG:
        return explicit

    folder = path.parent.name
    stem = path.stem

    if folder == "default":
        return "en"
    if folder == "chinese" and stem.endswith("-CN"):
        return "zh-CN"
    if folder == "chinese" and stem.endswith("-TW"):
        return "zh-TW"

    raise ValueError(
        f"Cannot infer language for {path}. Set language_code in front matter or use the expected filename pattern."
    )


def relative_path(path: Path) -> str:
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return str(path)


def guide_slug(guide_id: str, language_code: str) -> str:
    return f"{guide_id}{LANGUAGE_CONFIG[language_code]['filename_suffix']}"


def guide_url_path(guide_id: str, language_code: str) -> str:
    config = LANGUAGE_CONFIG[language_code]
    return f"/guides/{config['folder']}/{guide_slug(guide_id, language_code)}/"


def discover_guides(guide_root: Path) -> dict[str, dict[str, GuideDocument]]:
    guides: dict[str, dict[str, GuideDocument]] = {}

    for path in sorted(guide_root.rglob("*.md")):
        rel_path = path.relative_to(guide_root)
        if len(rel_path.parts) < 2:
            continue

        language_folder = rel_path.parts[0]
        if language_folder not in KNOWN_FOLDERS:
            continue

        metadata, key_order, body = parse_document(path)
        guide_id = normalize_guide_id(path, metadata)
        language_code = infer_language_code(path, metadata)

        doc = GuideDocument(
            path=path,
            guide_id=guide_id,
            language_code=language_code,
            language_folder=language_folder,
            metadata=metadata,
            key_order=key_order,
            body=body,
        )

        existing_variants = guides.setdefault(guide_id, {})
        if language_code in existing_variants:
            raise ValueError(
                f"Duplicate guide detected for {guide_id!r} in {language_code!r}: "
                f"{relative_path(existing_variants[language_code].path)} and {relative_path(path)}"
            )
        existing_variants[language_code] = doc

    return guides


def choose_source_document(
    variants: dict[str, GuideDocument], target_language_code: str
) -> GuideDocument:
    for preferred_code in PREFERRED_SOURCES[target_language_code]:
        if preferred_code in variants:
            return variants[preferred_code]

    return max(
        variants.values(),
        key=lambda doc: (
            len(doc.body.strip()),
            -LANGUAGE_CONFIG[doc.language_code]["sort"],
        ),
    )


def plan_translation_jobs(
    guide_root: Path,
    guides: dict[str, dict[str, GuideDocument]],
    guide_id_filter: str | None,
    target_language: str | None,
) -> list[TranslationJob]:
    jobs: list[TranslationJob] = []

    for guide_id, variants in sorted(guides.items()):
        if guide_id_filter and guide_id != guide_id_filter:
            continue

        for candidate_code in LANGUAGE_ORDER:
            if target_language and candidate_code != target_language:
                continue
            if candidate_code in variants:
                continue

            source = choose_source_document(variants, candidate_code)
            jobs.append(
                TranslationJob(
                    source=source,
                    target_language_code=candidate_code,
                    guide_root=guide_root,
                )
            )

    return jobs


def rewrite_internal_guide_links(body: str, target_language_code: str) -> str:
    def replace(match: re.Match[str]) -> str:
        source_slug = match.group("slug")
        guide_id = VARIANT_SUFFIX_PATTERN.sub("", source_slug)
        return (
            f"{match.group('prefix')}"
            f"{guide_url_path(guide_id, target_language_code)}"
            f"{match.group('suffix')}"
        )

    return GUIDE_URL_PATTERN.sub(replace, body)


def load_prompt_template(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Prompt template not found: {path}")
    return path.read_text(encoding="utf-8").strip()


def render_prompt_template(template: str, replacements: dict[str, str]) -> str:
    rendered = template
    for token, value in replacements.items():
        rendered = rendered.replace(token, value)
    return rendered


def build_translation_payload(job: TranslationJob) -> dict[str, str]:
    target_config = LANGUAGE_CONFIG[job.target_language_code]
    source_config = LANGUAGE_CONFIG[job.source.language_code]

    return {
        "guide_id": job.source.guide_id,
        "author": str(job.source.metadata.get("author", "")).strip(),
        "source_language": source_config["prompt_name"],
        "target_language": target_config["prompt_name"],
        "title": str(job.source.metadata.get("title", "")),
        "category": str(job.source.metadata.get("category", "")),
        "description": str(job.source.metadata.get("description", "")),
        "body": rewrite_internal_guide_links(job.source.body, job.target_language_code),
    }


def build_translation_prompt(job: TranslationJob, prompt_template: str) -> str:
    target_config = LANGUAGE_CONFIG[job.target_language_code]
    source_config = LANGUAGE_CONFIG[job.source.language_code]
    payload = build_translation_payload(job)

    return render_prompt_template(
        prompt_template,
        {
            "__SOURCE_LANGUAGE__": source_config["prompt_name"],
            "__TARGET_LANGUAGE__": target_config["prompt_name"],
            "__TARGET_STYLE_NOTE__": target_config["style_note"],
            "__GUIDE_PAYLOAD__": json.dumps(payload, ensure_ascii=False, indent=2),
        },
    )


def post_anthropic(
    job: TranslationJob,
    client: Anthropic,
    model: str,
    prompt_template: str,
) -> Any:
    try:
        return client.messages.create(
            model=model,
            max_tokens=DEFAULT_MAX_OUTPUT_TOKENS,
            system=SYSTEM_PROMPT,
            tools=[TRANSLATION_TOOL],
            tool_choice={"type": "tool", "name": "guide_translation"},
            messages=[
                {
                    "role": "user",
                    "content": build_translation_prompt(job, prompt_template),
                },
            ],
        )
    except Exception as exc:
        raise RuntimeError(f"Anthropic API request failed: {exc}") from exc


def extract_tool_input(response: Any) -> dict[str, Any]:
    for block in response.content:
        if block.type == "tool_use" and block.name == "guide_translation":
            return block.input

    debug_payload = ""
    if hasattr(response, "model_dump_json"):
        debug_payload = response.model_dump_json(indent=2)[:1200]
    elif hasattr(response, "model_dump"):
        debug_payload = json.dumps(response.model_dump(), ensure_ascii=False)[:1200]
    else:
        debug_payload = str(response)[:1200]

    raise RuntimeError(
        "The Anthropic response did not contain a guide_translation tool call. "
        f"Response excerpt: {debug_payload}"
    )


def parse_translation_response(data: dict[str, Any]) -> dict[str, str]:
    required_keys = ("title", "category", "description", "body")
    for key in required_keys:
        if key not in data or not isinstance(data[key], str):
            raise RuntimeError(f"Model output is missing a string field named {key!r}.")

    return {key: data[key] for key in required_keys}


def normalize_translated_body(body: str) -> str:
    normalized = body.replace("\r\n", "\n")
    normalized = re.sub(r"(\}\})\s+\)", r"\1)", normalized)
    normalized = normalized.replace("\\\\[", "\\[").replace("\\\\]", "\\]")
    return normalized


def build_target_metadata(job: TranslationJob, translation: dict[str, str]) -> dict[str, Any]:
    metadata = dict(job.source.metadata)
    target_config = LANGUAGE_CONFIG[job.target_language_code]

    metadata["title"] = translation["title"].strip()
    metadata["category"] = translation["category"].strip()
    metadata["description"] = translation["description"].strip()
    metadata["guide_id"] = job.source.guide_id
    metadata["language_code"] = target_config["code"]
    metadata["language_name"] = target_config["name"]
    metadata["language_folder"] = target_config["folder"]
    metadata["language_sort"] = target_config["sort"]
    metadata.pop("permalink", None)

    return metadata


def write_translation(job: TranslationJob, translation: dict[str, str]) -> Path:
    target_path = job.target_path
    target_path.parent.mkdir(parents=True, exist_ok=True)

    metadata = build_target_metadata(job, translation)
    rendered = render_document(
        metadata,
        job.source.key_order,
        normalize_translated_body(translation["body"]),
    )
    target_path.write_text(rendered, encoding="utf-8")
    return target_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Translate missing guide variants across English, zh-CN, and zh-TW."
    )
    parser.add_argument(
        "--guide-root",
        default=str(DEFAULT_GUIDE_ROOT),
        help="Path to the website/_guides directory.",
    )
    parser.add_argument(
        "--guide-id",
        help="Only translate a single guide_id.",
    )
    parser.add_argument(
        "--target-language",
        choices=LANGUAGE_ORDER,
        help="Only create missing guides for one language code.",
    )
    parser.add_argument(
        "--model",
        help=f"Anthropic model to use. Defaults to ANTHROPIC_MODEL or {DEFAULT_MODEL}.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List missing translations without calling the API.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    load_dotenv(dotenv_path=ENV_FILE)

    try:
        prompt_template = load_prompt_template(PROMPT_TEMPLATE_FILE)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    guide_root = Path(args.guide_root).expanduser().resolve()
    if not guide_root.exists():
        print(f"Guide root does not exist: {guide_root}", file=sys.stderr)
        return 1

    model = args.model or os.environ.get("ANTHROPIC_MODEL", DEFAULT_MODEL)

    try:
        guides = discover_guides(guide_root)
        jobs = plan_translation_jobs(guide_root, guides, args.guide_id, args.target_language)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if not jobs:
        print("No missing translations found.")
        return 0

    if args.dry_run:
        print("Missing translations:")
        for job in jobs:
            print(
                f"- {job.source.guide_id} [{job.target_language_code}]: "
                f"{relative_path(job.source.path)} -> {relative_path(job.target_path)}"
            )
        return 0

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY is not set. Add it to .env or your shell environment.", file=sys.stderr)
        return 1

    client = Anthropic(api_key=api_key)

    for job in jobs:
        print(
            f"Translating {job.source.guide_id} "
            f"from {job.source.language_code} to {job.target_language_code}..."
        )
        try:
            response = post_anthropic(job, client, model, prompt_template)
            tool_input = extract_tool_input(response)
            translation = parse_translation_response(tool_input)
            written_path = write_translation(job, translation)
        except RuntimeError as exc:
            print(f"Failed to translate {job.source.guide_id}: {exc}", file=sys.stderr)
            return 1

        print(f"Created {relative_path(written_path)}")

    print("Finished translating missing guides.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
