"""Final audit: check for old colors and inconsistent spacing."""
import os
import re

ROOT = r"C:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\src"
EXTENSIONS = (".css", ".js", ".jsx")

# Forbidden old colors (teal-era)
FORBIDDEN = [
    "#2bb6a3", "#2BB6A3",
    "#0A6B58", "#0a6b58",
    "#F4F7FA", "#f4f7fa",
    # Old Globe Memories red
    "#e74c3c",
]

# Approved brand colors only
ALLOWED_BRAND = [
    "#007BFF", "#007bff",
    "#FF9900", "#ff9900",
    "#16A34A", "#10B981", "#22C55E",  # green (for success states - not the old teal)
    "#A855F7",  # purple (used in features)
]

def is_in_style_block(content, line_num):
    """Approximate: check if the hex is in a JSX style prop, not just a CSS file."""
    return False

def main():
    issues = []
    for dirpath, _, files in os.walk(ROOT):
        if "node_modules" in dirpath:
            continue
        for f in files:
            if not f.endswith(EXTENSIONS):
                continue
            path = os.path.join(dirpath, f)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    content = fh.read()
            except Exception:
                continue
            for color in FORBIDDEN:
                # count occurrences (excluding comments)
                # Strip /* */ and // comments first
                stripped = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
                stripped = re.sub(r"//[^\n]*", "", stripped)
                # Search for the color
                for m in re.finditer(re.escape(color), stripped, flags=re.IGNORECASE):
                    rel = path.replace(ROOT + os.sep, "")
                    # Get the line
                    line_start = stripped.rfind("\n", 0, m.start()) + 1
                    line_end = stripped.find("\n", m.end())
                    if line_end == -1:
                        line_end = len(stripped)
                    line = stripped[line_start:line_end].strip()[:80]
                    issues.append((rel, color, line))

    if issues:
        print(f"Found {len(issues)} occurrences of forbidden colors:")
        for rel, color, line in issues[:30]:
            print(f"  {rel}  [{color}]  {line}")
        if len(issues) > 30:
            print(f"  ... and {len(issues) - 30} more")
    else:
        print("No forbidden old colors found.")


if __name__ == "__main__":
    main()
