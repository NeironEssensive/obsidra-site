"""Скачивает шрифты сайта с Google Fonts и пишет fonts.css с локальными путями.

Берём только нужные подмножества (кириллица и латиница), вариативные woff2.
"""
import re
import sys
import urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])
CSS_URL = (
    "https://fonts.googleapis.com/css2"
    "?family=JetBrains+Mono:wght@400..500"
    "&family=Manrope:wght@400..700"
    "&family=Unbounded:wght@400..700"
    "&display=swap"
)
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
SUBSETS = {"cyrillic", "cyrillic-ext", "latin", "latin-ext"}
LICENSES = {
    "JetBrainsMono": "https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/OFL.txt",
    "Manrope": "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt",
    "Unbounded": "https://raw.githubusercontent.com/google/fonts/main/ofl/unbounded/OFL.txt",
}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


css = get(CSS_URL).decode("utf-8")
blocks = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{.*?\})", css, re.S)

OUT.mkdir(parents=True, exist_ok=True)
rules = []
for subset, block in blocks:
    if subset not in SUBSETS:
        continue
    family = re.search(r"font-family:\s*'([^']+)'", block).group(1)
    url = re.search(r"src:\s*url\(([^)]+)\)", block).group(1)
    if not url.startswith("https://fonts.gstatic.com/"):
        raise SystemExit(f"неожиданный источник шрифта: {url}")
    name = f"{family.lower().replace(' ', '-')}-{subset}.woff2"
    data = get(url)
    if data[:4] != b"wOF2":
        raise SystemExit(f"{name}: это не woff2")
    (OUT / name).write_bytes(data)
    local = re.sub(r"url\([^)]+\)", f"url({name})", block)
    rules.append(f"/* {family}, {subset} */\n{local}")
    print(f"{name:40} {len(data) // 1024:4} KB")

header = (
    "/* Шрифты хранятся в репозитории, чтобы сайт не зависел от Google Fonts.\n"
    "   Все три семейства — под лицензией SIL OFL 1.1 (тексты лицензий — рядом, OFL-*.txt).\n"
    "   Пересобрать: python tools/fetch_fonts.py fonts */\n\n"
)
(OUT / "fonts.css").write_text(header + "\n\n".join(rules) + "\n", encoding="utf-8")

for family, url in LICENSES.items():
    (OUT / f"OFL-{family}.txt").write_bytes(get(url))
    print(f"OFL-{family}.txt")
