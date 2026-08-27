"""Replace old colors with v3 tokens across the project.

Mappings:
  #2bb6a3 -> #FF9900 (accent)
  #1a8b7c -> #E68A00 (accent strong)
  #0A6B58 -> #C26A00 (deeper accent)
  #F4F7FA -> #FBFBFD (off-white)
  #e74c3c -> #DC2626 (danger) — only if not in a CSS file that defines its own --gm-red

Strategy: be conservative, only replace in files that are NOT defining their own color system.
"""
import os
import re

ROOT = r"C:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\src"
EXTENSIONS = (".css", ".js", ".jsx")

REPLACEMENTS = {
    "#2bb6a3": "#FF9900",
    "#2BB6A3": "#FF9900",
    "#1a8b7c": "#E68A00",
    "#0A6B58": "#C26A00",
    "#0a6b58": "#C26A00",
    "#F4F7FA": "#FBFBFD",
    "#f4f7fa": "#FBFBFD",
    "#e74c3c": "#DC2626",  # danger red (was the old red)
}

# Skip files that define their own design tokens
SKIP_FILES = {
    "styles/tokens.css",
    "styles/design-system.css",
    "styles/pages/trip-planner-modern.css",  # has its own --gm-red
}

def main():
    total = 0
    for dirpath, _, files in os.walk(ROOT):
        if "node_modules" in dirpath:
            continue
        for f in files:
            if not f.endswith(EXTENSIONS):
                continue
            path = os.path.join(dirpath, f)
            rel = path.replace(ROOT + os.sep, "")
            if rel in SKIP_FILES:
                continue
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    content = fh.read()
            except Exception:
                continue
            orig = content
            for old, new in REPLACEMENTS.items():
                content = content.replace(old, new)
            if content != orig:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(content)
                count = sum(orig.count(o) for o in REPLACEMENTS.keys())
                total += count
                print(f"  {rel}  (replaced {count} occurrences)")
    print(f"\nTotal: {total} occurrences replaced")


if __name__ == "__main__":
    main()
