# Create the GitHub repo, push this folder, and turn on GitHub Pages (deployed by GitHub Actions).
# Needs: git and GitHub CLI (https://cli.github.com) signed in with `gh auth login`.
# Run from this folder:  powershell -ExecutionPolicy Bypass -File scripts\publish.ps1
param(
  [string]$Repo = "skin-texture-painter",
  [ValidateSet("public","private")][string]$Visibility = "public"
)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

foreach ($cmd in "git","gh") {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$cmd is not installed. Install it, then run this script again." }
}
gh auth status *> $null
if ($LASTEXITCODE -ne 0) { throw "GitHub CLI is not signed in. Run: gh auth login" }
$owner = gh api user --jq .login

# Install the Pages workflow (kept in deploy/ so it can be reviewed first)
if (-not (Test-Path .github\workflows\pages.yml)) {
  New-Item -ItemType Directory -Force .github\workflows | Out-Null
  Copy-Item deploy\pages.yml .github\workflows\pages.yml
  Write-Host "Added .github/workflows/pages.yml"
}

if (-not (Test-Path .git)) { git init -b main | Out-Null }
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -m "Publish Skin Texture Painter" | Out-Null }

gh repo view "$owner/$Repo" *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating $owner/$Repo ($Visibility)..."
  gh repo create "$owner/$Repo" "--$Visibility" --source . --remote origin --push
} else {
  Write-Host "Repo $owner/$Repo already exists, pushing..."
  git remote get-url origin *> $null
  if ($LASTEXITCODE -ne 0) { git remote add origin "https://github.com/$owner/$Repo.git" }
  git push -u origin main
}

# Pages source = GitHub Actions (create, or update if it already exists)
gh api -X POST "repos/$owner/$Repo/pages" -f build_type=workflow *> $null
if ($LASTEXITCODE -ne 0) { gh api -X PUT "repos/$owner/$Repo/pages" -f build_type=workflow *> $null }
gh workflow run pages.yml -R "$owner/$Repo" *> $null

Write-Host ""
Write-Host "Done. The deploy takes about a minute:"
Write-Host "  Actions: https://github.com/$owner/$Repo/actions"
Write-Host "  Site:    https://$owner.github.io/$Repo/"
