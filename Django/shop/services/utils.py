import re


def slugify(input_str: str) -> str:
    s = input_str.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"(^-|-$)", "", s)


def validate_email(email: str) -> str | None:
    email = email.strip()
    if not email or "@" not in email:
        return "Enter a valid email address"
    local, domain = email.rsplit("@", 1)
    if not local or not domain or "." not in domain:
        return "Enter a valid email address"
    return None
