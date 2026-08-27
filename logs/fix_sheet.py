import re

path = r"C:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\src\pages\InteractiveMap.js"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Match: from "{/* Search */}" up to (but not including) "{/* Filters (only when "all") */}"
pattern = re.compile(
    r"\s*\{/\* Search \*/\}.*?\{/\* Filters \(only when \"all\"\) \*/\}",
    re.DOTALL,
)

replacement = (
    "\n          {/* Search removed from the mobile sheet \u2014 the user can use the map controls. */}"
    "\n\n          {/* Filters (only when \"all\") */}"
)

new_content, n = pattern.subn(replacement, content, count=1)

if n == 0:
    print("NO CHANGE - pattern did not match")
else:
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"OK - {n} replacement(s), file size: {len(new_content)} bytes (was {len(content)})")
