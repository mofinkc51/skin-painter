#!/usr/bin/env bash
# Create the GitHub repo, push this folder, and turn on GitHub Pages (deployed by GitHub Actions).
# Needs: git and GitHub CLI (https://cli.github.com) signed in with `gh auth login`.
# Usage: scripts/publish.sh [repo-name] [public|private]
set -euo pipefail
REPO="${1:-skin-texture-painter}"
VIS="${2:-public}"
cd "$(dirname "$0")/.."

for c in git gh; do command -v "$c" >/dev/null || { echo "$c is not installed." >&2; exit 1; }; done
gh auth status >/dev/null 2>&1 || { echo "GitHub CLI is not signed in. Run: gh auth login" >&2; exit 1; }
OWNER="$(gh api user --jq .login)"

# Install the Pages workflow (kept in deploy/ so it can be reviewed first)
if [ ! -f .github/workflows/pages.yml ]; then
  mkdir -p .github/workflows && cp deploy/pages.yml .github/workflows/pages.yml
  echo "Added .github/workflows/pages.yml"
fi

[ -d .git ] || git init -b main >/dev/null
git add -A
git diff --cached --quiet || git commit -m "Publish Skin Texture Painter" >/dev/null

if gh repo view "$OWNER/$REPO" >/dev/null 2>&1; then
  echo "Repo $OWNER/$REPO already exists, pushing..."
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$OWNER/$REPO.git"
  git push -u origin main
else
  echo "Creating $OWNER/$REPO ($VIS)..."
  gh repo create "$OWNER/$REPO" "--$VIS" --source . --remote origin --push
fi

gh api -X POST "repos/$OWNER/$REPO/pages" -f build_type=workflow >/dev/null 2>&1 \
  || gh api -X PUT "repos/$OWNER/$REPO/pages" -f build_type=workflow >/dev/null 2>&1 || true
gh workflow run pages.yml -R "$OWNER/$REPO" >/dev/null 2>&1 || true

echo
echo "Done. The deploy takes about a minute:"
echo "  Actions: https://github.com/$OWNER/$REPO/actions"
echo "  Site:    https://$OWNER.github.io/$REPO/"
