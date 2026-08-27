"""Check specific dead components."""
import os
import re

TARGETS = [
    "Profile.js",
    "WelcomeModal.js",
    "SuggestionModal.js",
    "ViewProfile.js",
]
ROOT = r"C:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\src"
EXTENSIONS = (".js", ".jsx")

for target in TARGETS:
    print(f"=== {target} ===")
    base = re.sub(r"\.jsx?$", "", target)
    pattern = (
        r"(?:^|[\s/\"\'])"
        + re.escape(base)
        + r"(?:$|[\s/\"\'.])"
    )
    found = False
    for dirpath, _, files in os.walk(ROOT):
        if "node_modules" in dirpath:
            continue
        for f in files:
            if not f.endswith(EXTENSIONS):
                continue
            if f == target:
                continue
            path = os.path.join(dirpath, f)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    content = fh.read()
            except Exception:
                continue
            for m in re.finditer(pattern, content):
                # Skip if it's part of a longer word
                rel = path.replace(ROOT + os.sep, "")
                # Check that the match is exactly the base name, not a prefix
                match_text = m.group(0).strip()
                # If match has additional chars, skip
                if base not in match_text or base == match_text.strip("\"'/ "):
                    continue
                # Get the actual matched text
                start, end = m.span()
                # The actual base name match
                actual = content[start:end].strip("\"'/ .")
                if actual == base:
                    print(f"  {rel} -> match: {match_text!r}")
                    found = True
                    break
    if not found:
        print(f"  No references. Safe to delete.")
