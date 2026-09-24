#!/bin/sh
# Netlify `ignore` command: exit 0 skips the build, exit 1 runs it.
#
# The site is on Netlify's Legacy free plan, where every build — production and deploy
# preview — spends build minutes. A commit that only touches files which cannot change
# out/ (docs, specs, tests, CI config) is skipped. Anything else builds, and so does any
# case this script cannot reason about: no previous build to diff against, a commit
# missing from the clone, or a redeploy of the same commit.
#
# The list below is of paths that are safe to skip. Keeping it as an allowlist means a
# new top-level directory builds by default. See docs/specs/committed-image-variants.md.

[ -n "$CACHED_COMMIT_REF" ] || exit 1
[ "$CACHED_COMMIT_REF" != "$COMMIT_REF" ] || exit 1

changed=$(git diff --name-only "$CACHED_COMMIT_REF" "$COMMIT_REF") || exit 1
[ -n "$changed" ] || exit 1

skippable='^(docs/|\.github/|\.claude/|[^/]+\.md$|codecov\.yml$|jest\.(config|setup)\.ts$|.+\.test\.tsx?$)'

if printf '%s\n' "$changed" | grep -Eqv "$skippable"; then
  exit 1
fi

echo "Only docs, tests or CI config changed since $CACHED_COMMIT_REF; skipping build."
exit 0
