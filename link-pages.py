#!/usr/bin/env python3
"""Wire placeholder links across MatchedIn static pages."""

import re
from pathlib import Path

WEBSITE = Path(__file__).parent

# (link text pattern in anchor, target) — longer / specific first
TEXT_TO_HREF = [
    (r"Community Guidelines", "community-guidelines.html"),
    (r"Terms of Service", "community-guidelines.html"),
    (r"Delete Account Instructions", "delete-account.html"),
    (r"Delete Account", "delete-account.html"),
    (r"Privacy Policy", "privacy.html"),
    (r"Safety Center", "safety.html"),
    (r"Report Abuse", "contact.html"),
    (r"Success Stories", "index.html"),
    (r"Guidelines", "community-guidelines.html"),
    (r"About Us", "index.html"),
    (r"Features", "index.html"),
    (r"Premium", "faq.html"),
    (r"Careers", "contact.html"),
    (r"Profile", "index.html"),
    (r"Settings", "delete-account.html"),
    (r"Terms", "community-guidelines.html"),
    (r"Contact", "contact.html"),
    (r"Privacy", "privacy.html"),
    (r"Safety", "safety.html"),
    (r"Home", "index.html"),
    (r"FAQ", "faq.html"),
]

SITE_META = (
    '<meta content="" name="linkedup-api-url"/>\n'
    '<meta content="help@matchedin.app" name="linkedup-support-email"/>\n'
    '<meta content="false" name="linkedup-api-proxy"/>'
)
SITE_SCRIPTS = """<script src="assets/js/config.js"></script>
<script src="assets/js/api.js"></script>
<script src="assets/js/site.js"></script>"""


def replace_nav_links(html: str) -> str:
    for text, href in TEXT_TO_HREF:
        # href="#" with visible text
        html = re.sub(
            rf'(<a[^>]*href=["\'])#(["\'][^>]*>)\s*{re.escape(text)}\s*</a>',
            rf'\1{href}\2{text}</a>',
            html,
            flags=re.IGNORECASE,
        )
    return html


def fix_logo_home(html: str) -> str:
    if 'href="index.html"' in html[:8000]:
        return html
    html = re.sub(
        r'(<div class="flex items-center gap-2">)\s*(<img alt="MatchedIn Logo")',
        r'\1<a href="index.html" aria-label="MatchedIn Home">\2',
        html,
        count=1,
    )
    if '<a href="index.html" aria-label="MatchedIn Home"><img alt="MatchedIn Logo"' in html:
        html = html.replace(
            '<img alt="MatchedIn Logo"',
            '<img alt="MatchedIn Logo"',
            1,
        )
        # Close anchor after first logo img tag
        html = re.sub(
            r'(<a href="index.html" aria-label="MatchedIn Home"><img alt="MatchedIn Logo"[^>]+/>)',
            r'\1</a>',
            html,
            count=1,
        )
    # Text logo headers
    html = re.sub(
        r'<div class="font-headline-md text-headline-md font-bold text-primary">MatchedIn</div>',
        r'<a href="index.html" class="font-headline-md text-headline-md font-bold text-primary">MatchedIn</a>',
        html,
    )
    return html


def add_site_meta(html: str) -> str:
    if "linkedup-support-email" in html:
        return html
    return html.replace(
        '<meta content="width=device-width, initial-scale=1.0" name="viewport"/>',
        f'<meta content="width=device-width, initial-scale=1.0" name="viewport"/>\n{SITE_META}',
        1,
    )


def add_site_script(html: str) -> str:
    if "assets/js/config.js" in html:
        return html
    if "assets/js/site.js" in html:
        html = html.replace('<script src="assets/js/site.js"></script>', SITE_SCRIPTS)
        return html
    return html.replace("</body>", f"{SITE_SCRIPTS}\n</body>")


def fix_contact_delete_cta(html: str) -> str:
    return html.replace(
        'href="#">\n                                Delete Account Instructions',
        'href="delete-account.html">\n                                Delete Account Instructions',
    )


def fix_delete_form(html: str) -> str:
    if "delete-account-form" in html:
        return html
    html = html.replace(
        '<section class="space-y-8">',
        '<section class="space-y-8"><form id="delete-account-form" class="space-y-8" onsubmit="return false;">',
        1,
    )
    # Wrap confirmation section - find submit button area
    if "delete-account.html" in str(WEBSITE):
        pass
    return html


def process_file(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    html = replace_nav_links(html)
    html = fix_logo_home(html)
    if path.name == "contact.html":
        html = fix_contact_delete_cta(html)
    html = add_site_meta(html)
    html = add_site_script(html)
    path.write_text(encoding="utf-8", data=html)
    print(f"Linked: {path.name}")


def main() -> None:
    for html_file in sorted(WEBSITE.glob("*.html")):
        process_file(html_file)


if __name__ == "__main__":
    main()
