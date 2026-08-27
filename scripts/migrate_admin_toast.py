"""Migrate admin pages from legacy Toast to global useToast.

This script:
1. Removes the `import Toast from '../Toast';` line
2. Adds `import { useToast } from '../ui';`
3. Removes the local `const [toast, setToast] = useState(...)` and `showToast`/`closeToast` declarations
4. Replaces `toast.message`/`toast.type`/`toast.show` with `toast.success(msg)` / `toast.danger(msg)` / `toast.info(msg)`
5. Removes the `<Toast />` JSX render

This is a heuristic migration; some pages may need manual cleanup.
"""
import os
import re

ROOT = r"C:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\src\components\admin"

def migrate(path):
    with open(path, "r", encoding="utf-8") as fh:
        content = fh.read()
    orig = content

    # 1. Remove the legacy Toast import
    content = re.sub(
        r"import\s+Toast\s+from\s+['\"]\.\./Toast['\"];?\s*\n",
        "",
        content,
    )
    content = re.sub(
        r"import\s+Toast\s+from\s+['\"]\.\./\.\./components/Toast['\"];?\s*\n",
        "",
        content,
    )

    # 2. Add useToast import if not present
    if "useToast" not in content:
        # find the last import line and add useToast
        if "from '../ui'" in content:
            # already has '../ui' import, add to it
            content = re.sub(
                r"(import\s+\{[^}]*\}\s+from\s+['\"]\.\./ui['\"];?)",
                lambda m: m.group(1).rstrip(";") + ", useToast;",
                content,
            )
        else:
            # add a new import after the first import
            content = re.sub(
                r"(import[^;]+;)",
                r"\1\nimport { useToast } from '../ui';",
                content,
                count=1,
            )

    # 3. Remove the legacy useState for toast
    content = re.sub(
        r"//?\s*Toast state.*\n\s*const\s+\[toast,\s*setToast\]\s*=\s*useState\([^)]+\);\s*\n",
        "",
        content,
    )
    content = re.sub(
        r"\s*const\s+\[toast,\s*setToast\]\s*=\s*useState\(\s*\{\s*message:\s*['\"][^'\"]*['\"],\s*type:\s*['\"][^'\"]*['\"],\s*show:\s*(?:false|true)\s*\}\s*\);\s*\n",
        "\n",
        content,
    )
    # also a more general catch
    content = re.sub(
        r"\s*const\s+\[toast,\s*setToast\]\s*=\s*useState\(\{[^}]*\}\);\s*\n",
        "\n",
        content,
    )

    # 4. Add `const toast = useToast();` if there's no `const toast =` anywhere
    if "const toast = useToast" not in content and "useToast()" not in content:
        # insert after the first `const [` line
        match = re.search(r"(\s*const\s+\[[^\]]+\]\s*=\s*useState)", content)
        if match:
            insert_pos = match.end()
            content = content[:insert_pos] + "\n  const toast = useToast();" + content[insert_pos:]

    # 5. Replace showToast/closeToast calls
    content = re.sub(
        r"showToast\(['\"]([^'\"]+)['\"]\s*,\s*['\"]error['\"]\)",
        r"toast.danger('\1')",
        content,
    )
    content = re.sub(
        r"showToast\(['\"]([^'\"]+)['\"]\s*,\s*['\"]success['\"]\)",
        r"toast.success('\1')",
        content,
    )
    content = re.sub(
        r"showToast\(['\"]([^'\"]+)['\"]\s*,\s*['\"]info['\"]\)",
        r"toast.info('\1')",
        content,
    )
    content = re.sub(
        r"showToast\(['\"]([^'\"]+)['\"]\s*,\s*['\"]warning['\"]\)",
        r"toast.info('\1')",
        content,
    )

    # 6. Remove the <Toast /> JSX (single-line and multi-line)
    content = re.sub(
        r"\s*<Toast\s+[^/]*?message=\{toast\.message\}[^/]*?type=\{toast\.type\}[^/]*?(?:isVisible|show)=\{toast\.(?:isVisible|show)\}[^/]*?onClose=\{[^}]*\}[^>]*?/>\s*\n?",
        "\n",
        content,
        flags=re.DOTALL,
    )

    if content != orig:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
        return True
    return False


def main():
    for f in os.listdir(ROOT):
        if not f.endswith(".js"):
            continue
        path = os.path.join(ROOT, f)
        try:
            if migrate(path):
                print(f"  Migrated: {f}")
        except Exception as e:
            print(f"  Error migrating {f}: {e}")


if __name__ == "__main__":
    main()
