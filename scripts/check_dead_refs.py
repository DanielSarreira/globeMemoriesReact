"""Check if any test or source file still references dead components."""
import os
import re

REMOVED = [
    "Profile.js",
    "WelcomeModal.js",
    "SuggestionModal.js",
    "ViewProfile.js",
    "Toast.js",
]
ROOT = r"C:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\src"
EXTENSIONS = (".js", ".jsx")

def main():
    found_any = False
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
            for target in REMOVED:
                base = re.sub(r"\.jsx?$", "", target)
                # Look for /Profile or from 'Profile' or "Profile" with word boundary
                pattern = (
                    r"(?:^|[\s/\"\'])"
                    + re.escape(base)
                    + r"(?:$|[\s/\"\'.])"
                )
                for m in re.finditer(pattern, content):
                    rel = path.replace(ROOT + os.sep, "")
                    # Skip the file itself
                    if f == target:
                        continue
                    print(f"  {rel} -> match: {m.group(0).strip()!r}")
                    found_any = True
                    break
    if not found_any:
        print("No references found. Clean!")

if __name__ == "__main__":
    main()
