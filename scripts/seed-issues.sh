#!/usr/bin/env bash
set -euo pipefail
repo=${1:-}
mode=${2:---dry-run}
[[ $# -ge 1 && $# -le 2 && $repo =~ ^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$ && $mode =~ ^--(dry-run|apply)$ ]] ||
  { echo "Penggunaan: bash scripts/seed-issues.sh OWNER/REPO [--dry-run|--apply]" >&2; exit 2; }
cd "$(dirname "$0")/.."
[[ $mode == --dry-run ]] || gh repo view "$repo" --json viewerPermission --jq '.viewerPermission' | grep -Eq '^(ADMIN|MAINTAIN|WRITE)$'
if [[ $mode == --apply ]]; then
  existing=$(gh api --paginate "repos/$repo/issues?state=open&per_page=100" --jq '.[] | select(.pull_request == null) | .title')
fi
for file in issues/S*.md; do
  { IFS= read -r heading; IFS= read -r spec; } < "$file"
  [[ $heading == '# '* && $spec == 'labels:'* ]] || { echo "Format tidak valid: $file" >&2; exit 2; }
  title=${heading#\# }
  echo "$(basename "$file"): $title"
  [[ $mode == --apply ]] || continue
  if grep -Fqx -- "$title" <<< "$existing"; then continue; fi
  IFS=',' read -r -a labels <<< "${spec#labels:}"
  flags=()
  for label in "${labels[@]}"; do
    label=${label#"${label%%[![:space:]]*}"}
    [[ -n $label ]] || continue
    gh label create "$label" -R "$repo" --color '5369A5' --force
    flags+=(--label "$label")
  done
  tail -n +3 "$file" | gh issue create -R "$repo" --title "$title" --body-file - "${flags[@]}"
done
