import re


def slugify(input: str) -> str:
    value = input.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return re.sub(r"(^-|-$)", "", value)
